import type { ImageJobNames, ImageResizePayload } from "../types.js";
import resizeProcessor from "./image/resizeProcessor.js";
import type { ImageTranscodePayload } from "../types.js";
import transcodeProcessor from "./image/transcodeProcessor.js";

export type Processor = (
  file: Buffer,
  opts?: {
    width?: number;
    height?: number;
    format?: ImageTranscodePayload["options"]["format"];
    fit?: ImageResizePayload["options"]["fit"];
  },
) => Promise<Buffer> | Promise<string>;

// This is a placeholder
async function process(file: Buffer): Promise<Buffer> {
  return Buffer.from("Placeholder");
}

export const processorRegistry = {
  "image.resize": resizeProcessor,
  "image.transcode": transcodeProcessor,
  "image.alttext": process,
} satisfies Record<ImageJobNames, Processor>;
