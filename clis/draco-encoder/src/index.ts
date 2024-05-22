#!/usr/bin/env node
"use strict";

import fs from "fs";
import process from "process";

import { WebIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { draco } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
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

      const doc = await io.readBinary(new Uint8Array(fileBuffer.buffer)); // read GLB from ArrayBuffer

      await doc.transform(draco());

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
