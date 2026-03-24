import { test, expect } from '@playwright/test';

test.describe('API Protection', () => {
  test('should protect /api/test-apis route from unauthorized access', async ({ page }) => {
    // Try to access protected route without auth
    const response = await page.request.get('/api/test-apis');

    // Should return 401 or 403
    expect([401, 403]).toContain(response.status());
    expect(response.status()).not.toBe(200);
  });

  test('should protect /api/debug-image route from unauthorized access', async ({ page }) => {
    // Try to access protected route without auth
    const response = await page.request.get('/api/debug-image?url=https://test.com/image.png');

    // Should return 401 or 403
    expect([401, 403]).toContain(response.status());
    expect(response.status()).not.toBe(200);
  });

  test('should protect /api/supabase-health route from non-admin access', async ({ page }) => {
    // Try to access admin-only route without auth
    const response = await page.request.get('/api/supabase-health');

    // Should return 401 or 403 (not 200)
    expect(response.status()).not.toBe(200);
    expect([401, 403, 405]).toContain(response.status());
  });

  test('should protect /api/image-health route from non-admin access', async ({ page }) => {
    // Try to access admin-only route without auth
    const response = await page.request.get('/api/image-health');

    // Should return 401 or 403
    expect(response.status()).not.toBe(200);
    expect([401, 403, 405]).toContain(response.status());
  });

  test('should handle rate limiting on /api/spy-engine', async ({ page }) => {
    // POST to spy-engine should require proper request format
    const response = await page.request.post('/api/spy-engine', {
      data: { adUrl: 'https://test.com' },
    });

    // Should fail due to auth requirement or invalid request
    // Not expecting 200 without proper auth context
    const status = response.status();
    expect([400, 401, 403, 429]).toContain(status);
  });

  test('should enforce authentication on protected endpoints', async ({ page }) => {
    // Test multiple endpoints - all should require auth
    const endpoints = [
      '/api/test-apis',
      '/api/debug-image',
      '/api/supabase-health',
      '/api/image-health',
    ];

    for (const endpoint of endpoints) {
      const response = await page.request.get(endpoint);
      const status = response.status();

      // Should not be accessible without auth (200 or successful)
      expect(status).not.toBe(200);
      expect(status).not.toBe(204);
    }
  });

  test('should validate API authentication headers', async ({ page }) => {
    // Try with empty auth header
    const response1 = await page.request.get('/api/test-apis', {
      headers: { 'Authorization': '' },
    });

    expect([401, 403]).toContain(response1.status());

    // Try with invalid auth header
    const response2 = await page.request.get('/api/test-apis', {
      headers: { 'Authorization': 'Bearer invalid' },
    });

    expect([401, 403]).toContain(response2.status());
  });
});
