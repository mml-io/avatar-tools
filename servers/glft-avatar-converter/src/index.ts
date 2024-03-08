import process from "process";

import express from "express";
// @ts-ignore
import { correctionSteps, ModelLoader } from "gltf-avatar-export-lib";
import { LoadingManager } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { TGALoader } from "three/examples/jsm/loaders/TGALoader.js";

import { FileReader } from "./FileReaderPolyfill";

const port = process.env.PORT || 8084;

const app = express();
app.enable("trust proxy");

// Define global document for FBX Loader
(global as any).document = {
  createElementNS: (elementName: string) => {
    console.log("createElementNS was called", elementName);
    const listeners = new Map<string, () => void>();
    return {
      addEventListener: (eventName: string, callback: () => void) => {
        console.log("addEventListener", eventName);
        return {};
      },
    };
  },
  createElement: (elementName: string) => {
    console.log("createElement was called", elementName);
    const listeners = new Map<string, () => void>();
    return {
      getContext: () => {
        console.log("getContext was called");
        return {
          drawImage: () => {
            console.log("drawImage was called");
          },
          translate: () => {
            console.log("translate was called");
          },
          scale: () => {
            console.log("scale was called");
          },
          putImageData: () => {
            console.log("putImageData was called");
          },
        };
      },
      toBlob: (resolve: (blob: Blob) => void) => {
        console.log("toBlob was called");
        const blob = new Blob([], {});
        resolve(blob);
      },
    };
  },
};

(global as any).FileReader = FileReader;

class OverriddenImageData {
  public data: Uint8ClampedArray;

  constructor(width: number, height: number) {
    console.log("OverriddenImageData", width, height);
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}
(global as any).ImageData = OverriddenImageData;

class OverriddenURLClass {
  constructor(urlString: string) {
    console.log("OverriddenURLClass", urlString);
  }

  static createObjectURL(blob: Blob) {
    console.log("createObjectURL", blob);
    return "blob://" + blob.arrayBuffer();
  }
}

// Define URL for FBX Loader
(global as any).URL = OverriddenURLClass;

(global as any).window = global;

app.post("/v1/convert", async (req, res) => {
  const chunks: Array<Buffer> = [];
  req.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });
  req.on("end", () => {
    const fileBuffer = Buffer.concat(chunks);

    (async () => {
      try {
        const asArrayBuffer = fileBuffer.buffer.slice(0);
        const modelLoader = new ModelLoader();
        const importViewLoadingManager = new LoadingManager();
        importViewLoadingManager.addHandler(/\.tga$/i, new TGALoader(importViewLoadingManager));
        const { group } = await modelLoader.loadFromBuffer(
          asArrayBuffer,
          "",
          importViewLoadingManager,
        );

        for (const step of correctionSteps) {
          const stepResult = step.action(group);
          // console.log("stepResult", "didApply:", stepResult.didApply, "logs:", stepResult.logs);
        }

        new GLTFExporter().parse(
          group,
          async (gltf) => {
            console.log("Did export", gltf.byteLength);
            res.send(Buffer.from(gltf as ArrayBuffer));
            res.end();
          },
          (err) => {
            console.error("gltf error", err);
          },
          {
            binary: true,
          },
        );
      } catch (e) {
        console.error(e);
        res.status(500).end(e.toString());
      }
    })();
  });
});

console.log(`Listening on http://localhost:${port}/`);
app.listen(port);
