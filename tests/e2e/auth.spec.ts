import { test, expect } from '@playwright/test'
import { login } from './helpers/login'

const E2E_EMAIL = process.env.E2E_EMAIL
const E2E_PASSWORD = process.env.E2E_PASSWORD

if (!E2E_EMAIL || !E2E_PASSWORD) {
  test.skip(true, 'E2E_EMAIL/E2E_PASSWORD not provided; skipping auth tests')
}

test.describe('Auth smoke', () => {
  test('login as e2e user and open dashboard', async ({ page }) => {
    await login(page, E2E_EMAIL as string, E2E_PASSWORD as string)
    await expect(page.locator('nav, [data-testid="site-nav"]').first()).toBeVisible()
  })
})
