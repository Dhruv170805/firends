import { test, expect } from '@playwright/test';

test.describe('LegacyLoop Critical Journeys', () => {
  const uniqueId = Date.now();
  const testEmail = `qa_user_${uniqueId}@university.edu`;
  const testUsername = `qa_user_${uniqueId}`;
  const testFullName = `QA User ${uniqueId}`;
  const testPassword = 'SecurePassword123!';

  test('New user signup, onboarding redirect, and sector creation', async ({ page }) => {
    let sectorCreated = false;

    // 1. Intercept Supabase Auth Signup call to mock successful registration
    await page.route('**/auth/v1/signup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mocked-jwt-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mocked-refresh-token',
          user: {
            id: 'e0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
            email: testEmail,
            raw_user_meta_data: {
              username: testUsername,
              full_name: testFullName,
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          session: {
            access_token: 'mocked-jwt-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mocked-refresh-token',
            user: {
              id: 'e0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
              email: testEmail,
              raw_user_meta_data: {
                username: testUsername,
                full_name: testFullName,
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          }
        }),
      });
    });

    // 2. Intercept backend /sectors GET and POST requests
    await page.route('**/sectors', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        if (!sectorCreated) {
          // If sector not created yet, return empty list to trigger onboarding redirect
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
        } else {
          // Once sector is created, return it to pass the layout check and render homepage
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              {
                id: 'sector-id-123',
                name: `QA Pod ${uniqueId}`,
                description: 'Automatic QA testing Pod',
                created_by: 'e0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
                user_role: 'leader',
              }
            ]),
          });
        }
      } else if (method === 'POST') {
        sectorCreated = true;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'sector-id-123',
            name: `QA Pod ${uniqueId}`,
            description: 'Automatic QA testing Pod',
            created_by: 'e0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
          }),
        });
      }
    });

    // 3. Intercept backend /posts GET request
    await page.route('**/posts**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // 4. Intercept backend /stories GET request
    await page.route('**/stories**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // 5. Intercept Supabase storage uploads (e.g. avatar) if triggered
    await page.route('**/storage/v1/object/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ Key: 'memories/avatars/dummy.png' }),
      });
    });

    // 6. Visit Login Page
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('Legacy');

    // 7. Switch to Sign Up tab (with retry to handle hydration race conditions)
    await expect(async () => {
      await page.click('button:has-text("Create Account")');
      await expect(page.locator('input[placeholder="John Doe"]')).toBeVisible({ timeout: 1000 });
    }).toPass({
      intervals: [500, 1000],
      timeout: 10000
    });

    // 8. Fill in registration details
    await page.fill('input[placeholder="John Doe"]', testFullName);
    await page.fill('input[placeholder="johndoe"]', testUsername);
    await page.fill('input[placeholder="name@university.edu"]', testEmail);
    await page.fill('input[placeholder="+1 (555) 000-0000"]', '+15551234567');
    await page.fill('input[placeholder="Min 6 characters"]', testPassword);

    // 9. Submit Registration
    await page.click('button[type="submit"]:has-text("Create Account")', { force: true });

    // 10. Assert successful login redirect to onboarding
    await page.waitForURL('**/sectors/onboarding', { timeout: 15000 });
    await expect(page.locator('h2')).toContainText('Choose Your Group');

    // 11. Establish a new Sector
    await page.click('button:has-text("Create a Group")', { force: true });
    await page.fill('input[placeholder="e.g. Batch of 2008, Study Group..."]', `QA Pod ${uniqueId}`);
    await page.fill('textarea[placeholder="Describe who is in this group..."]', 'Automatic QA testing Pod');

    // 12. Submit Sector Creation
    await page.click('button[type="submit"]', { force: true });

    // 13. Assert redirection back to home page timeline
    await page.waitForURL('**/', { timeout: 15000 });
    
    // Check that we are on the main feed page and the onboarding gate is cleared
    await expect(page.locator('h2')).toContainText('Memory');
  });
});
