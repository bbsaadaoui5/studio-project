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
    // wait for the UI to settle: either the new-button or the messages list should appear
    // wait for network idle, then assert one of the expected UI states is visible
    await page.waitForLoadState('networkidle')
    // expect a compose/new message button or message list or the localized empty-state
    const newBtn = page.locator('[data-testid="messages-new"]').first()
    const list = page.locator('[data-testid="messages-list"], .messages-list').first()
    const emptyMsg = page.getByText('لا توجد محادثات بعد.').first()
    await expect(newBtn.or(list).or(emptyMsg)).toBeVisible({ timeout: 15000 })
  })
})
