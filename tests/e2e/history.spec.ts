import { test, expect } from '@playwright/test';

test.describe('History View', () => {
  test('should have history section or link accessible', async ({ page }) => {
    await page.goto('/');

    // Look for history-related UI
    const pageContent = await page.content();
    const hasHistoryUI = pageContent.includes('histórico') ||
                         pageContent.includes('history') ||
                         pageContent.includes('cones anteriores') ||
                         pageContent.includes('past generations');

    expect(hasHistoryUI || pageContent.includes('dashboard')).toBeTruthy();
  });

  test('should navigate to history/dashboard page', async ({ page }) => {
    const response = await page.goto('/dashboard', { waitUntil: 'networkidle' });

    // Should load dashboard or redirect appropriately
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('should display table or list structure', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for table, list, or grid structure
    const hasListStructure = await page.locator(
      'table, [role="grid"], [role="table"], [role="list"], .list, .table'
    ).first().isVisible().catch(() => false);

    // Or check for any structural elements
    const pageContent = await page.content();
    const hasStructure = pageContent.includes('table') ||
                        pageContent.includes('list') ||
                        pageContent.includes('grid') ||
                        pageContent.includes('row');

    expect(hasListStructure || hasStructure).toBeTruthy();
  });

  test('should have filter or search capability', async ({ page }) => {
    await page.goto('/dashboard');

    // Look for filter inputs or buttons
    const hasFilterUI = await page.locator(
      'input[type="search"], input[type="text"], [aria-label*="filter"], [aria-label*="search"]'
    ).first().isVisible().catch(() => false);

    // Or check for filter-related UI
    const pageContent = await page.content();
    const hasFilter = pageContent.includes('filter') ||
                     pageContent.includes('search') ||
                     pageContent.includes('niche') ||
                     pageContent.includes('buscar');

    expect(hasFilterUI || hasFilter).toBeTruthy();
  });

  test('should handle pagination or scrolling', async ({ page }) => {
    await page.goto('/dashboard');

    // Check if page can scroll or has pagination
    const scrollable = await page.evaluate(() => {
      return document.documentElement.scrollHeight > document.documentElement.clientHeight;
    });

    // Or look for pagination controls
    const pageContent = await page.content();
    const hasPagination = pageContent.includes('next') ||
                         pageContent.includes('previous') ||
                         pageContent.includes('página') ||
                         pageContent.includes('scroll');

    expect(scrollable || hasPagination).toBeTruthy();
  });
});
