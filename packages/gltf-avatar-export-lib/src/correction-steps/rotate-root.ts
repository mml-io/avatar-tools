import * as THREE from "three";
import { Group } from "three";

import { StepResult } from "./types";

function isNear(a: number, b: number, epsilon = 0.1) {
  return Math.abs(a - b) < epsilon;
}

const HalfPi = Math.PI / 2;

export const rotateRootCorrectionStep = {
  name: "rotate-root",
  action: (group: Group): StepResult => {
    const rootBone = group.getObjectByName("root") as THREE.Bone;
    if (!rootBone) {
      return {
        didApply: false,
        topLevelMessage: {
          level: "error",
          message: "Could not find root bone. Cannot rotate root.",
        },
      };
    }

    if (
      isNear(rootBone.rotation.x, 0) &&
      isNear(rootBone.rotation.y, 0) &&
      isNear(rootBone.rotation.z, 0)
    ) {
      return {
        didApply: false,
        topLevelMessage: {
          level: "info",
          message: "Detected root was at zero rotation. No correction needed.",
        },
      };
    }

    if (
      isNear(rootBone.rotation.x, -HalfPi) &&
      isNear(rootBone.rotation.y, 0) &&
      isNear(rootBone.rotation.z, 0)
    ) {
      // Root bone has a rotation - rotate it to 0,0,0
      rootBone.rotation.x = 0;
      rootBone.rotation.y = 0;
      rootBone.rotation.z = 0;
      rootBone.updateMatrixWorld(true);

      for (const child of rootBone.children) {
        const asBone = child as THREE.Bone;
        if (asBone.isBone) {
          const tempPosY = asBone.position.y;
          asBone.position.y = asBone.position.z;
          asBone.position.z = -tempPosY;

          const [x, y, z, w] = asBone.quaternion.toArray();
          asBone.quaternion.set(x, -y, -z, w);
          asBone.updateMatrixWorld(true);
        }
      }
      return {
        didApply: true,
        topLevelMessage: {
          level: "info",
          message:
            "Detected root was not at expected rotation. Rotated root and translated immediate children to correct.",
        },
      };
    } else {
      return {
        didApply: false,
        topLevelMessage: {
          level: "error",
          message: "Detected root was at unrecognized rotation.",
        },
      };
    }
  },
} as const;
