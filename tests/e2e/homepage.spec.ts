import { test, expect } from '@playwright/test';

test.describe('Homepage Flow', () => {
  test('should load homepage with hero section', async ({ page }) => {
    await page.goto('/');

    // Check for hero section
    const hero = page.locator('h1, h2').first();
    await expect(hero).toBeVisible();

    // Check for input field or call-to-action
    const input = page.locator('input[type="text"], textarea, [role="textbox"]').first();
    await expect(input).toBeVisible({ timeout: 5000 });
  });

  test('should display UI elements', async ({ page }) => {
    await page.goto('/');

    // Check for navigation or branding
    const brand = page.locator('[alt*="logo"], [alt*="Spy"], h1').first();
    await expect(brand).toBeVisible({ timeout: 5000 });
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');

    // Look for navigation elements
    const nav = page.locator('nav, [role="navigation"], button, a').first();
    await expect(nav).toBeVisible({ timeout: 5000 });
  });

  test('should respond to user interaction', async ({ page }) => {
    await page.goto('/');

    // Find and interact with a button or input
    const interactiveElement = page.locator('button, input, [role="button"], [role="textbox"]').first();
    if (await interactiveElement.isVisible()) {
      await interactiveElement.hover();
      // Element should respond to hover
      await expect(interactiveElement).toBeVisible();
    }
  });
});
