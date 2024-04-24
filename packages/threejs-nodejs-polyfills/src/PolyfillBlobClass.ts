import { BinaryLike } from "node:crypto";

export class PolyfillBlobClass {
  public size: number;
  public type: string;
  private static blobCounter = 0;

  /*
   Blobs are accessed using global names - they must be accessible to code paths that create classes that read blobs
   from within libraries outside the control of this code.
  */
  public static blobByBlobId = new Map<string, PolyfillBlobClass>();

  // Not part of the standard blob interface - used to allow easy access
  public buffer: Uint8Array;
  // Not part of the standard blob interface - used to allow easy access
  public blobId: string;

  constructor(parts: Array<BinaryLike>, options: { type: string }) {
    this.blobId = "blob" + PolyfillBlobClass.blobCounter++;

    let length = 0;
    for (const part of parts) {
      if (part instanceof ArrayBuffer) {
        length += part.byteLength;
      } else if (part instanceof Uint8Array) {
        length += part.byteLength;
      } else if (part instanceof Buffer) {
        length += part.length;
      } else if (part instanceof DataView) {
        length += part.byteLength;
      } else {
        throw new Error("Unsupported blob part type: " + typeof part);
      }
    }
    const buffer = new Uint8Array(length);
    let offset = 0;
    for (const part of parts) {
      if (part instanceof ArrayBuffer) {
        buffer.set(new Uint8Array(part), offset);
        offset += part.byteLength;
      } else if (part instanceof Uint8Array) {
        buffer.set(part, offset);
        offset += part.byteLength;
      } else if (part instanceof Buffer) {
        buffer.set(part, offset);
        offset += part.length;
      } else if (part instanceof DataView) {
        buffer.set(new Uint8Array(part.buffer, part.byteOffset, part.byteLength), offset);
        offset += part.byteLength;
      }
    }
    this.size = buffer.length;
    this.type = options.type;
    this.buffer = buffer;
    PolyfillBlobClass.blobByBlobId.set(this.blobId, this);
  }

  public arrayBuffer() {
    const uint8Array = this.buffer;
    const arrayBuffer = new ArrayBuffer(uint8Array!.byteLength);
    new Uint8Array(arrayBuffer).set(uint8Array!);
    return Promise.resolve(arrayBuffer);
  }
}
