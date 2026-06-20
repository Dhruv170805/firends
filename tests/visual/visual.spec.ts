import { test } from '@playwright/test';
test.setTimeout(120000);

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

test.describe('LegacyLoop Visual Screenshots', () => {
  for (const viewport of VIEWPORTS) {
    test(`Capture /login at ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/login');
      await page.waitForTimeout(1000); // Allow drift animation to settle
      await page.screenshot({
        path: `test-results/screenshots/login__${viewport.name}_${viewport.width}x${viewport.height}.png`,
        fullPage: true,
        animations: "disabled",
        timeout: 60000,
      });
    });
  }
});
