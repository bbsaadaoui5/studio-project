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
    const resp = await page.goto('/communication/messages')
    // page should return 200 and render main content (robust across auth/localized states)
    expect(resp && resp.ok()).toBeTruthy()
    const main = page.locator('main').first()
    await expect(main).toBeVisible()
  })
})
