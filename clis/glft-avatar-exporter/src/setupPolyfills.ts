import { BinaryLike } from "node:crypto";
import process from "process";

import { Canvas, Image, ImageData, loadImage } from "@napi-rs/canvas";
import Jimp from "jimp";

/*
 Blobs are accessed using global names - they must be accessible to code paths that create classes that read blobs
 from within libraries outside the control of this code.
*/
const blobByBlobId = new Map<string, PolyfillBlobClass>();
let blobCounter = 0;

class PolyfillFileReader extends EventTarget {
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

class PolyfillBlobClass {
  public size: number;
  public type: string;

  // Not part of the standard blob interface - used to allow easy access
  public buffer: Uint8Array;
  // Not part of the standard blob interface - used to allow easy access
  public blobId: string;

  constructor(parts: Array<BinaryLike>, options: { type: string }) {
    this.blobId = "blob" + blobCounter++;

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
    blobByBlobId.set(this.blobId, this);
  }

  public arrayBuffer() {
    const uint8Array = this.buffer;
    const arrayBuffer = new ArrayBuffer(uint8Array!.byteLength);
    new Uint8Array(arrayBuffer).set(uint8Array!);
    return Promise.resolve(arrayBuffer);
  }
}

class PolyfillImageDataClass extends ImageData {
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

class PolyfillURLClass {
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

/*
   createElementNS is called to create an img element. The caller flow is to set the `src` attribute of the element
   by setting the property and then listening for the `load` event.

   The `src` attribute is set to a blob URL which needs to be loaded into an image.

   The `load` event listener is then triggered.
  */
function createElementNS(namespace: string, elementName: string) {
  if (elementName !== "img") {
    throw new Error("createElementNS polyfill only supports img");
  }

  let loadCallback: () => void;
  let errorCallback: () => void;

  const elementShim = {
    image: undefined as Image | undefined,
    addEventListener: (event: string, listener: () => void) => {
      if (event === "load") {
        loadCallback = listener;
      } else if (event === "error") {
        errorCallback = listener;
      } else {
        throw new Error("");
      }
    },
    removeEventListener: (event: string, listener: () => void) => {
      // Ignore
    },
  };

  function setSrc(src: string) {
    if (!src.startsWith("blob://")) {
      throw new Error("Only blob URLs are supported by the polyfill");
    }
    const blobId = src.slice("blob://".length);
    const blob = blobByBlobId.get(blobId);
    if (!blob) {
      throw new Error("Blob not found");
    }
    const buffer = blob.buffer;
    const image = loadImage(Buffer.from(buffer));
    image.then((loadedImage) => {
      elementShim.image = loadedImage;
      loadCallback.call(loadedImage);
    });
  }

  // return a proxy that listens for the set of the "src" property
  return new Proxy(elementShim, {
    set: (target: any, property: string, value: string) => {
      if (property === "src") {
        setSrc(value);
      } else if (property === "crossOrigin") {
        // ignore
      } else {
        throw new Error("Only src and crossOrigin is supported by the polyfill");
      }
      return true;
    },
    get: (target: any, property: string) => {
      return target[property];
    },
  });
}

// createElement is called to create a canvas element to draw textures to. This polyfill uses the "canvas" package.
function createElement(elementName: string) {
  if (elementName !== "canvas") {
    throw new Error("createElement polyfill only supports canvas");
  }

  const canvas = new Canvas(1, 1);
  /*
   Overriding `data` to `undefined` is necessary to avoid the THREE GLTFExporter misinterpreting the canvas as a
   THREE.DataTexture because it has a truthy data property.
  */
  (canvas as any).data = undefined;

  (canvas as any).convertToBlob = async (options?: { type: string; quality?: number }) => {
    const type = options?.type || "image/png";
    const asPngBuffer = canvas.toBuffer("image/png");

    if (type === "image/jpeg" || type === "image/jpg") {
      /*
       If the requested type is jpeg, convert the image from png to jpeg using Jimp (avoids encoding quality issues
       with canvas)
      */
      return new Promise((resolve, reject) => {
        Jimp.read(asPngBuffer, async (err, image) => {
          if (err) {
            return reject(err);
          }
          const jpegBuffer = await image.getBufferAsync(Jimp.MIME_JPEG);
          const blob = new PolyfillBlobClass([new Uint8Array(jpegBuffer)], {
            type: type,
          });
          resolve(blob);
        });
      });
    }

    const blob = new PolyfillBlobClass([new Uint8Array(asPngBuffer)], {
      type: type,
    });
    return Promise.resolve(blob);
  };
  return canvas;
}

// Set the polyfills on the global object to make them available to the libraries that are expecting to run in a browser
const globalAsAny = global as any;
globalAsAny.document = {
  createElementNS,
  createElement,
};
globalAsAny.FileReader = PolyfillFileReader;
globalAsAny.Blob = PolyfillBlobClass;
globalAsAny.ImageData = PolyfillImageDataClass;
globalAsAny.URL = PolyfillURLClass;
globalAsAny.window = global;
globalAsAny.self = global;
