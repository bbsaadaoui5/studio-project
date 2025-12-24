// Clean, single mock API server implementation
const http = require('http');

const PORT = process.env.PORT || 2034;

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function sendError(res, status, message, details) {
  const payload = { error: message };
  if (details) payload.details = details;
  sendJson(res, status, payload);
}

// Simple validation for timetable entries (POST)
function validateCreate(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    errors.push('Body must be a JSON object');
    return errors;
  }
  const required = ['grade', 'className', 'day', 'timeSlot', 'courseId'];
  required.forEach((k) => {
    if (!data[k]) errors.push(`${k} is required`);
  });
  return errors;
}

// In-memory store (process lifetime only) so GET can return posted entries
const store = []

const server = http.createServer((req, res) => {
  console.log(new Date().toISOString(), req.method, req.url);

  // Always set CORS headers early so preflight/failed requests are less likely
  setCorsHeaders(res);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  try {
    const fullUrl = new URL(req.url, `http://${req.headers.host}`)
    const pathname = fullUrl.pathname.replace(/\/+$/ , '') || fullUrl.pathname

    // GET /api/timetable -> return stored entries (support filters)
    if (pathname === '/api/timetable' && req.method === 'GET') {
      const q = fullUrl.searchParams
      let results = store.slice().reverse() // latest first
      if (q.has('grade')) {
        const grade = q.get('grade')
        results = results.filter(r => String(r.grade) === String(grade))
      }
      if (q.has('className')) {
        const className = q.get('className')
        results = results.filter(r => String(r.className) === String(className))
      }
      if (q.has('teacherName')) {
        const teacherName = q.get('teacherName')
        results = results.filter(r => String(r.teacherName) === String(teacherName))
      }

      return sendJson(res, 200, results)
    }

    // POST /api/timetable -> create and store
    if (pathname === '/api/timetable' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        let data = {};
        try {
          data = JSON.parse(body || '{}');
        } catch (err) {
          console.error('Failed parsing JSON:', err);
          return sendError(res, 400, 'Invalid JSON');
        }

        const errors = validateCreate(data);
        if (errors.length > 0) {
          return sendError(res, 400, 'Validation failed', errors);
        }

        const created = {
          id: `mock-${Date.now()}`,
          ...data,
          createdAt: new Date().toISOString()
        }
        store.push(created)
        console.log('📝 Created:', created);

        return sendJson(res, 201, { ...created, success: true })
      });
      return;
    }

    // PUT / PATCH /api/timetable/:id -> update
    if ((req.method === 'PUT' || req.method === 'PATCH') && pathname.startsWith('/api/timetable/')) {
      const match = pathname.match(/^\/api\/timetable\/([^\/]+)$/)
      if (!match) {
        return sendError(res, 404, 'Not found');
      }
      const id = decodeURIComponent(match[1])
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        if (!body) return sendError(res, 400, 'Empty request body');
        let patch = {};
        try {
          patch = JSON.parse(body || '{}');
        } catch (err) {
          console.error('Failed parsing JSON for update:', err);
          return sendError(res, 400, 'Invalid JSON');
        }
        const idx = store.findIndex(r => String(r.id) === String(id));
        if (idx === -1) {
          return sendError(res, 404, 'Not found');
        }
        const updated = { ...store[idx], ...patch, updatedAt: new Date().toISOString() };
        store[idx] = updated;
        console.log('🛠️ Updated:', updated);
        return sendJson(res, 200, { ...updated, success: true });
      });
      return;
    }

    // DELETE /api/timetable/:id
    if (req.method === 'DELETE' && pathname.startsWith('/api/timetable/')) {
      const match = pathname.match(/^\/api\/timetable\/([^\/]+)$/)
      if (!match) return sendError(res, 404, 'Not found');
      const id = decodeURIComponent(match[1])
      const idx = store.findIndex(r => String(r.id) === String(id))
      if (idx !== -1) {
        store.splice(idx, 1)
        console.log('🗑️ Deleted:', id)
        res.writeHead(204)
        return res.end()
      }
      // If not found, return 404 so clients know nothing was removed
      return sendError(res, 404, 'Not found');
    }

  } catch (err) {
    console.error('Handler error', err)
    return sendError(res, 500, 'Server error')
  }

  // Fallback for other routes
  sendError(res, 404, 'Not Found');
});

server.listen(PORT, () => {
  console.log(`🚀 Timetable API: http://localhost:${PORT}`);
  console.log('✅ POST /api/timetable is ready');
});

// Graceful shutdown to avoid EADDRINUSE on restart
function shutdown(signal) {
  console.log(`Received ${signal}, shutting down timetable API...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
  // Force exit if not closed in time
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
