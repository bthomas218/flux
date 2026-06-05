import sharp from "sharp";
import type { ImageTranscodePayload } from "../../types.js";

async function transcodeProcessor(
  file: Buffer,
  opts?: {
    format?: ImageTranscodePayload["options"]["format"];
  },
) {
  switch (opts?.format) {
    case "jpeg":
      return sharp(file).jpeg().toBuffer();
    case "png":
      return sharp(file).png().toBuffer();
    case "webp":
      return sharp(file).webp().toBuffer();
    case "avif":
      return sharp(file).avif().toBuffer();
    default:
      throw new Error("Unknown Format");
  }
}

export default transcodeProcessor;
