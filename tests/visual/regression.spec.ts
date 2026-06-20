import { test, expect } from '@playwright/test';
test.setTimeout(120000);

test.describe('Visual Regression Tests', () => {
  test('Login page visual snapshot', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for the main content to settle
    await expect(page.getByRole('heading', { level: 1, name: /Legacy/i })).toBeVisible();

    // Take a full page screenshot and compare it against the baseline
    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      animations: "disabled",
      timeout: 60000,
    });
  });

  test('Dashboard visual snapshot', async ({ page }) => {
    // This is a scaffold. To test the dashboard visually, you would first need to 
    // authenticate or mock the authentication state, then navigate to '/'
    // and wait for dynamic content (like feeds or loaders) to stabilize.
  });
});
