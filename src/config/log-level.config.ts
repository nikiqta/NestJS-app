// config/cron.config.ts
import { registerAs } from '@nestjs/config';
import { Environment } from './config.validation';

const byEnv: Record<Environment, { level: string }> = {
  dev: {
    level: 'debug',
  },
  test: {
    level: 'debug',
  },
  uat: {
    level: 'debug',
  },
  prod: {
    level: 'debug',
  },
};

export default registerAs('logLevel', () => {
  const env = (process.env.APP_ENV ?? Environment.Dev) as Environment;
  return byEnv[env] ?? byEnv.dev;
});
