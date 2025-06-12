#!/usr/bin/env node
"use strict";

import fs from "fs";
import process from "process";

import { Document, WebIO, Logger, AnimationSampler, PropertyType } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { dedup, prune, resample, weld, createTransform } from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import { MeshoptDecoder } from "meshoptimizer";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

interface Arguments {
  input: string;
  output: string;
  tolerance: number;
  maxError: number;
}

const args = yargs(hideBin(process.argv))
  .options({
    input: { type: "string", alias: "i", demandOption: true },
    output: { type: "string", alias: "o", demandOption: true },
    tolerance: {
      type: "number",
      alias: "t",
      default: 0.001,
      description: "Tolerance for animation keyframe simplification",
    },
    maxError: {
      type: "number",
      alias: "e",
      default: 0.0001,
      description: "Maximum error allowed for animation optimization",
    },
  })
  .usage("Usage: $0 -i [input file] -o [output file] [-t tolerance] [-e maxError]")
  .parseSync() as Arguments;

/**
 * Simple keyframe reduction algorithm to remove redundant keyframes
 * Keeps keyframes that change more than the given tolerance
 */
function reduceKeyframes(
  times: Float32Array,
  values: Float32Array,
  components: number,
  tolerance: number,
): [Float32Array, Float32Array] {
  if (times.length <= 2) return [times, values]; // Keep if only 2 or fewer keyframes

  const keepIndices: number[] = [0]; // Always keep first keyframe

  let lastKeptIndex = 0;

  for (let i = 1; i < times.length - 1; i++) {
    let significant = false;

    // Check if this keyframe differs significantly from the last kept keyframe
    for (let c = 0; c < components; c++) {
      const currentValue = values[i * components + c];
      const lastKeptValue = values[lastKeptIndex * components + c];

      if (Math.abs(currentValue - lastKeptValue) > tolerance) {
        significant = true;
        break;
      }
    }

    if (significant) {
      keepIndices.push(i);
      lastKeptIndex = i;
    }
  }

  // Always keep last keyframe
  if (lastKeptIndex !== times.length - 1) {
    keepIndices.push(times.length - 1);
  }

  // If we're not reducing, return original
  if (keepIndices.length === times.length) {
    return [times, values];
  }

  // Create new arrays with only the kept keyframes
  const newTimes = new Float32Array(keepIndices.length);
  const newValues = new Float32Array(keepIndices.length * components);

  for (let i = 0; i < keepIndices.length; i++) {
    const originalIndex = keepIndices[i];
    newTimes[i] = times[originalIndex];

    for (let c = 0; c < components; c++) {
      newValues[i * components + c] = values[originalIndex * components + c];
    }
  }

  return [newTimes, newValues];
}

/**
 * Gets the component count for an animation based on its path
 */
function getComponentCount(path: string): number {
  switch (path) {
    case "rotation":
      return 4; // Quaternion
    case "translation":
    case "scale":
      return 3; // Vector3
    case "weights":
      return 1; // Scalar per weight
    default:
      return 1; // Unknown, assume scalar
  }
}

