export const levelToNestLevels: Record<string, any[]> = {
  fatal: ['error'],
  error: ['error'],
  warn: ['warn', 'error'],
  log: ['log', 'warn', 'error'],
  debug: ['debug', 'log', 'warn', 'error'],
  verbose: ['verbose', 'debug', 'log', 'warn', 'error'],
};
