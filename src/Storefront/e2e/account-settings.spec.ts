import { Page, expect, test } from '@playwright/test';

async function register(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/registration');
  await page.locator('[data-kratos-node="traits.email"]').fill(email);
  await page.locator('[data-kratos-node="method:profile"]').click();

  await page.locator('[data-kratos-node="password"]').waitFor();
  await page.locator('[data-kratos-node="password"]').fill(password);
  await page.locator('[data-kratos-node="method:password"]').click();

  await page.waitForURL('**/products');
}

async function logIn(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.locator('[data-kratos-node="identifier"]').fill(email);
  await page.locator('[data-kratos-node="password"]').fill(password);
  await page.locator('[data-kratos-node="method:password"]').click();
}

// End-to-end payoff of issue #27: a logged-in customer reaches the settings
// page from the products page and changes their password on Kratos's
// settings flow (same generic flow-node renderer, one form per method group)
// — checked by logging in with it afterwards, not just a UI message.
test('change the password from account settings and log in with the new one', async ({ page }) => {
  const email = `settings-password-${Date.now()}@example.test`;
  const oldPassword = 'correct-horse-battery-staple';
  const newPassword = 'new-horse-battery-staple-2';

  await test.step('register and open account settings', async () => {
    await register(page, email, oldPassword);

    await page.getByRole('link', { name: 'Account settings' }).click();
    await page.waitForURL('**/settings');
  });

  await test.step('change the password', async () => {
    const passwordSection = page.locator('[data-kratos-group="password"]');
    await passwordSection.locator('[data-kratos-node="password"]').fill(newPassword);
    await passwordSection.locator('[data-kratos-node="method:password"]').click();

    await expect(page.getByText('Your changes have been saved!')).toBeVisible();
  });

  await test.step('the old password no longer works', async () => {
    // Kratos refuses to start a login flow while a session exists (see
    // account-recovery.spec.ts), so drop the one registration created.
    await page.context().clearCookies();

    await logIn(page, email, oldPassword);
    await expect(page.getByText(/credentials are invalid/i)).toBeVisible();
  });

  await test.step('logging in with the new password succeeds', async () => {
    await logIn(page, email, newPassword);
    await page.waitForURL('**/products');
  });
});

test('update a profile trait from account settings and see it persisted', async ({ page }) => {
  const email = `settings-profile-${Date.now()}@example.test`;

  await register(page, email, 'correct-horse-battery-staple');
  await page.goto('/settings');

  const profileSection = page.locator('[data-kratos-group="profile"]');
  await profileSection.locator('[data-kratos-node="traits.name.first"]').fill('Jane');
  await profileSection.locator('[data-kratos-node="traits.name.last"]').fill('Doe');
  await profileSection.locator('[data-kratos-node="method:profile"]').click();
  await expect(page.getByText('Your changes have been saved!')).toBeVisible();

  // A fresh settings flow is rendered from the identity Kratos stored, so the
  // values surviving a reload is the persistence check.
  await page.reload();
  await expect(profileSection.locator('[data-kratos-node="traits.name.first"]')).toHaveValue(
    'Jane',
  );
  await expect(profileSection.locator('[data-kratos-node="traits.name.last"]')).toHaveValue('Doe');
});
