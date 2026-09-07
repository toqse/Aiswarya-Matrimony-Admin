/**
 * Client-side image downscale/compress before multipart upload.
 * Shrinks phone-camera originals so profile PATCH/POST finishes faster on VPS.
 */

export const DEFAULT_MAX_EDGE = 1600;
const AADHAAR_MAX_EDGE = 2000;
export const JPEG_QUALITY = 0.82;

const AADHAAR_KEYS = new Set(["aadhaar_front", "aadhaar_back"]);

function isCompressibleImage(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  if (type === "application/pdf") return false;
  if (type.startsWith("image/")) {
    // Animated GIF / HEIC may fail on canvas; skip exotic types safely.
    if (type === "image/gif" || type === "image/heic" || type === "image/heif") {
      return false;
    }
    return true;
  }
  // Some browsers omit type; sniff extension.
  const name = file.name.toLowerCase();
  return /\.(jpe?g|png|webp|bmp)$/i.test(name);
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode image"));
    };
    img.src = url;
  });
}

/**
 * Downscale and re-encode as JPEG when beneficial. Returns the original File on
 * failure or when already small enough / non-image.
 */
export async function compressImageFile(
  file: File,
  opts?: { maxEdge?: number; quality?: number },
): Promise<File> {
  if (!isCompressibleImage(file)) return file;

  const maxEdge = opts?.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = opts?.quality ?? JPEG_QUALITY;

  try {
    const img = await loadImageFromFile(file);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return file;

    const longest = Math.max(w, h);
    const scale = longest > maxEdge ? maxEdge / longest : 1;
    // Skip work when already within bounds and under ~900KB JPEG-ish.
    if (scale >= 1 && file.size <= 900_000 && /jpe?g/i.test(file.type || file.name)) {
      return file;
    }

    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, tw, th);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
    );
    if (!blob || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

export async function compressProfileUploadFile(
  key: string,
  file: File,
): Promise<File> {
  const maxEdge = AADHAAR_KEYS.has(key) ? AADHAAR_MAX_EDGE : DEFAULT_MAX_EDGE;
  return compressImageFile(file, { maxEdge });
}
