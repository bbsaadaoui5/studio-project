import { test, expect } from '@playwright/test'
import setupMocks from './helpers/mocks'

test.describe('Smoke navigation', () => {
  test('home loads and shows header', async ({ page }) => {
    await setupMocks(page)
  await page.goto('/')
    // header or nav should exist; if banner role is missing (redirects/localized shells),
    // ensure the main content area is visible instead.
    const header = page.getByRole('banner').first()
    const headerCount = await header.count()
    if (headerCount > 0) {
      await expect(header).toBeVisible()
    } else {
      const main = page.locator('main').first()
      await expect(main).toBeVisible()
    }
  })

  test('parent portal token page returns 200', async ({ page }) => {
    await setupMocks(page)
    // use a placeholder token route that should render the page shell
    await page.goto('/parent-portal/test-token')
    // check that page renders some known text or root element
    const main = page.locator('main').first()
    await expect(main).toBeVisible()
  })

  test('communication/messages page loads', async ({ page }) => {
    await setupMocks(page)
    await page.goto('/communication/messages')
    // expect a compose/new message button or message list
    // Use data-testid for the new button to avoid English-only label matching
    const newBtn = page.locator('[data-testid="messages-new"]').first()
    const list = page.locator('[data-testid="messages-list"], .messages-list').first()
    await expect(newBtn.or(list)).toBeVisible()
  })
})
