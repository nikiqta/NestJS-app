// utils.ts
import type { Request } from 'express';
import { createReadStream, createWriteStream, promises as fsp } from 'node:fs';

export type CookieMap = Record<string, string>;

export const getCookies = (req: Request): CookieMap => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce<CookieMap>((acc, cookie) => {
    const [key, value] = cookie.split('=');
    if (key && value) acc[key.trim()] = value.trim();
    return acc;
  }, {});
};

type SanitizedFsError = Error & { path?: never };

function sanitizeFsError(err: unknown): SanitizedFsError {
  const e = err as Error & { path?: unknown };
  if (e && typeof e === 'object' && 'path' in e) {
    // dropping the path as per request after penetration testing
    try {
      delete (e as { path?: unknown }).path;
    } catch {
      // ignore if non-configurable
    }
  }
  return e as SanitizedFsError;
}

/** Copies a file from source -> target using streams */
export function createFile(source: string, target: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const readStream = createReadStream(source);
    const writeStream = createWriteStream(target);

    readStream.on('error', (err) => reject(sanitizeFsError(err)));
    writeStream.on('error', (err) => reject(sanitizeFsError(err)));
    writeStream.on('close', () => resolve());

    readStream.pipe(writeStream);
  });
}

/** Deletes a file */
export async function deleteFile(path: string): Promise<void> {
  try {
    await fsp.unlink(path);
  } catch (err) {
    throw sanitizeFsError(err);
  }
}

/** Reads a file and returns its raw Buffer */
export async function readFile(path: string): Promise<Buffer> {
  try {
    return await fsp.readFile(path);
  } catch (err) {
    throw sanitizeFsError(err);
  }
}
