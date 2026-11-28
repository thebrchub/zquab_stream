// Images are converted to WebP in the browser before upload, so the backend
// only accepts (and stores) small WebP files.

export const WEBP_MIME = 'image/webp';
export const MAX_UPLOAD_IMAGE_BYTES = 1024 * 1024; // keep in step with the backend's limit

export interface WebpOptions {
  maxWidth: number;
  maxHeight: number;
  maxBytes?: number;
}

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, WEBP_MIME, quality));

// Resizes an image of any format the browser can open to fit within
// maxWidth x maxHeight (never enlarging it) and encodes it as WebP no bigger
// than maxBytes, lowering the quality and then the size until it fits.
export async function convertToWebp(file: File, { maxWidth, maxHeight, maxBytes = MAX_UPLOAD_IMAGE_BYTES }: WebpOptions): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This image could not be read. Try a JPEG, PNG or WebP file.');
  }

  try {
    let scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
    for (let attempt = 0; attempt < 5; attempt++) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('This browser cannot convert images.');
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.85, 0.7, 0.55]) {
        const blob = await canvasToBlob(canvas, quality);
        if (!blob || blob.type !== WEBP_MIME) throw new Error('This browser cannot convert images to WebP.');
        if (blob.size <= maxBytes) return blob;
      }
      scale *= 0.75;
    }
  } finally {
    bitmap.close();
  }
  throw new Error('This image is too large. Choose a smaller one.');
}

// PUTs a WebP blob to a one-time upload URL.
export async function putWebp(url: string, blob: Blob): Promise<void> {
  const response = await fetch(url, { method: 'PUT', headers: { 'Content-Type': WEBP_MIME }, body: blob });
  if (!response.ok) throw new Error('Upload failed.');
}
