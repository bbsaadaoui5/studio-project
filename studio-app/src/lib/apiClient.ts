export async function apiFetch<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  // Normalize relative API paths: allow passing '/api/...' or full URLs
  const url = typeof input === 'string' ? input : String(input);

  // If caller provided a body and didn't set Content-Type, and body is a string (JSON), set header
  const safeInit = { ...(init || {}) } as RequestInit;
  const headers = new Headers(safeInit.headers || {});
  if (safeInit.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  safeInit.headers = headers;

  const res = await fetch(url, safeInit);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const msg = text || res.statusText || `Request failed with status ${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    throw err;
  }

  // Try to parse JSON, but if empty return null
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }

  // If not JSON, return text as unknown
  const text = await res.text();
  return text as unknown as T;
}

export default apiFetch;
