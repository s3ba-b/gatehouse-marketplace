import { APIRequestContext, expect, test } from '@playwright/test';

// MailHog's own port (docker-compose.yml / AppHost.cs), not proxied through the
// Storefront or gateway — same URL README.md "Mail (dev)" tells a human to open.
const MAILHOG_API = 'http://localhost:8025/api/v2/messages';
const KRATOS_PUBLIC_URL = 'http://kratos.gatehouse.test:4433';

interface MailHogMessage {
  ID: string;
  Created: string;
  To: { Mailbox: string; Domain: string }[];
  Content: { Headers: { Subject: string[] } };
}

async function messagesFor(
  request: APIRequestContext,
  mailbox: string,
  domain: string,
): Promise<MailHogMessage[]> {
  const response = await request.get(MAILHOG_API);
  const { items }: { items: MailHogMessage[] } = await response.json();
  return items.filter((item) =>
    item.To.some((to) => to.Mailbox === mailbox && to.Domain === domain),
  );
}

// Registration alone already triggers one verification mail, and the test below
// requests a second one from the Storefront verification page — so "the code
// MailHog received" is ambiguous by arrival order alone: the courier dispatches
// asynchronously (kratos.yml / AppHost.cs's --watch-courier runs it as a
// background loop, not inline with the request that enqueued the mail — verified
// against a real container), so the first mail's actual delivery can still be in
// flight when the second one is requested, and a timestamp cutoff can't tell them
// apart reliably. Message IDs can: this waits for a mail whose ID isn't in
// `excludeIds`, which the caller populates from mail that's already fully landed
// before triggering the resend.
async function waitForNewVerificationCode(
  request: APIRequestContext,
  email: string,
  excludeIds: ReadonlySet<string>,
): Promise<string> {
  const [mailbox, domain] = email.split('@');

  for (let attempt = 0; attempt < 20; attempt++) {
    const messages = (await messagesFor(request, mailbox, domain))
      .filter((item) => !excludeIds.has(item.ID))
      .sort((a, b) => b.Created.localeCompare(a.Created));

    const match = messages[0]?.Content.Headers.Subject[0]?.match(/Use code (\d{6})/);
    if (match) {
      return match[1];
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`No new verification mail arrived for ${email}`);
}

async function waitForAnyMail(
  request: APIRequestContext,
  mailbox: string,
  domain: string,
): Promise<Set<string>> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const messages = await messagesFor(request, mailbox, domain);
    if (messages.length > 0) {
      return new Set(messages.map((item) => item.ID));
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`No verification mail (from registration) arrived for ${mailbox}@${domain}`);
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
  const [mailbox, domain] = email.split('@');

  await test.step('register', async () => {
    await page.goto('/registration');
    await page.locator('[data-kratos-node="traits.email"]').fill(email);
    await page.locator('[data-kratos-node="method:profile"]').click();

    await page.locator('[data-kratos-node="password"]').waitFor();
    await page.locator('[data-kratos-node="password"]').fill(password);
    await page.locator('[data-kratos-node="method:password"]').click();

    await page.waitForURL('**/products');
  });

  let mailBeforeResend = new Set<string>();

  await test.step('request a verification code from the Storefront verification page', async () => {
    // Waited for here, not just discarded: without this, its later, delayed
    // delivery could land after the resend below and be mistaken for the fresh
    // code (see waitForNewVerificationCode).
    mailBeforeResend = await waitForAnyMail(request, mailbox, domain);

    await page.goto('/verification');
    await page.locator('[data-kratos-node="email"]').fill(email);
    await page.locator('[data-kratos-node="method:code"]').click();

    await page.locator('[data-kratos-node="code"]').waitFor();
  });

  await test.step('submit the code MailHog received', async () => {
    const code = await waitForNewVerificationCode(request, email, mailBeforeResend);

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
