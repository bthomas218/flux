import sharp from "sharp";
import type { ProcessorOptions } from "../processor.js";

function transcodeProcessor(
  file: NodeJS.ReadableStream,
  opts?: ProcessorOptions,
) {
  switch (opts?.format) {
    case "jpeg":
      return file.pipe(sharp().jpeg({ quality: opts.quality }));
    case "png":
      return file.pipe(sharp().png({ quality: opts.quality }));
    case "webp":
      return file.pipe(sharp().webp({ quality: opts.quality }));
    case "avif":
      return file.pipe(sharp().avif({ quality: opts.quality }));
    default:
      throw new Error("Unknown Format");
  }
}

export default transcodeProcessor;
