// GitHub push webhook → runs deploy/deploy.sh. Binds to loopback; nginx
// forwards only /__deploy. Authenticated by the X-Hub-Signature-256 HMAC.

require('dotenv').config({ path: __dirname + '/../.env' });

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const APP_DIR = path.resolve(__dirname, '..');
const SECRET = process.env.DEPLOY_WEBHOOK_SECRET || '';
const PORT = Number(process.env.DEPLOY_WEBHOOK_PORT || 3176);
const BRANCH = process.env.DEPLOY_BRANCH || 'main';
const LOG_FILE = path.join(APP_DIR, 'logs', 'deploy.log');
const MAX_BODY = 10 * 1024 * 1024;

if (!SECRET) {
  console.error('[deploy] DEPLOY_WEBHOOK_SECRET is not set in .env — refusing to start.');
  console.error('[deploy] Generate one:  openssl rand -hex 32');
  process.exit(1);
}

fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

const log = (...args) =>
  console.log(`[deploy] ${new Date().toISOString()}`, ...args);

let running = false;

// Constant-time compare; never throws on a malformed header.
function signatureMatches(body, header) {
  if (!header) return false;
  const expected = `sha256=${crypto.createHmac('sha256', SECRET).update(body).digest('hex')}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function runDeploy(reason) {
  running = true;
  log(`starting deploy (${reason})`);

  const out = fs.openSync(LOG_FILE, 'a');
  fs.writeSync(out, `\n\n===== ${new Date().toISOString()} — ${reason} =====\n`);

  const child = spawn('bash', [path.join(APP_DIR, 'deploy', 'deploy.sh')], {
    cwd: APP_DIR,
    stdio: ['ignore', out, out],
  });

  child.on('exit', (code) => {
    fs.closeSync(out);
    running = false;
    // 75 = EX_TEMPFAIL: another run held the lock.
    if (code === 0) log('deploy finished: success');
    else if (code === 75) log('deploy skipped: another run already in progress');
    else log(`deploy finished: FAILED (exit ${code}) — see ${LOG_FILE}`);
  });

  child.on('error', (err) => {
    fs.closeSync(out);
    running = false;
    log(`could not start deploy: ${err.message}`);
  });
}

const server = http.createServer((req, res) => {
  const send = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  if (req.method !== 'POST') {
    res.writeHead(405, { Allow: 'POST' });
    return res.end();
  }

  const chunks = [];
  let size = 0;
  let aborted = false;

  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY) {
      aborted = true;
      send(413, { error: 'Payload too large' });
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', () => {
    if (aborted) return;
    const body = Buffer.concat(chunks);

    if (!signatureMatches(body, req.headers['x-hub-signature-256'])) {
      log(`rejected: bad or missing signature (delivery ${req.headers['x-github-delivery'] || '?'})`);
      return send(401, { error: 'Invalid signature' });
    }

    const event = req.headers['x-github-event'];
    if (event === 'ping') {
      log('ping received — webhook is wired up correctly');
      return send(200, { ok: true, pong: true });
    }
    if (event !== 'push') {
      return send(202, { ok: true, ignored: `event: ${event}` });
    }

    let payload;
    try {
      payload = JSON.parse(body.toString('utf8'));
    } catch {
      return send(400, { error: 'Malformed JSON' });
    }

    if (payload.ref !== `refs/heads/${BRANCH}`) {
      log(`ignored push to ${payload.ref} (tracking ${BRANCH})`);
      return send(202, { ok: true, ignored: payload.ref });
    }

    if (payload.deleted) {
      return send(202, { ok: true, ignored: 'branch deleted' });
    }

    const sha = (payload.after || '').slice(0, 7);
    const who = payload.pusher?.name || 'unknown';

    if (running) {
      log(`deploy already running — ${sha} will be picked up by the next run`);
      return send(202, { ok: true, queued: false, note: 'deploy already running' });
    }

    // Answer first: the build outlasts GitHub's 10s webhook timeout.
    send(202, { ok: true, deploying: sha });
    runDeploy(`push ${sha} by ${who}`);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  log(`listening on 127.0.0.1:${PORT}, tracking ${BRANCH}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    log(`${signal} received — closing`);
    server.close(() => process.exit(0));
  });
}
