/**
 * URL helpers for a client that does not live at a domain root.
 *
 * Noteracy is served from https://<short-domain>/notes/ through a Cloudflare
 * worker that proxies without rewriting the path, so every same-origin URL the
 * app builds — API calls, OAuth links, the router's basename — has to carry
 * that prefix. Hard-coded "/api/v1/…" strings would resolve against the domain
 * root and hit whichever neighbouring project happens to sit there.
 */

// CRA fills PUBLIC_URL from "homepage" in package.json, but only in production
// builds; in development it is an empty string, so fall back to the same
// default the dev server mounts at. REACT_APP_BASE_PATH overrides both.
export const BASE_PATH = (
  process.env.PUBLIC_URL ||
  process.env.REACT_APP_BASE_PATH ||
  '/notes'
).replace(/\/+$/, '');

// Empty in production: the API is same-origin, behind the same proxy. In
// development it points straight at the Express server, because CRA's dev
// proxy deliberately skips top-level navigations — which is exactly what the
// "Sign in with Google" link is.
const API_ORIGIN = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/+$/, '');

/**
 * Build a URL for something the server owns.
 *   apiUrl('/api/v1/dashboard')  →  '/notes/api/v1/dashboard'
 *   apiUrl('/auth/google')       →  'http://localhost:3175/notes/auth/google'
 */
export function apiUrl(path) {
  return `${API_ORIGIN}${BASE_PATH}${path}`;
}

export default BASE_PATH;
