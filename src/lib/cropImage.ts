import type { Area } from "react-easy-crop";
import { DEFAULT_MAX_EDGE, JPEG_QUALITY } from "@/lib/compressImage";

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (e) => reject(e));
    image.src = url;
  });
}

/** Renders the cropped region from the source image into a JPEG blob. */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  quality = JPEG_QUALITY,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  const srcW = Math.max(1, Math.round(pixelCrop.width));
  const srcH = Math.max(1, Math.round(pixelCrop.height));
  const longest = Math.max(srcW, srcH);
  const scale = longest > DEFAULT_MAX_EDGE ? DEFAULT_MAX_EDGE / longest : 1;
  canvas.width = Math.max(1, Math.round(srcW * scale));
  canvas.height = Math.max(1, Math.round(srcH * scale));

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not export image"));
      },
      "image/jpeg",
      quality,
    );
  });
}
