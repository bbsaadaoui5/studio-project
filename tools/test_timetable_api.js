#!/usr/bin/env node

(async () => {
  const API = process.env.TEST_API || 'http://localhost:2034/api/timetable'
  const fetch = global.fetch || (await import('node-fetch')).default

  // Wait-for-readiness: try pinging the API root until it responds
  async function waitForApi(url, attempts = 10, delayMs = 500) {
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch(url, { method: 'GET' })
        console.log(`waitForApi: attempt ${i + 1}/${attempts} -> status ${res.status}`)
        if (res.ok) return true
        // sometimes API returns 404 for root; treat any response as readiness
        return true
      } catch (err) {
        console.log(`waitForApi: attempt ${i + 1}/${attempts} failed: ${err && err.message ? err.message : String(err)}`)
      }
      await new Promise(r => setTimeout(r, delayMs))
    }
    return false
  }

  const ready = await waitForApi(API, 20, 300)
  if (!ready) {
    console.error('API did not become reachable at', API)
    process.exit(2)
  }

  const results = []

  try {
    console.log('Using API:', API)

    // 1) POST
    const payload = {
      grade: '9',
      className: 'A',
      day: 'Monday',
      timeSlot: '08:00 - 09:00',
      courseId: 'COURSE_TEST',
      courseName: 'Test Course',
      teacherName: 'Test Teacher',
      notes: 'Initial note'
    }

    const postRes = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const postBody = await postRes.json().catch(() => null)
    const createdId = postBody && postBody.id
    results.push({ step: 'POST', ok: postRes.ok, status: postRes.status, id: createdId, body: postBody })

    if (!createdId) {
      console.error('POST failed, stopping tests.', postBody)
      console.table(results)
      process.exit(createdId ? 0 : 2)
    }

    // 2) PUT (update)
    const patch = { notes: 'Updated note', courseName: 'Updated Course' }
    const putRes = await fetch(`${API}/${encodeURIComponent(createdId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch)
    })
    const putBody = await putRes.json().catch(() => null)
    results.push({ step: 'PUT', ok: putRes.ok, status: putRes.status, body: putBody })

    // 3) GET with filters
    const query = `?grade=${encodeURIComponent(payload.grade)}&className=${encodeURIComponent(payload.className)}`
    const getRes = await fetch(API + query, { method: 'GET' })
    const getBody = await getRes.json().catch(() => null)
    const found = Array.isArray(getBody) && getBody.some(e => String(e.id) === String(createdId) && e.notes === 'Updated note')
    results.push({ step: 'GET_FILTER', ok: getRes.ok && found, status: getRes.status, count: Array.isArray(getBody) ? getBody.length : null })

    // 4) DELETE
    const delRes = await fetch(`${API}/${encodeURIComponent(createdId)}`, { method: 'DELETE' })
    results.push({ step: 'DELETE', ok: delRes.ok || delRes.status === 204, status: delRes.status })

    // 5) GET again to ensure deleted
    const getRes2 = await fetch(API + query, { method: 'GET' })
    const getBody2 = await getRes2.json().catch(() => null)
    const stillFound = Array.isArray(getBody2) && getBody2.some(e => String(e.id) === String(createdId))
    results.push({ step: 'GET_AFTER_DELETE', ok: getRes2.ok && !stillFound, status: getRes2.status, count: Array.isArray(getBody2) ? getBody2.length : null })

    console.log('\nTest Results Summary:')
    console.table(results.map(r => ({ step: r.step, ok: r.ok, status: r.status, id: r.id || '', count: r.count || '', note: r.body && r.body.error ? r.body.error : '' })))

    const allOk = results.every(r => r.ok)
    console.log('\nOverall:', allOk ? 'SUCCESS' : 'FAIL')
    process.exit(allOk ? 0 : 3)
  } catch (err) {
    console.error('Test script error:', err)
    process.exit(2)
  }
})()
