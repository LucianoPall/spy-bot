# E2E Testing Guide — Spy Bot Web

## Overview

End-to-end tests validate the entire user journey and critical application flows using Playwright. Tests verify both UI functionality and API protection.

**Test Framework:** Playwright
**Configuration:** `playwright.config.ts`
**Test Directory:** `tests/e2e/`

---

## 5 Test Suites — 24 Total Tests

### 1. **Homepage Flow** (4 tests)
- `homepage.spec.ts`

**What it tests:**
- Hero section loads correctly
- Main UI elements are visible
- Navigation is accessible
- User interaction works (hover, click)

**Why it matters:**
Validates the primary entry point of the application and ensures users can immediately interact with core UI.

**Tests:**
```
✓ should load homepage with hero section
✓ should display UI elements
✓ should have working navigation
✓ should respond to user interaction
```

---

### 2. **Authentication Flow** (4 tests)
- `auth.spec.ts`

**What it tests:**
- Auth UI is visible on homepage
- Unauthenticated users are redirected from `/dashboard`
- Protected routes show appropriate content or auth prompts
- Logout capability exists when authenticated

**Why it matters:**
Ensures authentication boundaries are enforced and users can't access protected features without credentials.

**Tests:**
```
✓ should have auth UI on homepage
✓ should redirect unauthenticated users from protected routes
✓ should display auth-related content on protected routes
✓ should have logout capability when authenticated
```

---

### 3. **History/Dashboard View** (5 tests)
- `history.spec.ts`

**What it tests:**
- History section is accessible
- Dashboard page loads
- List/table structure is present
- Filter and search UI is available
- Pagination or scrolling works

**Why it matters:**
Users need to view their generation history and filter by niche. This validates the historical data retrieval UI.

**Tests:**
```
✓ should have history section or link accessible
✓ should navigate to history/dashboard page
✓ should display table or list structure
✓ should have filter or search capability
✓ should handle pagination or scrolling
```

---

### 4. **Billing Information Display** (4 tests)
- `billing.spec.ts`

**What it tests:**
- Credit information is displayed
- Plan information shows on dashboard
- Upgrade/purchase flow is accessible
- Credit usage limits are shown

**Why it matters:**
Users must see their credit balance and understand pricing. This validates financial information is properly displayed.

**Tests:**
```
✓ should display credit information on page
✓ should show plan information in dashboard
✓ should have upgrade or purchase flow
✓ should display credit usage or limits
```

---

### 5. **API Protection** (7 tests) ⚠️ **CRITICAL**
- `api-protection.spec.ts`

**What it tests:**
- `/api/test-apis` requires authentication (returns 401)
- `/api/debug-image` requires authentication (returns 401)
- `/api/supabase-health` requires admin access (returns 403)
- `/api/image-health` requires admin access (returns 403)
- `/api/spy-engine` enforces auth and rate limiting
- All protected endpoints reject unauthorized access
- Invalid auth headers are rejected

**Why it matters:**
Ensures that routes consuming paid APIs (OpenAI, Apify, Supabase) cannot be accessed by unauthenticated users. **This is the most critical test suite** for preventing API quota abuse.

**Tests:**
```
✓ should protect /api/test-apis route from unauthorized access
✓ should protect /api/debug-image route from unauthorized access
✓ should protect /api/supabase-health route from non-admin access
✓ should protect /api/image-health route from non-admin access
✓ should handle rate limiting on /api/spy-engine
✓ should enforce authentication on protected endpoints
✓ should validate API authentication headers
```

---

## Running E2E Tests

### Run all tests
```bash
npm run e2e
```

### Run with UI (visual mode)
```bash
npm run e2e:ui
```

### Debug mode (step through tests)
```bash
npm run e2e:debug
```

### Run in headed mode (browser visible)
```bash
npm run e2e:headed
```

### List tests without running
```bash
npx playwright test --list
```

### Run specific test file
```bash
npx playwright test tests/e2e/api-protection.spec.ts
```

### Run specific test
```bash
npx playwright test api-protection -k "should protect /api/test-apis"
```

---

## Configuration Details

**File:** `playwright.config.ts`

Key settings:
- **Base URL:** `http://localhost:3000` (local dev server)
- **Browser:** Chromium
- **Reporter:** HTML (detailed reports in `playwright-report/`)
- **Screenshot:** Only on failure
- **Trace:** Captured on first retry

The configuration automatically starts the Next.js dev server (`npm run dev`) before running tests.

---

## Expected Behavior

### Passing Tests
- Homepage loads with visible UI elements
- Auth redirects work correctly
- API protection returns 401/403 for unauthorized requests
- Dashboard and history views are accessible
- Billing information is displayed

### Known Limitations
- Tests don't require actual credentials (they validate UI presence and redirects)
- API protection tests use direct HTTP requests without auth context
- Full auth flow would require test credentials in .env.test

---

## CI/CD Integration

For CI/CD pipelines, tests run with:
- `workers: 1` (single worker to avoid conflicts)
- `retries: 2` (retry failed tests)
- `forbidOnly: true` (fail if focused tests exist)

## Troubleshooting

### "Can't find dev server"
The dev server (`npm run dev`) should start automatically. If it fails:
```bash
# Start dev server manually
npm run dev
# In another terminal:
npm run e2e
```

### Port 3000 already in use
```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>
```

### Browser not downloading
```bash
npx playwright install chromium
```

### Tests timeout
Increase timeout in `playwright.config.ts`:
```typescript
use: {
  timeout: 30000, // 30 seconds per test
}
```

---

## Test Coverage Summary

| Category | Tests | Coverage |
|----------|-------|----------|
| UI/UX | 9 | Homepage, Dashboard, Navigation |
| Authentication | 4 | Login, Logout, Redirects |
| Authorization | 7 | API Protection, Admin Routes |
| Business Logic | 4 | Billing, History, Filtering |
| **Total** | **24** | **Critical User Flows** |

---

## Next Steps

1. ✅ E2E test suite created (24 tests)
2. ⏳ Run tests in local dev environment
3. 🔄 Integrate into CI/CD pipeline
4. 📊 Monitor test pass rates
5. 🚀 Deploy to production with E2E gate

Tests are ready to run! 🎯
