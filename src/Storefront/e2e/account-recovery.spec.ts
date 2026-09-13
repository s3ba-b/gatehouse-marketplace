import { APIRequestContext, expect, test } from '@playwright/test';

// MailHog's own port (docker-compose.yml / AppHost.cs), not proxied through the
// Storefront or gateway — same URL README.md "Mail (dev)" tells a human to open.
const MAILHOG_API = 'http://localhost:8025/api/v2/messages';

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

// Registration also sends a verification mail to the same address, so "the
// recovery code MailHog received" is ambiguous by mailbox alone — matched by
// subject instead (same reasoning as email-verification.spec.ts's
// waitForNewVerificationCode, just keyed on "recover" rather than "verify").
async function waitForRecoveryCode(request: APIRequestContext, email: string): Promise<string> {
  const [mailbox, domain] = email.split('@');

  for (let attempt = 0; attempt < 20; attempt++) {
    const messages = (await messagesFor(request, mailbox, domain)).sort((a, b) =>
      b.Created.localeCompare(a.Created),
    );

    const match = messages
      .map((item) => item.Content.Headers.Subject[0])
      .find((subject) => /recover/i.test(subject))
      ?.match(/Use code (\d{6})/);
    if (match) {
      return match[1];
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`No recovery mail arrived for ${email}`);
}

// End-to-end payoff of issue #26: a customer who lost access requests
// recovery, types the code MailHog actually received into the Storefront's
// generic flow-node UI (no field named here either, same renderer as
// login/registration/verification), lands on the settings flow recovery
// hands off to, and sets a new password — checked by logging in with it
// afterwards, not just a UI message.
test('recover access via the code MailHog received, set a new password, and log in with it', async ({
  page,
  request,
}) => {
  const email = `recovery-${Date.now()}@example.test`;
  const oldPassword = 'correct-horse-battery-staple';
  const newPassword = 'new-horse-battery-staple-2';

  await test.step('register', async () => {
    await page.goto('/registration');
    await page.locator('[data-kratos-node="traits.email"]').fill(email);
    await page.locator('[data-kratos-node="method:profile"]').click();

    await page.locator('[data-kratos-node="password"]').waitFor();
    await page.locator('[data-kratos-node="password"]').fill(oldPassword);
    await page.locator('[data-kratos-node="method:password"]').click();

    await page.waitForURL('**/products');
  });

  await test.step('request recovery from a clean session', async () => {
    await page.context().clearCookies();

    await page.goto('/recovery');
    await page.locator('[data-kratos-node="email"]').fill(email);
    await page.locator('[data-kratos-node="method:code"]').click();

    await page.locator('[data-kratos-node="code"]').waitFor();
  });

  await test.step('submit the code MailHog received and land on the settings flow', async () => {
    const code = await waitForRecoveryCode(request, email);

    await page.locator('[data-kratos-node="code"]').fill(code);
    await page.locator('[data-kratos-node="method:code"]').click();

    await page.waitForURL('**/settings?flow=*');
    await expect(page.locator('[data-kratos-node="password"]')).toBeVisible();
  });

  await test.step('set a new password from the settings page', async () => {
    await page.locator('[data-kratos-node="password"]').fill(newPassword);
    await page.locator('[data-kratos-node="method:password"]').click();

    await expect(page.getByText('Your changes have been saved!')).toBeVisible();
  });

  await test.step('the old password no longer works', async () => {
    // Setting the new password left the recovery-issued session active
    // (settings doesn't log the user out) — Kratos's login flow refuses to
    // even start while a session already exists (400 session_already_available,
    // verified against a real container), so this needs a clean session just
    // like re-login in registration-login-products.spec.ts.
    await page.context().clearCookies();

    await page.goto('/login');
    await page.locator('[data-kratos-node="identifier"]').fill(email);
    await page.locator('[data-kratos-node="password"]').fill(oldPassword);
    await page.locator('[data-kratos-node="method:password"]').click();

    await expect(page.getByText(/credentials are invalid/i)).toBeVisible();
  });

  await test.step('logging in with the new password succeeds', async () => {
    await page.goto('/login');
    await page.locator('[data-kratos-node="identifier"]').fill(email);
    await page.locator('[data-kratos-node="password"]').fill(newPassword);
    await page.locator('[data-kratos-node="method:password"]').click();

    await page.waitForURL('**/products');
  });
});
