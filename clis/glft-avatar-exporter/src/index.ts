import fs from "fs";
import process from "process";

import { ModelLoader } from "@mml-io/model-loader";
import { correctionSteps, correctionStepNames } from "gltf-avatar-export-lib";
import { LoadingManager } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { TGALoader } from "three/examples/jsm/loaders/TGALoader.js";
import { setupPolyfills } from "threejs-nodejs-polyfills";
import { Options } from "yargs";
import yargs from "yargs/yargs";

// A lot of classes used for texture loading and saving must be polyfilled as they are not present in Node
setupPolyfills(global);

function stepNameToSkipArgName(stepName: string): string {
  return `skip-${stepName}`;
}

const optionsForCorrectionSteps = correctionStepNames.reduce<{ [key: string]: Options }>(
  (acc, stepName) => {
    acc[stepNameToSkipArgName(stepName)] = {
      type: "boolean",
      default: false,
      describe: `Skip the ${stepName} step`,
    };
    return acc;
  },
  {},
);

const argv = yargs(process.argv)
  // @ts-expect-error - strictOptions is not in the types
  .strictOptions()
  .options({
    input: { type: "string", alias: "i", demandOption: true },
    output: { type: "string", alias: "o", demandOption: true },
    ...optionsForCorrectionSteps,
  })
  .usage("Usage: $0 -i [input file] -o [output file]").argv;

fs.readFile(argv.input, function (readFileErr, fileBuffer) {
  if (readFileErr) {
    console.error("Could not open file: %s", readFileErr);
    process.exit(1);
  }

  (async () => {
    try {
      const asArrayBuffer = fileBuffer.buffer.slice(0);

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

      const modelLoader = new ModelLoader(loadingManager);
      const { group } = await modelLoader.loadFromBuffer(asArrayBuffer, "");

      // Only wait for loading if there are assets to load
      if (hasAssetsToLoad) {
        // Wait for all resources to load - including (embedded) texture blobs
        await didLoad;
      }

      for (const step of correctionSteps) {
        if (argv[stepNameToSkipArgName(step.name)]) {
          continue;
        }
        step.action(group);
      }

      new GLTFExporter().parse(
        group,
        async (gltf) => {
          // process data
          const buff = Buffer.from(gltf as ArrayBuffer);
          fs.writeFile(argv.output, buff, (writeFileErr) => {
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
