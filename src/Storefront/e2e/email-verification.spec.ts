import { APIRequestContext, expect, test } from '@playwright/test';

// MailHog's own port (docker-compose.yml / AppHost.cs), not proxied through the
// Storefront or gateway — same URL README.md "Mail (dev)" tells a human to open.
const MAILHOG_API = 'http://localhost:8025/api/v2/messages';
const KRATOS_PUBLIC_URL = 'http://kratos.gatehouse.test:4433';

interface MailHogMessage {
  Created: string;
  To: { Mailbox: string; Domain: string }[];
  Content: { Headers: { Subject: string[] } };
}

// Kratos's courier dispatches asynchronously (kratos.yml / AppHost.cs's
// --watch-courier runs it as a background loop, not inline with the request that
// enqueued the mail — verified against a real container), so the message can lag
// a beat behind the flow submission that triggered it; polling absorbs that.
async function readVerificationCode(request: APIRequestContext, email: string): Promise<string> {
  const [mailbox, domain] = email.split('@');

  for (let attempt = 0; attempt < 20; attempt++) {
    const response = await request.get(MAILHOG_API);
    const { items }: { items: MailHogMessage[] } = await response.json();

    const messages = items
      .filter((item) => item.To.some((to) => to.Mailbox === mailbox && to.Domain === domain))
      .sort((a, b) => b.Created.localeCompare(a.Created));

    const match = messages[0]?.Content.Headers.Subject[0]?.match(/Use code (\d{6})/);
    if (match) {
      return match[1];
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`No verification mail arrived for ${email}`);
}

// End-to-end payoff of issue #25: a newly registered customer's address starts
// unverified, and typing the code MailHog actually received into the
// Storefront's generic flow-node UI (same renderer as login/registration, no
// field named here either) is what flips it — checked against Kratos's own
// session record, not just a UI message.
test('register, verify email via the code MailHog received, and end up verified', async ({
  page,
  request,
}) => {
  const email = `verify-${Date.now()}@example.test`;
  const password = 'correct-horse-battery-staple';

  await test.step('register', async () => {
    await page.goto('/registration');
    await page.locator('[data-kratos-node="traits.email"]').fill(email);
    await page.locator('[data-kratos-node="method:profile"]').click();

    await page.locator('[data-kratos-node="password"]').waitFor();
    await page.locator('[data-kratos-node="password"]').fill(password);
    await page.locator('[data-kratos-node="method:password"]').click();

    await page.waitForURL('**/products');
  });

  await test.step('request a verification code from the Storefront verification page', async () => {
    await page.goto('/verification');
    await page.locator('[data-kratos-node="email"]').fill(email);
    await page.locator('[data-kratos-node="method:code"]').click();

    await page.locator('[data-kratos-node="code"]').waitFor();
  });

  await test.step('submit the code MailHog received', async () => {
    const code = await readVerificationCode(request, email);

    await page.locator('[data-kratos-node="code"]').fill(code);
    await page.locator('[data-kratos-node="method:code"]').click();

    await expect(page.getByText('You successfully verified your email address.')).toBeVisible();
    await expect(page.locator('[data-kratos-node="continue"]')).toHaveAttribute(
      'href',
      /\/products$/,
    );
  });

  await test.step('the identity is marked verified in Kratos, not just in the UI', async () => {
    const whoami = await page.context().request.get(`${KRATOS_PUBLIC_URL}/sessions/whoami`, {
      headers: { Accept: 'application/json' },
    });
    const session = await whoami.json();

    expect(session.identity.verifiable_addresses).toContainEqual(
      expect.objectContaining({ value: email, verified: true }),
    );
  });
});
