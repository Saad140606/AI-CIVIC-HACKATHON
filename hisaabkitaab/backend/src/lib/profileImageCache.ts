import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';

const cacheDir = path.resolve(__dirname, '../../public/images/mnas');

/** Ensure the cache directory exists */
function ensureCacheDir() {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
}

/** Download an image from a URL and save it to the cache directory */
export async function cacheProfileImage(mnaId: string, imageUrl: string): Promise<string> {
  ensureCacheDir();
  const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
  const filePath = path.join(cacheDir, `${mnaId}${ext}`);
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
    const buffer = await res.buffer();
    fs.writeFileSync(filePath, buffer);
    return filePath;
  } catch (err) {
    console.warn('⚠️ Could not cache profile image:', err);
    return '';
  }
}

/** Get the local cached path if exists, otherwise return the original URL */
export function getProfileImageUrl(mnaId: string, originalUrl: string): string {
  const ext = path.extname(new URL(originalUrl).pathname) || '.jpg';
  const localPath = path.join(cacheDir, `${mnaId}${ext}`);
  if (fs.existsSync(localPath)) {
    // Return relative path for the frontend to serve static files
    return `/images/mnas/${mnaId}${ext}`;
  }
  return originalUrl;
}
