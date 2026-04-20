# CI/CD Setup Guide — GitHub Actions

## Overview

Automated testing and deployment pipeline using GitHub Actions.

**Two Workflows:**
1. `test.yml` — Runs on every push/PR (unit tests + E2E tests)
2. `deploy.yml` — Deploys to staging/production (manual trigger for prod)

---

## Workflow 1: Test Suite (`test.yml`)

### Triggers
- ✅ Every push to `main` or `develop` branches
- ✅ Every pull request to `main` or `develop`

### Jobs

#### 1. **Unit Tests** (~2 minutes)
```
Node 18 setup
  ↓
Install dependencies (npm ci)
  ↓
Lint check (npm run lint)
  ↓
Type check (npx tsc --noEmit)
  ↓
Run unit tests (npm test -- --run)
  ↓
Upload coverage to codecov
```

Expected output:
```
✅ 180 unit tests pass
✅ Linter clean
✅ No TypeScript errors
```

#### 2. **E2E Tests** (~5 minutes)
```
Node 18 setup
  ↓
Install dependencies (npm ci)
  ↓
Install Playwright browsers
  ↓
Build app (npm run build)
  ↓
Run E2E tests (npm run e2e)
  ↓
Upload Playwright report
```

Expected output:
```
✅ 24 E2E tests pass
✅ Homepage flow: 4/4
✅ Auth flow: 4/4
✅ History flow: 5/5
✅ Billing: 4/4
✅ API Protection: 7/7
```

#### 3. **API Protection Tests** (~2 minutes) ⚠️ **CRITICAL**
```
Node 18 setup
  ↓
Install dependencies (npm ci)
  ↓
Install Playwright browsers
  ↓
Build app (npm run build)
  ↓
Run api-protection tests (npx playwright test api-protection.spec.ts)
```

Expected output:
```
✅ /api/test-apis protected (401)
✅ /api/debug-image protected (401)
✅ /api/supabase-health protected (403)
✅ /api/image-health protected (403)
✅ Rate limiting enforced
✅ Auth validation working
```

#### 4. **Quality Gate**
```
Wait for all tests to complete
  ↓
Check all passed (unit + E2E + API protection)
  ↓
Report final status
```

---

## Workflow 2: Deploy Pipeline (`deploy.yml`)

### Triggers
- ✅ Automatic on push to `main` branch
- ✅ Manual trigger via workflow_dispatch

### Environments

#### **Staging** (Automatic)
```
Build app
  ↓
Run all tests
  ↓
Deploy to staging server
  ↓
Run smoke tests
  ↓
Notify Slack
```

#### **Production** (Manual Approval)
```
Build app
  ↓
Run all tests
  ↓
⏳ Require manual approval in GitHub
  ↓
Deploy to production server
  ↓
Health check
  ↓
Notify Slack
```

---

## GitHub Secrets Configuration

Add these secrets to your GitHub repository (`Settings → Secrets and variables → Actions`):

### Staging Secrets
```
STAGING_DEPLOY_KEY          - SSH private key for staging server
STAGING_DEPLOY_HOST         - Hostname/IP of staging server
STAGING_DEPLOY_PATH         - Deploy path on staging server
```

### Production Secrets
```
PRODUCTION_DEPLOY_KEY       - SSH private key for production server
PRODUCTION_DEPLOY_HOST      - Hostname/IP of production server
PRODUCTION_DEPLOY_PATH      - Deploy path on production server
```

### Notifications
```
SLACK_WEBHOOK_URL           - Slack webhook for deployment notifications
```

### Example Setup

```bash
# Generate SSH key for deployment
ssh-keygen -t ed25519 -f deploy-key -N ""

# On server, add public key to ~/.ssh/authorized_keys
cat deploy-key.pub >> ~/.ssh/authorized_keys

# In GitHub Settings → Secrets, add:
# Name: STAGING_DEPLOY_KEY
# Value: (paste contents of deploy-key)
```

---

## Environment Setup

### Create GitHub Environments

Go to `Settings → Environments` and create:

#### Staging Environment
- Name: `staging`
- Deployment branches: `main`, `develop`
- Protection rules: (none required)

#### Production Environment
- Name: `production`
- Deployment branches: `main`
- Protection rules:
  - ✅ Required reviewers: (select team members)
  - ✅ Dismiss stale pull request approvals

---

