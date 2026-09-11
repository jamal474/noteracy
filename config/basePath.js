// Sub-path the app is mounted at: routers, static files, cookie path and the
// OAuth callback all derive from it. Leading slash, no trailing slash.
const BASE_PATH = `/${(process.env.BASE_PATH || '/notes').replace(/^\/+|\/+$/g, '')}`;

module.exports = { BASE_PATH };
