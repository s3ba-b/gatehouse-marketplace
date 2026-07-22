import { expect, test } from '@playwright/test';

// The walking skeleton's payoff (issue #10): registering and logging in
// through the Storefront UI must each end in a real Kratos session that
// Oathkeeper accepts all the way to the Catalog service — Angular -> Kratos
// -> Oathkeeper -> JWT -> Catalog, driven entirely through the rendered
// flow-node forms (no field is named in this test either).
test('register, log in, and load products through the gateway', async ({ page }) => {
  const email = `playwright-${Date.now()}@example.test`;
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

  await test.step('the authenticated request through the gateway renders real products', async () => {
    const items = page.getByRole('listitem');
    await expect(items).not.toHaveCount(0);
  });

  await test.step('log in again with the same credentials from a clean session', async () => {
    await page.context().clearCookies();

    await page.goto('/login');
    await page.locator('[data-kratos-node="identifier"]').fill(email);
    await page.locator('[data-kratos-node="password"]').fill(password);
    await page.locator('[data-kratos-node="method:password"]').click();

    await page.waitForURL('**/products');
    await expect(page.getByRole('listitem')).not.toHaveCount(0);
  });
});
