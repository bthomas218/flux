import sharp from "sharp";
import type { ProcessorOptions } from "../processor.js";

export function resizeProcessor(
  file: NodeJS.ReadableStream,
  opts?: ProcessorOptions,
) {
  return file.pipe(
    sharp().resize({
      width: opts?.width,
      height: opts?.height,
      fit: opts?.fit,
    }),
  );
}

export default resizeProcessor;
