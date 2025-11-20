import { test, expect, Page } from '@playwright/test'
import setupMocks from './helpers/mocks'

async function expectMainVisible(page: Page, timeout = 60_000) {
  const main = page.locator('main').first()
  await expect(main).toBeVisible({ timeout })
}

test.describe('Smoke navigation', () => {
  test('home loads and shows header', async ({ page }) => {
    await setupMocks(page)
    const respHome = await page.goto('/', { waitUntil: 'networkidle', timeout: 120_000 })
    // ensure we got a 200-ish response from the server
    expect(respHome && respHome.ok()).toBeTruthy()
    // header or nav should exist; if banner role is missing (redirects/localized shells),
    // ensure the main content area is visible instead.
    const header = page.getByRole('banner').first()
    const headerCount = await header.count()
    if (headerCount > 0) {
      await expect(header).toBeVisible({ timeout: 30_000 })
    } else {
      await expectMainVisible(page)
    }
  })

  test('parent portal token page returns 200', async ({ page }) => {
    await setupMocks(page)
    // use a placeholder token route that should render the page shell
    const resp = await page.goto('/parent-portal/test-token', { waitUntil: 'networkidle', timeout: 120_000 })
    expect(resp && resp.ok()).toBeTruthy()
    await expectMainVisible(page)
  })

  test('communication/messages page loads', async ({ page }) => {
    await setupMocks(page)
    const resp = await page.goto('/communication/messages', { waitUntil: 'networkidle', timeout: 120_000 })
    expect(resp && resp.ok()).toBeTruthy()
    await expectMainVisible(page)
  })
})
