export async function apiFetch<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  // Normalize relative API paths: allow passing '/api/...' or full URLs
  const url = typeof input === 'string' ? input : String(input);

  const res = await fetch(url, init);
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
