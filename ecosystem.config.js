// PM2 config. Two processes: the Express app and the GitHub deploy webhook.
// Secrets stay in .env, read by the processes themselves, not listed here.

require('dotenv').config({ path: __dirname + '/.env' });

const env = process.env;

module.exports = {
  apps: [
    {
      name: 'noteracy',
      script: 'server.js',
      cwd: __dirname,

      // Single process: the in-memory rate limiter would not survive clustering.
      instances: 1,
      exec_mode: 'fork',

      watch: false,
      max_memory_restart: '400M',
      autorestart: true,
      kill_timeout: 5000,

      // Backoff rather than a restart cap: an unreachable MongoDB takes the
      // process down, and this lets it recover on its own when the DB returns.
      exp_backoff_restart_delay: 2000,

      env: {
        NODE_ENV: 'production',
        PORT: env.PORT || 3175,
        BASE_PATH: env.BASE_PATH || '/notes',
        TRUST_PROXY: env.TRUST_PROXY || 1,
      },

      error_file: 'logs/err.log',
      out_file: 'logs/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },

    {
      name: 'noteracy-deploy',
      script: 'deploy/webhook.js',
      cwd: __dirname,

      instances: 1,
      exec_mode: 'fork',

      watch: false,
      max_memory_restart: '150M',
      autorestart: true,
      restart_delay: 2000,

      env: {
        NODE_ENV: 'production',
        DEPLOY_WEBHOOK_PORT: env.DEPLOY_WEBHOOK_PORT || 3176,
        DEPLOY_BRANCH: env.DEPLOY_BRANCH || 'main',
      },

      error_file: 'logs/deploy-err.log',
      out_file: 'logs/deploy-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
