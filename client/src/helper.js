// URL helpers for a client mounted on a sub-path. Use apiUrl() for anything
// the server owns; a bare "/api/v1/…" would resolve against the domain root.

// CRA fills PUBLIC_URL from package.json "homepage", but only in production.
export const BASE_PATH = (
  process.env.PUBLIC_URL ||
  process.env.REACT_APP_BASE_PATH ||
  '/notes'
).replace(/\/+$/, '');

// Empty in production (same origin). In dev it points at the Express server,
// because CRA's proxy skips top-level navigations like the OAuth link.
const API_ORIGIN = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/+$/, '');

// apiUrl('/api/v1/dashboard') → '/notes/api/v1/dashboard'
export function apiUrl(path) {
  return `${API_ORIGIN}${BASE_PATH}${path}`;
}

export default BASE_PATH;
