/**
 * Loads an image file and re-encodes it as a JPEG data URL no larger than maxDimension
 * on its longest side. Phone photos are often 4000px+ and several MB; this keeps
 * uploads small (and AI vision calls cheap) without hurting legibility.
 */
export async function downscaleImage(file: File, maxDimension = 1600, quality = 0.85): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read that image. Try a JPEG or PNG photo.'));
      el.src = url;
    });

    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not process the image on this device.');
    // White background so transparent PNGs don't turn black as JPEG
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
