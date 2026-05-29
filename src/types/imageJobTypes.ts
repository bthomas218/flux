export type ImageJobNames =
  | "image.resize"
  | "image.transcode"
  | "image.alttext";

export type ImageResizePayload = {
  type: "image.resize";
  fileId: string;
  options: {
    width?: number;
    height?: number;
    fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  };
};

export type ImageTranscodePayload = {
  type: "image.transcode";
  fileId: string;
  options: {
    format: "jpeg" | "png" | "webp" | "avif";
    quality?: number;
  };
};

export type ImageAltTextPayload = {
  type: "image.alttext";
  fileId: string;
  options?: Record<string, never>;
};

export type ImageJobPayload =
  | ImageResizePayload
  | ImageTranscodePayload
  | ImageAltTextPayload;

export type ImageResultPayLoad =
  | {
      type: "image.resize" | "image.transcode";
      output: {
        fileId: string;
        storageKey: string;
        mimeType: string;
        width: number;
        height: number;
      };
    }
  | {
      type: "image.alttext";
      output: {
        altText: string;
      };
    };
