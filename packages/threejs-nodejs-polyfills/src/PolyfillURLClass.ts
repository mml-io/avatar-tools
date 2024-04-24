import { PolyfillBlobClass } from "./PolyfillBlobClass";

export class PolyfillURLClass {
  static revokeObjectURL(url: string) {
    // ignore
  }

  static createObjectURL(blob: PolyfillBlobClass) {
    if (!blob.blobId) {
      throw new Error("Blob not found");
    }
    return "blob://" + blob.blobId;
  }
}
