import { Page } from '@playwright/test'

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login')
  await page.fill('input[type=email], input[name=email]', email)
  await page.fill('input[type=password], input[name=password]', password)
  await page.click('button:has-text("Sign in"), button:has-text("Log in"), button[type=submit]')
  await page.waitForURL('**/dashboard', { timeout: 10_000 })
}
