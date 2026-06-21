
import { Platform } from "react-native";
import { processImageLocally, type ProcessedImage } from "./image-processor";

// Web: process directly with Canvas
export async function processImage(file: File, targetSize: number, brand: string): Promise<ProcessedImage> {
  if (Platform.OS === "web") {
    const { processImageLocally } = await import("./image-processor");
    return processImageLocally(file, targetSize, brand as any);
  }
  // Native: read file, pass through WebView, then process pixels
  const { processImageNative } = await import("./processNative");
  return processImageNative(file, targetSize, brand as any);
}