fs.readFile(args.input, function (readFileErr, fileBuffer) {
  if (readFileErr) {
    console.error("Could not open file: %s", readFileErr);
    process.exit(1);
  }

  (async () => {
    try {
      const logger = new Logger(Logger.Verbosity.INFO);
      // @ts-expect-error - WebIO constructor accepts logger
      const io = new WebIO({ logger });

      // For reading, we need to register the meshopt decoder for input files that use it
      io.registerExtensions(ALL_EXTENSIONS)
        .registerExtensions([EXTMeshoptCompression])
        .registerDependencies({
          "draco3d.decoder": await draco3d.createDecoderModule(),
          "draco3d.encoder": await draco3d.createEncoderModule(),
          "meshopt.decoder": MeshoptDecoder,
        });

      // Read the GLTF file from the buffer
      const doc = await io.readBinary(new Uint8Array(fileBuffer.buffer));

      // Get animation details before processing
      const animationsBefore = doc.getRoot().listAnimations();
      console.log(`Found ${animationsBefore.length} animation(s) in the file`);

      let totalKeyframesBefore = 0;
      for (const anim of animationsBefore) {
        const samplers = anim.listSamplers();
        let keyframeCount = 0;

        samplers.forEach((sampler) => {
          const input = sampler.getInput();
          if (input && input.getArray()) {
            keyframeCount += input.getArray()!.length;
          }
        });

        totalKeyframesBefore += keyframeCount;
        const numChannels = anim.listChannels().length;
        console.log(
          `Animation "${anim.getName() || "Unnamed"}": ${samplers.length} samplers, ${numChannels} channels, ${keyframeCount} total keyframes`,
        );
      }

      // Create a custom transform to optimize animations
      const optimizeAnimations = createTransform("optimizeAnimations", (document: Document) => {
        const animations = document.getRoot().listAnimations();

        for (const animation of animations) {
          const channels = animation.listChannels();

          for (const channel of channels) {
            const sampler = channel.getSampler();
            if (!sampler) continue;

            const input = sampler.getInput();
            const output = sampler.getOutput();

            if (!input || !output) continue;

            // Get original times and values
            const times = input.getArray() as Float32Array;
            const values = output.getArray() as Float32Array;

            if (!times || !values) continue;

            // Get the path to determine component count
            const path = channel.getTargetPath();
            if (!path) continue;

            const components = getComponentCount(path);

            // If we have multiple keyframes, try to reduce them
            if (times.length > 2) {
              console.log(
                `Optimizing ${path} animation: ${times.length} keyframes, ${components} components`,
              );

              // Reduce keyframes based on our algorithm
              const [newTimes, newValues] = reduceKeyframes(
                times,
                values,
                components,
                args.maxError,
              );

              if (newTimes.length < times.length) {
                // Update the accessor data
                input.setArray(newTimes);
                output.setArray(newValues);

                console.log(`  Reduced from ${times.length} to ${newTimes.length} keyframes`);
              } else {
                console.log(`  No reduction needed for this channel`);
              }
            }
          }
        }
        return document;
      });

      // Process the document to clean animations
      await doc.transform(
        // Weld vertices that are very close together
        weld({ tolerance: 0.0001 }),

        // Losslessly resample animation frames
        resample({ tolerance: args.tolerance }),

        // Custom animation optimization to reduce redundant keyframes
        optimizeAnimations,

        // Remove unused nodes, textures, or other data
        prune(),

        // Remove duplicate vertex or texture data
        dedup(),
      );

      // Get animation details after processing
      const animationsAfter = doc.getRoot().listAnimations();
      console.log(`\nAfter processing: ${animationsAfter.length} animation(s) in the file`);

      let totalKeyframesAfter = 0;
      for (const anim of animationsAfter) {
        const samplers = anim.listSamplers();
        let keyframeCount = 0;

        samplers.forEach((sampler) => {
          const input = sampler.getInput();
          if (input && input.getArray()) {
            keyframeCount += input.getArray()!.length;
          }
        });

        totalKeyframesAfter += keyframeCount;
        const numChannels = anim.listChannels().length;
        console.log(
          `Animation "${anim.getName() || "Unnamed"}": ${samplers.length} samplers, ${numChannels} channels, ${keyframeCount} total keyframes`,
        );
      }

      const reductionPercent = (
        ((totalKeyframesBefore - totalKeyframesAfter) / totalKeyframesBefore) *
        100
      ).toFixed(2);
      console.log(
        `\nTotal keyframe reduction: ${totalKeyframesBefore} → ${totalKeyframesAfter} (${reductionPercent}%)`,
      );

      // Create a new IO instance without meshopt for writing
      // @ts-expect-error - WebIO constructor accepts logger
      const writeIo = new WebIO({ logger });

      // Only include extensions that are not meshopt
      writeIo
        .registerExtensions(ALL_EXTENSIONS.filter((ext) => ext !== EXTMeshoptCompression))
        .registerDependencies({
          "draco3d.decoder": await draco3d.createDecoderModule(),
          "draco3d.encoder": await draco3d.createEncoderModule(),
        });

      // Write the processed document back to a binary GLB
      const processedArrayBuffer = await writeIo.writeBinary(doc);

      fs.writeFile(args.output, Buffer.from(processedArrayBuffer), (writeFileErr) => {
        if (writeFileErr) {
          console.error("Error writing file", writeFileErr);
          process.exit(1);
        } else {
          console.log(`\nFile saved to ${args.output}`);
        }
      });
    } catch (e) {
      console.error(e);
    }
  })();
});
