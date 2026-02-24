import { registerAs } from '@nestjs/config';
import { Environment } from './validation.config';

const byEnv: Record<Environment, { uri: string }> = {
  dev: {
    uri: `mongodb://localhost:27017/event-room-test`,
  },
  test: {
    uri: 'mongodb://localhost:27017/event-room-test',
  },
  uat: {
    uri: 'mongodb://localhost:27017/event-room-test',
  },
  prod: {
    uri: 'mongodb://localhost:27017/event-room-test',
  },
};

export default registerAs('logLevel', () => {
  const env = (process.env.APP_ENV ?? Environment.Dev) as Environment;
  return byEnv[env] ?? byEnv.dev;
});
