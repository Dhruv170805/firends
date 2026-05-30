import { test, expect } from '@playwright/test';

test.describe('LegacyLoop Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any storage/cookies to ensure clean state
    await page.context().clearCookies();
  });

  test('Root / redirects unauthenticated user to /login', async ({ page }) => {
    await page.goto('/');
    // Wait for client-side redirect to /login
    await page.waitForURL('**/login');
    expect(page.url()).toContain('/login');
  });

  test('/login loads successfully', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBe(200);

    // Verify presence of logo and title text
    const title = page.locator('h2');
    await expect(title).toContainText('Legacy');
  });
});
