# Deployment

Noteracy runs on an Oracle Cloud VM behind nginx, managed by PM2, and
redeploys itself when `main` is pushed. The public URL is
`https://sabo.sh/notes/`, served by a Cloudflare worker that proxies to
`https://noteracy.shabbirjamal.com`.

```
browser → sabo.sh/notes/*  →  Cloudflare worker
                           →  noteracy.shabbirjamal.com  (nginx :443)
                           →  Express :3175  (PM2)
                           →  MongoDB Atlas
```

| File | Purpose |
|---|---|
| `setup.sh` | one-command provisioning of a fresh VM |
| `deploy.sh` | pull, build, reload, verify — what the webhook runs |
| `webhook.js` | GitHub push listener, HMAC-verified |
| `nginx-http.conf` | rate-limit zones (nginx `http{}` context) |
| `nginx-site.*.conf.template` | vhost, rendered by `setup.sh` |

## Mount path

The app answers on `/notes/…` rather than a domain root, because the worker in
front proxies **without rewriting the path**. Two settings define the prefix
and must agree:

| Where | Setting | Effect |
|---|---|---|
| `.env` | `BASE_PATH=/notes` | routers, static files, session cookie path, OAuth redirects |
| `client/package.json` | `"homepage": "/notes"` | built asset URLs, and `PUBLIC_URL` → the router basename |

Everything else derives from those. `config/basePath.js` normalises the value
for `server.js` and `routes/auth.js`; on the client, `src/helper.js` exposes
`BASE_PATH` and `apiUrl()`. Call `apiUrl()` for anything the server owns — a
bare `fetch('/api/v1/…')` resolves against the domain root and lands on a
neighbouring project.

`GOOGLE_CALLBACK_URL` is a real public URL: it must be
`https://sabo.sh/notes/google/callback`, and that exact string has to be listed
under *Authorized redirect URIs* in the Google Cloud console. Google matches it
literally, prefix included.

## Provision a fresh VM

```sh
git clone https://github.com/jamal474/noteracy.git && cd noteracy
sudo bash deploy/setup.sh --domain noteracy.shabbirjamal.com --email you@example.com
```

Installs Node, nginx, PM2 and certbot; writes `.env` with generated secrets;
builds the client; issues a certificate; opens the firewall; and starts both
PM2 processes with a boot-time systemd unit. Idempotent — re-run it whenever
the templates here change.

Four things must be done outside the VM. The script prints them with the right
values filled in:

1. **DNS** — `A noteracy.shabbirjamal.com → <vm-ip>`, DNS-only rather than
   proxied, or certbot cannot complete the HTTP-01 challenge.
2. **OCI Security List** — Networking → VCN → Subnet → Security List → add
   ingress for TCP 80 and 443 from `0.0.0.0/0`. The in-VM firewall is only half
   of it; without this, requests time out.
3. **MongoDB Atlas** — Network Access → add the VM's public IP. Not optional in
   practice: the app does not degrade gracefully without a database.
   `connect-mongo` can reject unhandled and take the process down, and if it
   survives, `express-session` stops attaching `req.session` once its store is
   unready, so `passport.session()` throws and almost every route answers 500.
   Either way `GET /notes/healthz` tells the truth — `{"ok":false,"db":"…"}`
   with a 503. PM2 uses exponential backoff, so the app recovers on its own
   once the database is reachable.
4. **GitHub webhook** — repo → Settings → Webhooks → Add webhook, payload URL
   `https://noteracy.shabbirjamal.com/__deploy`, content type
   `application/json`, secret = the `DEPLOY_WEBHOOK_SECRET` the script
   generated, events = just the push event.

## Deploying

A push to `main` is enough. `webhook.js` verifies GitHub's HMAC signature,
answers 202 immediately (a build outlasts GitHub's 10-second timeout) and runs
`deploy.sh`.

```sh
./deploy/deploy.sh               # the same thing, by hand
./deploy/deploy.sh --no-pull     # rebuild what is already checked out
./deploy/deploy.sh --skip-build  # server-only change
tail -f logs/deploy.log          # watch a deploy in progress
```

The deploy builds into `client/build.new` and swaps it in at the end, so the
previous build keeps serving for the minute or so the build takes. If
`/notes/healthz` does not return `{"ok":true}` within 60 seconds afterwards,
the checkout and the build are both rolled back and the previous version is
brought back up.

Two details worth knowing:

- **Both npm flags are explicit.** This repo does not commit lockfiles, so
  `npm ci` is unavailable; and `NODE_ENV=production` makes npm omit
  devDependencies, which the client build needs (`tailwind.config.js` requires
  `@tailwindcss/typography`). Hence `--omit=dev` for the server and
  `--include=dev` for the client.
- **The health gate checks the body, not just the status.** The client's
  catch-all answers 200 with `index.html` for any unmatched path under the
  mount, so a status code alone would make a missing health route look fine.

## Everyday commands

```sh
pm2 logs noteracy              application logs
pm2 logs noteracy-deploy       webhook logs
pm2 reload noteracy            restart after editing .env
pm2 status                     what is running
```

`.env` is the only file you edit on the box. `setup.sh` generates
`SESSION_SECRET` and `DEPLOY_WEBHOOK_SECRET` on first run and never touches
them again, so re-running it does not invalidate sessions or break the
configured webhook.

## Client IP attribution

nginx is configured with Cloudflare's published ranges and
`real_ip_header CF-Connecting-IP`, then overwrites `X-Forwarded-For` with the
resulting address. That is why `TRUST_PROXY=1` is correct despite there being
two hops: Express sees exactly one trustworthy entry. Without it every request
would appear to come from a Cloudflare address and the rate limiter would treat
all visitors as one client. `setup.sh` refreshes the range list on each run and
warns if it could not fetch them.
