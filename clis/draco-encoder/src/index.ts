#!/usr/bin/env node
"use strict";

import fs from "fs";
import process from "process";

import { WebIO } from "@gltf-transform/core";
import {
  EXTMeshGPUInstancing,
  EXTMeshoptCompression,
  KHRONOS_EXTENSIONS,
} from "@gltf-transform/extensions";
import { quantize, reorder } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";
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
    await MeshoptEncoder.ready;

    try {
      const io = new WebIO();

      io.registerExtensions(KHRONOS_EXTENSIONS);
      io.registerExtensions([EXTMeshGPUInstancing]); // read instanced meshes
      io.registerExtensions([EXTMeshoptCompression]);
      io.registerDependencies({
        "meshopt.encoder": MeshoptEncoder,
        "meshopt.decoder": MeshoptDecoder,
      });

      const doc = await io.readBinary(new Uint8Array(fileBuffer.buffer)); // read GLB from ArrayBuffer

      await doc.transform(reorder({ encoder: MeshoptEncoder }), quantize());

      doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({
        method: EXTMeshoptCompression.EncoderMethod.QUANTIZE,
      });

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
