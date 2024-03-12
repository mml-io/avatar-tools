import * as THREE from "three";
import { Group, Texture } from "three";

import { forEachMapKey } from "./materials/forEachMapKey";
import { Step } from "./types";

function fixTexture(texture: Texture): Texture | null {
  if (
    texture.image &&
    typeof texture.image === "object" &&
    texture.flipY &&
    texture.image.data &&
    texture.image.data instanceof Uint8Array
  ) {
    const image = texture.image;
    const data = image.data;
    const newData = [];
    // Copy the data into a new array, but with rows reversed
    for (let i = 0; i < data.length; i += image.width * 4) {
      const row = data.slice(i, i + image.width * 4);
      newData.unshift(...row);
    }

    const clamped = new Uint8ClampedArray(newData);
    const imageSrc = new ImageData(clamped, image.width, image.height);
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext("2d");
    if (!context) {
      return null;
    }
    context.putImageData(imageSrc, 0, 0);
    const imageData = context.getImageData(0, 0, image.width, image.height);
    const sanitizedTexture = new THREE.Texture();
    sanitizedTexture.image = imageData;
    sanitizedTexture.needsUpdate = true;
    return sanitizedTexture;
  }
  return null;
}

function fixMaterial(material: THREE.Material): Array<string> {
  const flippedTextures: Array<string> = [];
  forEachMapKey(material, (key, texture) => {
    const fixedTexture = fixTexture(texture);
    if (fixedTexture) {
      flippedTextures.push(`${texture.name} (${key})`);
      (material as any)[key] = fixedTexture;
    }
  });
  return flippedTextures;
}

export const fixFlippedBitmapTexturesCorrectionStep: Step = {
  name: "fixFlippedBitmapTextures",
  action: (group: Group) => {
    const flippedTextureNames: Array<string> = [];

    group.traverse((child) => {
      const asSkinnedMesh = child as THREE.SkinnedMesh;
      if (asSkinnedMesh.isSkinnedMesh) {
        const originalMaterial = asSkinnedMesh.material;
        if (Array.isArray(originalMaterial)) {
          originalMaterial.forEach((innerMaterial) => {
            const flippedTextures = fixMaterial(innerMaterial);
            for (const flippedTextureName of flippedTextures) {
              flippedTextureNames.push(
                `Flipped texture for ${asSkinnedMesh.name} - ${innerMaterial.name} - ${flippedTextureName}`,
              );
            }
          });
        } else {
          const flippedTextures = fixMaterial(originalMaterial);
          for (const flippedTextureName of flippedTextures) {
            flippedTextureNames.push(
              `Flipped texture for ${asSkinnedMesh.name} - ${originalMaterial.name} - ${flippedTextureName}`,
            );
          }
        }
      }
    });

    if (flippedTextureNames.length === 0) {
      return {
        didApply: false,
        topLevelMessage: {
          level: "info",
          message: "No materials with missing textures found.",
        },
      };
    }

    return {
      didApply: true,
      topLevelMessage: {
        level: "info",
        message:
          "Detected at least one material with a missing texture. Replaced with placeholder(s).",
      },
      logs: flippedTextureNames.map((name) => ({
        level: "error",
        message: name,
      })),
    };
  },
};
