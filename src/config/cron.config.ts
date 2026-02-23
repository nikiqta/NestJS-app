// config/cron.config.ts
import { registerAs } from '@nestjs/config';
import { Environment } from './config.validation';

const byEnv: Record<Environment, { jobs: Record<string, string> }> = {
  dev: {
    jobs: {
      sayHallo: '*/30 * * * * *', // every 30 seconds (dev)
      sayGoodBuy: '0 */5 * * * *', // every 5 minutes
    },
  },
  test: {
    jobs: {
      sayHallo: '*/5 * * * *', // every 5 minutes
      sayGoodBuy: '0 */30 * * * *', // every 30 minutes
    },
  },
  uat: {
    jobs: {
      sayHallo: '*/10 * * * *',
      sayGoodBuy: '0 0 * * * *', // hourly
    },
  },
  prod: {
    jobs: {
      sayHallo: '0 */15 * * * *', // every 15 minutes
      sayGoodBuy: '0 0 3 * * *', // daily at 03:00
    },
  },
};

export default registerAs('cron', () => {
  const env = (process.env.APP_ENV ?? Environment.Dev) as Environment;
  return byEnv[env] ?? byEnv.dev;
});
