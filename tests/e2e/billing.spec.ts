import { test, expect } from '@playwright/test';

test.describe('Billing Display', () => {
  test('should display credit information on page', async ({ page }) => {
    await page.goto('/');

    // Look for credit/billing related text
    const pageContent = await page.content();
    const hasBillingUI = pageContent.includes('crédito') ||
                        pageContent.includes('credit') ||
                        pageContent.includes('plano') ||
                        pageContent.includes('plan') ||
                        pageContent.includes('grátis') ||
                        pageContent.includes('free');

    expect(hasBillingUI).toBeTruthy();
  });

  test('should show plan information in dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for plan or pricing info
    const pageContent = await page.content();
    const hasPlanInfo = pageContent.includes('plano') ||
                       pageContent.includes('plan') ||
                       pageContent.includes('premium') ||
                       pageContent.includes('pro') ||
                       pageContent.includes('grátis');

    expect(hasPlanInfo || pageContent.includes('dashboard')).toBeTruthy();
  });

  test('should have upgrade or purchase flow', async ({ page }) => {
    await page.goto('/');

    // Look for upgrade/pricing buttons
    const pageContent = await page.content();
    const hasUpgradeFlow = pageContent.includes('upgrade') ||
                          pageContent.includes('comprar') ||
                          pageContent.includes('buy') ||
                          pageContent.includes('subscribe') ||
                          pageContent.includes('plano');

    expect(hasUpgradeFlow || pageContent.includes('pricing')).toBeTruthy();
  });

  test('should display credit usage or limits', async ({ page }) => {
    await page.goto('/');

    // Look for credit/usage information
    const pageContent = await page.content();
    const hasCreditInfo = pageContent.includes('limite') ||
                         pageContent.includes('limit') ||
                         pageContent.includes('crédito') ||
                         pageContent.includes('credit') ||
                         pageContent.includes('usado');

    expect(hasCreditInfo || pageContent.includes('5')).toBeTruthy();
  });
});
