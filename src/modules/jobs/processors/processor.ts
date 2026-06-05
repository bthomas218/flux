import type {
  ImageJobNames,
  ImageResizePayload,
  ImageTranscodePayload,
} from "../types.js";
import resizeProcessor from "./image/resizeProcessor.js";
import transcodeProcessor from "./image/transcodeProcessor.js";

export type ProcessorOptions = {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageTranscodePayload["options"]["format"];
  fit?: ImageResizePayload["options"]["fit"];
};

export type Processor = (
  file: NodeJS.ReadableStream,
  opts?: ProcessorOptions,
) => NodeJS.ReadableStream | Promise<string> | string;

// This is a placeholder
function process(file: NodeJS.ReadableStream): string {
  file.resume();
  return "Placeholder";
}

export const processorRegistry = {
  "image.resize": resizeProcessor,
  "image.transcode": transcodeProcessor,
  "image.alttext": process,
} satisfies Record<ImageJobNames, Processor>;
