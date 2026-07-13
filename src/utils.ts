/**
 * Compresses an image on the client-side using the HTML5 Canvas API
 * to optimize data usage before storing or uploading.
 */
export function compressImage(base64Str: string, maxWidth = 450, maxHeight = 450, quality = 0.65): Promise<string> {
  return new Promise((resolve) => {
    if (!base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Save as low-bandwidth JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg'];

/**
 * Reads a user-selected file as a data URL, rejecting anything that isn't
 * PNG or JPEG (the accept attribute alone doesn't stop drag-and-drop or an
 * "All Files" override in the OS picker).
 */
export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      reject(new Error('Only PNG and JPEG images are allowed.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}
