// config/cron.config.ts
import { registerAs } from '@nestjs/config';
import { Environment } from './validation.config';

const byEnv: Record<Environment, { jobs: Record<string, string> }> = {
  dev: {
    jobs: {
      sessionsCheck: '*/30 * * * * *', // every 30 seconds (dev)
    },
  },
  test: {
    jobs: {
      sessionsCheck: '*/5 * * * *', // every 5 minutes
    },
  },
  uat: {
    jobs: {
      sessionsCheck: '*/10 * * * *', // every 10 minutes
    },
  },
  prod: {
    jobs: {
      sessionsCheck: '0 */15 * * * *', // every 15 minutes
    },
  },
};

export default registerAs('cron', () => {
  const env = (process.env.APP_ENV ?? Environment.Dev) as Environment;
  return byEnv[env] ?? byEnv.dev;
});
