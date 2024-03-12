import fs from "fs";
import process from "process";

import { correctionSteps, ModelLoader } from "gltf-avatar-export-lib";
import { LoadingManager } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { TGALoader } from "three/examples/jsm/loaders/TGALoader.js";
import yargs from "yargs/yargs";

// A lot of classes used for texture loading and saving must be polyfilled as they are not present in Node
import "./setupPolyfills";

const argv = yargs(process.argv)
  .options({
    i: { type: "string", demandOption: true },
    o: { type: "string", demandOption: true },
  })
  .usage("Usage: $0 -i [input file] -o [output file]").argv;

fs.readFile(argv.i, function (readFileErr, fileBuffer) {
  if (readFileErr) {
    console.error("Could not open file: %s", readFileErr);
    process.exit(1);
  }

  (async () => {
    try {
      const asArrayBuffer = fileBuffer.buffer.slice(0);

      const modelLoader = new ModelLoader();
      const loadingManager = new LoadingManager();
      loadingManager.addHandler(/\.tga$/i, new TGALoader(loadingManager));
      let hasAssetsToLoad = false;
      loadingManager.onStart = () => {
        hasAssetsToLoad = true;
      };
      const didLoad = new Promise<void>((resolve) => {
        loadingManager.onLoad = () => {
          resolve();
        };
      });

      const { group } = await modelLoader.loadFromBuffer(asArrayBuffer, "", loadingManager);

      // Only wait for loading if there are assets to load
      if (hasAssetsToLoad) {
        // Wait for all resources to load - including (embedded) texture blobs
        await didLoad;
      }

      for (const step of correctionSteps) {
        step.action(group);
      }

      new GLTFExporter().parse(
        group,
        async (gltf) => {
          // process data
          const buff = Buffer.from(gltf as ArrayBuffer);
          const base64data = buff.toString("base64");

          fs.writeFile(argv.o, base64data, "base64", (writeFileErr) => {
            if (writeFileErr) {
              console.error("Error writing file", writeFileErr);
              process.exit(1);
            } else {
              console.log(`File saved to ${argv.o}`);
            }
          });
        },
        (gltfError) => {
          console.error("gltf export error", gltfError);
          process.exit(1);
        },
        {
          binary: true,
        },
      );
    } catch (e) {
      console.error(e);
    }
  })();
});
