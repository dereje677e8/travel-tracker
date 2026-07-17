// Standard ID-photo proportions (3:4, the common passport/ID-photo ratio).
// Resized/cropped client-side before upload so every stored photo is a
// consistent size regardless of what the source image looked like - no
// server-side image-processing dependency needed.
export const PHOTO_TARGET_WIDTH = 300;
export const PHOTO_TARGET_HEIGHT = 400;

/**
 * Reads an image File, center-crops it to the target aspect ratio (like
 * CSS object-fit: cover), resizes to the target pixel dimensions, and
 * returns a JPEG Blob ready to upload.
 */
export function resizeImageToBlob(file, targetWidth = PHOTO_TARGET_WIDTH, targetHeight = PHOTO_TARGET_HEIGHT) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const targetRatio = targetWidth / targetHeight;
      const sourceRatio = img.width / img.height;

      let sx, sy, sw, sh;
      if (sourceRatio > targetRatio) {
        // Source is wider than target - crop the sides.
        sh = img.height;
        sw = sh * targetRatio;
        sy = 0;
        sx = (img.width - sw) / 2;
      } else {
        // Source is taller than target - crop top/bottom.
        sw = img.width;
        sh = sw / targetRatio;
        sx = 0;
        sy = (img.height - sh) / 2;
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Could not process image'))),
        'image/jpeg',
        0.87
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not read image file'));
    };
    img.src = objectUrl;
  });
}
