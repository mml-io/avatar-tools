#!/usr/bin/env node
"use strict";

import fs from "fs";
import process from "process";

import { ModelLoader } from "@mml-io/model-loader";
import { Bone, Group, LoadingManager, Object3D, Skeleton, SkinnedMesh } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { TGALoader } from "three/examples/jsm/loaders/TGALoader.js";
import { setupPolyfills } from "threejs-nodejs-polyfills";
import yargs from "yargs/yargs";

// A lot of classes used for texture loading and saving must be polyfilled as they are not present in Node
setupPolyfills(global);

const argv = yargs(process.argv)
  // @ts-expect-error - strictOptions is not in the types
  .strictOptions()
  .options({
    input: { type: "string", alias: "i", demandOption: true },
    output: { type: "string", alias: "o", demandOption: true },
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
      const { group, animations } = await modelLoader.loadFromBuffer(asArrayBuffer, "");

      // Only wait for loading if there are assets to load
      if (hasAssetsToLoad) {
        // Wait for all resources to load - including (embedded) texture blobs
        await didLoad;
      }

      const outputGroup = new Group();

      // Find the root bones in the file (without querying by name)
      const rootBones: Array<Bone> = [];
      function findRootBones(child: Object3D) {
        const asBone = child as Bone;
        if (asBone.isBone) {
          rootBones.push(asBone);
        } else {
          child.children.forEach(findRootBones);
        }
      }
      findRootBones(group);

      /*
       For each root bone create a skeleton containing all of the bones and a
       skinned mesh that uses that skeleton. This is necessary for the
       GLTFExporter to recognize the bone objects as bones.
      */
      for (const rootBone of rootBones) {
        const allBones: Array<Bone> = [];
        rootBone.traverse((child) => {
          const asBone = child as Bone;
          if (asBone.isBone) {
            allBones.push(asBone);
          }
        });

        const emptySkinnedMesh = new SkinnedMesh();
        const skeleton = new Skeleton([rootBone, ...allBones]);
        emptySkinnedMesh.bind(skeleton);
        outputGroup.add(rootBone);
        outputGroup.add(emptySkinnedMesh);
      }

      new GLTFExporter().parse(
        outputGroup,
        async (gltf) => {
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
          animations,
          binary: true,
        },
      );
    } catch (e) {
      console.error(e);
    }
  })();
});
