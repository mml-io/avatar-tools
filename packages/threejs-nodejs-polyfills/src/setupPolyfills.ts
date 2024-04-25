import { Canvas, Image, loadImage } from "@napi-rs/canvas";
import Jimp from "jimp";

import { PolyfillBlobClass } from "./PolyfillBlobClass";
import { PolyfillFileReader } from "./PolyfillFileReader";
import { PolyfillImageDataClass } from "./PolyfillImageDataClass";
import { PolyfillURLClass } from "./PolyfillURLClass";

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
    const blob = PolyfillBlobClass.blobByBlobId.get(blobId);
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
export function setupPolyfills(globalAsAny: any) {
  globalAsAny.document = {
    createElementNS,
    createElement,
  };
  globalAsAny.HTMLImageElement = Image;
  globalAsAny.HTMLCanvasElement = Canvas;
  globalAsAny.FileReader = PolyfillFileReader;
  globalAsAny.Blob = PolyfillBlobClass;
  globalAsAny.ImageData = PolyfillImageDataClass;
  globalAsAny.URL = PolyfillURLClass;
  globalAsAny.window = globalAsAny;
  globalAsAny.self = globalAsAny;
}
