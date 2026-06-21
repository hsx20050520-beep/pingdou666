
/**
 * Web platform: use browser Canvas API to read image pixels
 */
export async function getImagePixels(
  source: File | string
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  const img = await loadImage(source);
  const maxDim = 1024;
  let w = img.width, h = img.height;
  if (w > maxDim || h > maxDim) {
    const s = Math.min(maxDim / w, maxDim / h);
    w = Math.round(w * s); h = Math.round(h * s);
  }
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  const id = ctx.getImageData(0, 0, w, h);
  return { data: id.data, width: w, height: h };
}

function loadImage(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = source instanceof File ? URL.createObjectURL(source) : (source as string);
  });
}