## PR Quality Checks

Every pull request will show:

```
✅ Unit Tests — 180 tests passing
✅ E2E Tests — 24 tests passing
✅ API Protection — 7 critical tests passing
✅ Quality Gate — All checks approved
```

PR cannot be merged until **all checks pass**.

---

## Staging Deployment Flow

1. **Push to main branch** → GitHub Actions triggered
2. **Unit tests run** → Must pass
3. **E2E tests run** → Must pass
4. **API Protection tests run** → Must pass (critical)
5. **Build succeeds** → Build artifacts created
6. **Deploy to staging** → Automatic via SSH/rsync
7. **Smoke tests run** → Health check
8. **Slack notification** → Team notified
9. ✅ **Live on staging** → Ready for QA

---

## Production Deployment Flow

1. **Push to main branch** → GitHub Actions triggered
2. **All tests pass** → Same as staging
3. **⏳ Manual approval required** → Reviewer approves
4. **Deploy to production** → Automatic via SSH/rsync
5. **Health check** → Verify production is healthy
6. **Slack notification** → Team notified
7. ✅ **Live in production** → Ready for users

---

## Monitoring & Debugging

### View Workflow Runs
```
GitHub → Actions tab → Click workflow run
```

### Debug Failed Tests
```
1. Click failed job
2. View "Run Unit Tests" step output
3. Or download "test-reports" artifact for E2E failures
```

### Download Playwright Report
```
1. Go to failed E2E test run
2. Click "Artifacts" section
3. Download "playwright-report"
4. Open playwright-report/index.html in browser
```

### Check Deployment Logs
```
1. Go to "Deploy Pipeline" workflow
2. Click staging/production job
3. View "Deploy to Staging/Production" step
```

---

## Testing Workflows Locally

### Test the test workflow
```bash
# Install act (GitHub Actions runner)
brew install act  # macOS
# or https://github.com/nektos/act

# Run workflow
act push
```

### Manual workflow trigger
```bash
# Via GitHub CLI
gh workflow run deploy.yml -f environment=staging
```

---

## Troubleshooting

### "Tests pass locally but fail in CI"
**Cause:** Environment differences (Node version, dependencies)
**Fix:** Update `.github/workflows/test.yml` to match local Node version

### "E2E tests timeout"
**Cause:** Staging server slow or dev server doesn't start
**Fix:** Increase timeout in playwright.config.ts

### "Deployment fails with SSH error"
**Cause:** Invalid SSH key or host unreachable
**Fix:**
1. Verify SSH key is in GitHub Secrets
2. Test SSH connection manually: `ssh -i deploy-key user@host`
3. Ensure server firewall allows SSH (port 22)

### "Slack notification not sending"
**Cause:** Invalid webhook URL
**Fix:** Test webhook: `curl -X POST -H 'Content-type: application/json' --data '{"text":"Test"}' $SLACK_WEBHOOK_URL`

---

## Performance

| Stage | Duration | Status |
|-------|----------|--------|
| Unit tests | ~2 min | Fast ⚡ |
| E2E tests | ~5 min | Normal ⏱️ |
| Build | ~2 min | Fast ⚡ |
| Total (PR check) | ~9 min | Good 👍 |
| Deploy to staging | ~2 min | Fast ⚡ |
| Health check | ~1 min | Fast ⚡ |

---

## Security Notes

- ✅ SSH keys encrypted in GitHub Secrets
- ✅ No secrets logged in workflow output
- ✅ Production requires manual approval
- ✅ All commits are tested before deploy
- ✅ Health checks prevent broken deployments

---

## Next Steps

1. **Create GitHub Environments**
   - Settings → Environments → New environment
   - Add `staging` and `production`

2. **Add Secrets**
   - Settings → Secrets → New repository secret
   - Add deploy keys and hosts

3. **Setup Server SSH**
   - Generate deployment SSH key
   - Add public key to server

4. **Test Workflow**
   - Push to main branch
   - Watch Actions tab for workflow run
   - Verify all tests pass

5. **Monitor Deployments**
   - Check deployment status in Actions
   - Review Slack notifications
   - Monitor production health

---

## Resources

- GitHub Actions Docs: https://docs.github.com/en/actions
- Playwright CI: https://playwright.dev/docs/ci
- rsync deployment: https://linux.die.net/man/1/rsync

Ready to deploy! 🚀
