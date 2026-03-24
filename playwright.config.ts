import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Spy Bot Web
 *
 * 5 Critical E2E Tests:
 * 1. homepage.spec.ts — Load homepage, paste URL, see result
 * 2. auth.spec.ts — Login, logout, redirect to /dashboard
 * 3. history.spec.ts — View clone history, filter by niche
 * 4. billing.spec.ts — Verify credit display
 * 5. api-protection.spec.ts — Verify protected routes return 401 without auth
 */

export default defineConfig({
  testDir: './tests/e2e',

  // Test runner settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Report settings
  reporter: 'html',

  // Shared settings for all WebKit, Chromium and Firefox browsers
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
