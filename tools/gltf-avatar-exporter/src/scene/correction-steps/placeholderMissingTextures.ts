import * as THREE from "three";
import { Group, Texture } from "three";

import { Step } from "./types";

function fixMap(texture: Texture, setDefaultColorIfMissing: boolean = false): Texture | null {
  if (!texture.image) {
    // Replace with a placeholder texture (all white)
    const placeholderTexture = new THREE.Texture();
    placeholderTexture.image = new ImageData(1, 1);
    // Set the pixel to a purple color so that it's easy to spot
    if (setDefaultColorIfMissing) {
      placeholderTexture.image.data[0] = 255;
      placeholderTexture.image.data[1] = 0;
      placeholderTexture.image.data[2] = 255;
      placeholderTexture.image.data[3] = 255;
    }
    placeholderTexture.needsUpdate = true;
    return placeholderTexture;
  }
  return null;
}

const lambertMaterialTextureKeys: Array<
  | "bumpMap"
  | "displacementMap"
  | "emissiveMap"
  | "map"
  | "lightMap"
  | "normalMap"
  | "aoMap"
  | "specularMap"
  | "alphaMap"
  | "envMap"
> = [
  "bumpMap",
  "displacementMap",
  "emissiveMap",
  "map",
  "lightMap",
  "normalMap",
  "aoMap",
  "specularMap",
  "alphaMap",
  "envMap",
];

const standardMaterialTextureKeys: Array<
  | "map"
  | "lightMap"
  | "aoMap"
  | "emissiveMap"
  | "bumpMap"
  | "normalMap"
  | "displacementMap"
  | "roughnessMap"
  | "metalnessMap"
  | "alphaMap"
  | "envMap"
> = [
  "map",
  "lightMap",
  "aoMap",
  "emissiveMap",
  "bumpMap",
  "normalMap",
  "displacementMap",
  "roughnessMap",
  "metalnessMap",
  "alphaMap",
  "envMap",
];

const physicalMaterialTextureKeys: Array<
  | "clearcoatMap"
  | "clearcoatRoughnessMap"
  | "clearcoatNormalMap"
  | "sheenColorMap"
  | "sheenRoughnessMap"
  | "transmissionMap"
  | "thicknessMap"
  | "specularIntensityMap"
  | "specularColorMap"
  | "iridescenceMap"
  | "iridescenceThicknessMap"
  | "anisotropyMap"
  | "map"
  | "lightMap"
  | "aoMap"
  | "emissiveMap"
  | "bumpMap"
  | "normalMap"
  | "displacementMap"
  | "roughnessMap"
  | "metalnessMap"
  | "alphaMap"
  | "envMap"
> = [
  "clearcoatMap",
  "clearcoatRoughnessMap",
  "clearcoatNormalMap",
  "sheenColorMap",
  "sheenRoughnessMap",
  "transmissionMap",
  "thicknessMap",
  "specularIntensityMap",
  "specularColorMap",
  "iridescenceMap",
  "iridescenceThicknessMap",
  "anisotropyMap",
  "map",
  "lightMap",
  "aoMap",
  "emissiveMap",
  "bumpMap",
  "normalMap",
  "displacementMap",
  "roughnessMap",
  "metalnessMap",
  "alphaMap",
  "envMap",
];

const phongMaterialTextureKeys: Array<
  | "map"
  | "lightMap"
  | "aoMap"
  | "emissiveMap"
  | "bumpMap"
  | "normalMap"
  | "displacementMap"
  | "specularMap"
  | "alphaMap"
  | "envMap"
> = [
  "map",
  "lightMap",
  "aoMap",
  "emissiveMap",
  "bumpMap",
  "normalMap",
  "displacementMap",
  "specularMap",
  "alphaMap",
  "envMap",
];

function fixMaterial(material: THREE.Material): Array<string> {
  const missingTextures: Array<string> = [];
  // Identify missing textures (all textures should be embedded so the texture should already be loaded)
  if (material instanceof THREE.MeshLambertMaterial) {
    for (const key of lambertMaterialTextureKeys) {
      const texture = material[key];
      if (texture) {
        const fixedMap = fixMap(texture, key === "map");
        if (fixedMap) {
          material[key] = fixedMap;
          missingTextures.push(`${texture.name} (${key})`);
        }
      }
    }
  } else if (material instanceof THREE.MeshStandardMaterial) {
    for (const key of standardMaterialTextureKeys) {
      const texture = material[key];
      if (texture) {
        const fixedMap = fixMap(texture, key === "map");
        if (fixedMap) {
          material[key] = fixedMap;
          missingTextures.push(`${texture.name} (${key})`);
        }
      }
    }
  } else if (material instanceof THREE.MeshPhysicalMaterial) {
    for (const key of physicalMaterialTextureKeys) {
      const texture = material[key];
      if (texture) {
        const fixedMap = fixMap(texture);
        if (fixedMap) {
          material[key] = fixedMap;
          missingTextures.push(`${texture.name} (${key})`);
        }
      }
    }
  } else if (material instanceof THREE.MeshPhongMaterial) {
    for (const key of phongMaterialTextureKeys) {
      const texture = material[key];
      if (texture) {
        const fixedMap = fixMap(texture, key === "map");
        if (fixedMap) {
          material[key] = fixedMap;
          missingTextures.push(`${texture.name} (${key})`);
        }
      }
    }
  }
  return missingTextures;
}

export const placeholderMissingTexturesCorrectionStep: Step = {
  name: "placeholderMissingTextures",
  action: (group: Group) => {
    const missingTextureNames: Array<string> = [];

    group.traverse((child) => {
      const asSkinnedMesh = child as THREE.SkinnedMesh;
      if (asSkinnedMesh.isSkinnedMesh) {
        const originalMaterial = asSkinnedMesh.material;
        if (Array.isArray(originalMaterial)) {
          originalMaterial.forEach((innerMaterial) => {
            const missingTextures = fixMaterial(innerMaterial);
            for (const missingTextureName of missingTextures) {
              missingTextureNames.push(
                `Missing texture for ${asSkinnedMesh.name} - ${innerMaterial.name} - ${missingTextureName}`,
              );
            }
          });
        } else {
          const missingTextures = fixMaterial(originalMaterial);
          for (const missingTextureName of missingTextures) {
            missingTextureNames.push(
              `Missing texture for ${asSkinnedMesh.name} - ${originalMaterial.name} - ${missingTextureName}`,
            );
          }
        }
      }
    });

    if (missingTextureNames.length === 0) {
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
      logs: missingTextureNames.map((name) => ({
        level: "error",
        message: name,
      })),
    };
  },
};
