import { Platform } from "react-native";
import { processPixels, type ProcessedResult } from "./processPixels";

export type { ProcessedResult };

/**
 * Process image on any platform.
 * On web: uses Canvas API directly.
 * On native: uses WebView-based Canvas for pixel reading + pure JS processing.
 */
export async function processImage(
  source: File | string,
  targetSize: number,
  brand: string = "mard"
): Promise<ProcessedResult> {
  let pixelData: { data: number[] | Uint8ClampedArray; width: number; height: number };

  if (Platform.OS === "web") {
    const { getImagePixels } = await import("./getImagePixels.web");
    pixelData = await getImagePixels(source as File);
  } else {
    const { getImagePixels } = await import("./getImagePixels");
    pixelData = await getImagePixels(source as string);
  }

  // Original dimensions (approximate from pixel reader)
  const ow = pixelData.width;
  const oh = pixelData.height;

  return processPixels(
    pixelData.data,
    pixelData.width,
    pixelData.height,
    ow, oh,
    targetSize,
    brand as any
  );
}
