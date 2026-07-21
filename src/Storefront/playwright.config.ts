import { defineConfig, devices } from '@playwright/test';

// Requires the backend (Kratos, Oathkeeper, Catalog) already running via
// `aspire run` from the repo root, and the gatehouse.test hosts entries from
// README.md "Run locally" — this config only starts the Storefront dev
// server itself, not the rest of the stack.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://storefront.gatehouse.test:4200',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm start',
    url: 'http://storefront.gatehouse.test:4200',
    reuseExistingServer: !process.env['CI'],
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
