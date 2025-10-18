import { test, expect } from '@playwright/test'
import { login } from './helpers/login'
import setupMocks from './helpers/mocks'

const E2E_EMAIL = process.env.E2E_EMAIL
const E2E_PASSWORD = process.env.E2E_PASSWORD

if (!E2E_EMAIL || !E2E_PASSWORD) {
  test.skip(true, 'E2E_EMAIL/E2E_PASSWORD not provided; skipping message tests')
}

test('compose a message (smoke)', async ({ page }) => {
  await setupMocks(page)
  await login(page, E2E_EMAIL as string, E2E_PASSWORD as string)
  await page.goto('/communication/messages')
  // Click a 'New' or 'Compose' button if available
  const newBtn = page.getByRole('button', { name: /new|compose/i }).first()
  await expect(newBtn).toBeVisible()
  await newBtn.click()
  // Fill basic form fields (subject/body) if present
  await page.fill('input[name=subject], input[placeholder="Subject"]', 'E2E test subject')
  await page.fill('textarea[name=body], textarea[placeholder="Message"]', 'E2E test body')
  // Click send if available
  const sendBtn = page.getByRole('button', { name: /send|publish/i })
  if ((await sendBtn.count()) > 0) {
    await sendBtn.first().click()
    // look for a confirmation toast or navigation
    const toast = page.locator('.toast, [role="status"], .notification')
    await expect(toast.first()).toBeVisible({ timeout: 5000 })
  }
})
