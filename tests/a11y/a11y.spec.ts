import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('LegacyLoop Accessibility Audits', () => {
  test('/login page accessibility audit', async ({ page }) => {
    await page.goto('/login');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Log violations to console for easier debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Axe Violations:');
      console.log(JSON.stringify(accessibilityScanResults.violations, null, 2));
    }

    // Assert that there are no critical or serious violations
    const seriousOrCriticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(seriousOrCriticalViolations.length).toBe(0);
  });
});
