#!/usr/bin/env node
"use strict";

import fs from "fs";
import process from "process";

import { WebIO } from "@gltf-transform/core";

import {
  ALL_EXTENSIONS,
  EXTMeshGPUInstancing,
  EXTMeshoptCompression,
  KHRONOS_EXTENSIONS,
} from "@gltf-transform/extensions";
import {
  dedup,
  draco,
  prune,
  quantize,
  reorder,
  resample,
  textureCompress,
  simplify,
  weld,
} from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } from "meshoptimizer";
import sharp from "sharp";
import yargs from "yargs/yargs";

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
      const io = new WebIO();
      io.registerExtensions(ALL_EXTENSIONS).registerDependencies({
        "draco3d.decoder": await draco3d.createDecoderModule(), // Optional.
        "draco3d.encoder": await draco3d.createEncoderModule(), // Optional.
      });
      io.registerExtensions([EXTMeshGPUInstancing]); // read instanced meshes
      // io.registerExtensions([EXTMeshoptCompression]);
      // io.registerDependencies({
      //   "meshopt.encoder": MeshoptEncoder,
      //   "meshopt.decoder": MeshoptDecoder,
      // });

      const doc = await io.readBinary(new Uint8Array(fileBuffer.buffer)); // read GLB from ArrayBuffer

      // doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({
      //   method: EXTMeshoptCompression.EncoderMethod.QUANTIZE,
      // });

      await doc.transform(
        weld({ tolerance: 0.0001 }),
        simplify({ simplifier: MeshoptSimplifier, ratio: 0.1, error: 0.001 }),
        // Losslessly resample animation frames.
        resample(),
        // Remove unused nodes, textures, or other data.
        prune(),
        // Remove duplicate vertex or texture data, if any.
        dedup(),
        // Convert textures to WebP (Requires glTF Transform v3 and Node.js).
        textureCompress({
          encoder: sharp,
          targetFormat: "webp",
          resize: [1024, 2024],
        }),
        // // Custom transform.
        // reorder({ encoder: MeshoptEncoder }),
        // quantize(),
        // Compress mesh geometry with Draco.
        // draco(),
      );

      const compressedArrayBuffer = await io.writeBinary(doc);

      fs.writeFile(argv.output, compressedArrayBuffer, "base64", (writeFileErr) => {
        if (writeFileErr) {
          console.error("Error writing file", writeFileErr);
          process.exit(1);
        } else {
          console.log(`File saved to ${argv.o}`);
        }
      });
    } catch (e) {
      console.error(e);
    }
  })();
});
