import process from "process";

import { PolyfillBlobClass } from "./PolyfillBlobClass";

export class PolyfillFileReader extends EventTarget {
  public onloadend: () => void = () => {};
  public result: ArrayBuffer | string = new ArrayBuffer(0);

  public readAsArrayBuffer(blob: Blob) {
    process.nextTick(async () => {
      this.result = await blob.arrayBuffer();
      this.onloadend();
    });
  }

  public readAsDataURL(blob: PolyfillBlobClass) {
    const buffer = blob.buffer;
    if (!buffer) {
      throw new Error("Buffer not found");
    }
    const b64encoded = Buffer.from(buffer).toString("base64");
    const dataUrl = "data:" + blob.type + ";base64," + b64encoded;
    this.result = dataUrl;
    process.nextTick(async () => {
      this.onloadend();
    });
    return Promise.resolve(dataUrl);
  }
}
