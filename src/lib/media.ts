import type { PendingAttachment } from '@/db/types';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_DIM = 1600;

export function isImageFile(file: File): boolean {
  return ACCEPTED.includes(file.type);
}

export async function fileToAttachment(file: File): Promise<PendingAttachment> {
  if (!isImageFile(file)) throw new Error('Only JPEG, PNG and WebP images are supported.');
  if (file.size > MAX_BYTES) throw new Error('Image is too large (max 8 MB).');
  const data = await downscale(file);
  return { data, name: file.name, size: file.size };
}

function downscale(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable');
        ctx.drawImage(img, 0, 0, w, h);
        const type = file.type === 'image/png' ? 'image/png' : file.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
        resolve(canvas.toDataURL(type, 0.85));
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Failed to process image'));
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    img.src = url;
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
