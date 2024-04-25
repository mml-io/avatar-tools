import { ImageData } from "@napi-rs/canvas";

export class PolyfillImageDataClass extends ImageData {
  constructor(sw: number, sh: number);
  constructor(data: Uint8ClampedArray, sw: number, sh?: number);
  constructor(data: Uint8ClampedArray | number, sw: number, sh?: number) {
    if (sh === undefined && typeof data === "number") {
      super(data, sw);
      return;
    }
    super(data as Uint8ClampedArray, sw, sh);
  }
}
