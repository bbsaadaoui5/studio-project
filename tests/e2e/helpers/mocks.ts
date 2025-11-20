import { Page } from '@playwright/test'

export async function setupMocks(page: Page) {
  // Generic catch-all for application API routes under /api/
  await page.route('**/api/**', async (route) => {
    const url = route.request().url()
    // Provide small, safe fixtures depending on the endpoint
    if (url.includes('/api/gemini')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ result: 'ok' })
      })
    }

    if (url.includes('/api/messages') || url.includes('/communication/messages')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ messages: [] })
      })
    }

      // Students list
      if (url.match(/\/api\/students(\/|$)/)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            students: [
              { id: 's1', firstName: 'Amina', lastName: 'Saadi', grade: '5' },
              { id: 's2', firstName: 'Bilal', lastName: 'Khan', grade: '7' }
            ]
          })
        })
      }

      // Single student
      if (url.match(/\/api\/students\/[\w-]+/)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 's1', firstName: 'Amina', lastName: 'Saadi', grade: '5', guardian: { name: 'Fatima', phone: '555-0101' } })
        })
      }

      // Staff list
      if (url.match(/\/api\/staff(\/|$)/)) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ staff: [ { id: 't1', name: 'Mr. Ali', role: 'Teacher' } ] })
        })
      }

      // Payroll sample
      if (url.includes('/api/payroll')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ payroll: [ { id: 'p1', staffId: 't1', amount: 1200, date: '2025-09-30' } ] })
        })
      }

      // Fees / finance
      if (url.includes('/api/fees')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ fees: [ { id: 'f1', studentId: 's1', amount: 200, dueDate: '2025-11-01' } ] })
        })
      }

      // Inventory
      if (url.includes('/api/inventory')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items: [ { id: 'i1', name: 'Projector', qty: 2 } ] })
        })
      }

    // Default: return an empty JSON object to avoid runtime failures
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({})
    })
  })

  // Prevent external analytics / telemetry calls from interfering
  await page.route('**/analytics/**', (route) => route.abort())
  await page.route('**/sentry/**', (route) => route.abort())
}

export default setupMocks
