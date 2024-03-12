import * as THREE from "three";
import { Group } from "three";

import { convertLambertToStandard } from "./materials/lambertToStandard";
import { convertPhongToStandard } from "./materials/phongToStandard";
import { Step } from "./types";

function fixMaterial(material: THREE.Material): [string, THREE.Material] | null {
  if (material instanceof THREE.MeshLambertMaterial) {
    return [
      "Replacing incompatible MeshLambertMaterial with MeshStandardMaterial",
      convertLambertToStandard(material),
    ];
  } else if (material instanceof THREE.MeshPhongMaterial) {
    return [
      "Replacing incompatible MeshPhongMaterial with MeshStandardMaterial",
      convertPhongToStandard(material),
    ];
  } else if (material instanceof THREE.MeshPhysicalMaterial) {
    if (material.clearcoat) {
      const cloned = material.clone();
      cloned.clearcoat = 0;
      return ["Removed clearcoat from MeshPhysicalMaterial", cloned];
    }
    return null;
  }
  return null;
}

export const replaceIncompatibleMaterialsCorrectionStep: Step = {
  name: "replaceIncompatibleMaterials",
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
          message: "No incompatible materials detected.",
        },
      };
    }

    return {
      didApply: true,
      topLevelMessage: {
        level: "info",
        message: "Detected incompatible materials or material properties.",
      },
      logs: logs.map((message) => ({
        level: "warn",
        message,
      })),
    };
  },
};
