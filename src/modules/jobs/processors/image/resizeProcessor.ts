import sharp from "sharp";
import type { ImageResizePayload } from "../../types.js";

export async function resizeProcessor(
  file: Buffer,
  opts?: {
    width?: number;
    height?: number;
    fit?: ImageResizePayload["options"]["fit"];
  },
) {
  return sharp(file)
    .resize({
      width: opts?.width,
      height: opts?.height,
      fit: opts?.fit,
    })
    .toBuffer();
}

export default resizeProcessor;
