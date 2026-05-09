const BASE_URL = 'http://localhost:3000';

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('unauthorized'));
  }

  if (!response.ok) {
    let errorData;
    try { errorData = await response.json(); } catch { errorData = {}; }
    throw { status: response.status, message: errorData.error || errorData.detail || `HTTP ${response.status}` };
  }

  return response.json();
}
