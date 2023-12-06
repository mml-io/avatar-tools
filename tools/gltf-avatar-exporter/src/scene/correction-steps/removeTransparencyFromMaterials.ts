import * as THREE from "three";
import { Group } from "three";

import { Step } from "./types";

function fixMaterial(material: THREE.Material): [string, THREE.Material] | null {
  if (
    material instanceof THREE.MeshLambertMaterial ||
    material instanceof THREE.MeshStandardMaterial ||
    material instanceof THREE.MeshPhysicalMaterial
  ) {
    if (material.transparent) {
      const cloned = material.clone();
      cloned.transparent = false;
      return ["Disabled transparency", cloned];
    }
  }
  return null;
}

export const removeTransparencyFromMaterialsCorrectionStep: Step = {
  name: "removeTransparencyFromMaterials",
  action: (group: Group) => {
    const logs: Array<string> = [];

    group.traverse((child) => {
      const asMesh = child as THREE.Mesh;
      if (asMesh.isMesh) {
        const originalMaterial = asMesh.material;
        if (!originalMaterial) {
          return;
        }
        if (Array.isArray(originalMaterial)) {
          asMesh.material = originalMaterial.map((innerMaterial) => {
            const fixResult = fixMaterial(innerMaterial);
            if (fixResult) {
              const [message, fixedMaterial] = fixResult;
              logs.push(`${asMesh.name} - ${innerMaterial.name} - ${message}`);
              return fixedMaterial;
            }
            return innerMaterial;
          });
        } else {
          const fixResult = fixMaterial(originalMaterial);
          if (fixResult) {
            const [message, fixedMaterial] = fixResult;
            logs.push(`${asMesh.name} - ${originalMaterial.name} - ${message}`);
            asMesh.material = fixedMaterial;
          }
        }
      }
    });

    if (logs.length === 0) {
      return {
        didApply: false,
        topLevelMessage: {
          level: "info",
          message: "No materials with transparency detected.",
        },
      };
    }

    return {
      didApply: true,
      topLevelMessage: {
        level: "info",
        message: "Detected materials with transparency.",
      },
      logs: logs.map((message) => ({
        level: "warn",
        message,
      })),
    };
  },
};
