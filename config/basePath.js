/**
 * The single sub-path this app answers on.
 *
 * Noteracy is reached as https://<short-domain>/notes/… through a Cloudflare
 * worker that proxies without rewriting the path, so the Express app has to
 * mount itself at that same prefix: routers, static files, the session cookie
 * and the Google OAuth callback all hang off this value.
 *
 * Normalised to a leading slash with no trailing one, so `BASE_PATH + '/x'`
 * is always well formed and `BASE_PATH` alone is a valid cookie path.
 */
const BASE_PATH = `/${(process.env.BASE_PATH || '/notes').replace(/^\/+|\/+$/g, '')}`;

module.exports = { BASE_PATH };
