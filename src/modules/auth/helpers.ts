import { Request } from 'express';

export const getCookies = (req: Request): Record<string, string> => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return {};

  return cookieHeader
    .split(';')
    .reduce<Record<string, string>>((acc, cookie) => {
      const [key, value] = cookie.split('=');
      if (key && value) acc[key.trim()] = value.trim();
      return acc;
    }, {});
};
