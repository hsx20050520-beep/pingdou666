import { Platform } from "react-native";

export async function getImagePixels(
  source: string
): Promise<{ data: number[]; width: number; height: number }> {
  if (Platform.OS === "web") {
    const mod = await import("./getImagePixels.web");
    const r = await mod.getImagePixels(source);
    return { data: Array.from(r.data), width: r.width, height: r.height };
  }
  const fs = require("expo-file-system");
  const b64 = await fs.readAsStringAsync(source, {
    encoding: fs.EncodingType.Base64,
  });
  const ext = source.split(".").pop()?.toLowerCase() || "jpg";
  const mime = ext === "png" ? "image/png" : "image/jpeg";
  const dataUri = "data:" + mime + ";base64," + b64;
  return new Promise((resolve, reject) => {
    const { PixelReader } = require("./PixelReader");
    PixelReader.read(dataUri).then(resolve).catch(reject);
  });
}
