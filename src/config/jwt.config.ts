import { registerAs } from '@nestjs/config';
import { Environment } from './validation.config';

const byEnv: Record<
  Environment,
  {
    accessTokenExpirationPeriodInMinutes: number;
    refreshTokenExpirationPeriodInMinutes: number;
  }
> = {
  dev: {
    accessTokenExpirationPeriodInMinutes: 5, // 5 minutes
    refreshTokenExpirationPeriodInMinutes: 360, // 6 hours
  },
  test: {
    accessTokenExpirationPeriodInMinutes: 15, // 15 minutes
    refreshTokenExpirationPeriodInMinutes: 480, // 8h
  },
  uat: {
    accessTokenExpirationPeriodInMinutes: 15, // 15 minutes
    refreshTokenExpirationPeriodInMinutes: 480, // 8h
  },
  prod: {
    accessTokenExpirationPeriodInMinutes: 60, // 60 minutes
    refreshTokenExpirationPeriodInMinutes: 1440, // 1 day
  },
};

export default registerAs('session', () => {
  const env = (process.env.APP_ENV ?? Environment.Dev) as Environment;
  return byEnv[env] ?? byEnv.dev;
});
