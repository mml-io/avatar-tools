import * as THREE from "three";
import { Group } from "three";

import { reposeSkinnedMeshes } from "./reposeSkinnedMeshes";
import { LogMessage, Step } from "./types";

function isNear(a: number, b: number, epsilon = 0.1) {
  return Math.abs(a - b) < epsilon;
}

const HalfPi = Math.PI / 2;

// TODO - there are some cases where this doesn't work - and the added rotation potentially overcorrects.
export const rotatePelvisCorrectionStep: Step = {
  name: "rotatePelvis",
  action: (group: Group) => {
    const logs: LogMessage[] = [];

    const pelvisBone = group.getObjectByName("pelvis") as THREE.Bone;
    if (!pelvisBone) {
      return {
        didApply: false,
        topLevelMessage: {
          level: "error",
          message: "Could not find pelvis bone. Cannot rotate pelvis.",
        },
      };
    }

    const { x: pelvisX, y: pelvisY, z: pelvisZ } = pelvisBone.rotation;
    const targetX = 0;
    const targetY = 0;
    const targetZ = HalfPi;
    if (isNear(pelvisX, targetX) && isNear(pelvisY, targetY) && isNear(pelvisZ, targetZ)) {
      reposeSkinnedMeshes(group);
      return {
        didApply: false,
        topLevelMessage: {
          level: "info",
          message: "Detected pelvis was at expected rotation. No correction needed.",
        },
      };
    } else if (isNear(pelvisX, -HalfPi) && isNear(pelvisY, -HalfPi) && isNear(pelvisZ, 0)) {
      pelvisBone.rotation.x += HalfPi;
      pelvisBone.rotation.y += HalfPi;
      pelvisBone.rotation.z += HalfPi;
      logs.push({
        level: "info",
        message: `rotation was: (-PI/2, -PI/2, 0). Now is: (0, 0, PI/2).`,
      });
    } else if (isNear(pelvisX, 0) && isNear(pelvisY, HalfPi) && isNear(pelvisZ, 0)) {
      pelvisBone.rotation.x += 0;
      pelvisBone.rotation.y -= HalfPi;
      pelvisBone.rotation.z += HalfPi;
      logs.push({
        level: "info",
        message: `rotation was: (0, PI/2, 0). Now is: (0, 0, PI/2).`,
      });
    } else if (isNear(pelvisX, 0) && isNear(pelvisY, 0) && isNear(pelvisZ, 0)) {
      pelvisBone.rotation.x += 0;
      pelvisBone.rotation.y += 0;
      pelvisBone.rotation.z += HalfPi;
      logs.push({
        level: "info",
        message: `rotation was: (0, 0, 0). Now is: (0, 0, PI/2).`,
      });
    } else {
      reposeSkinnedMeshes(group);
      return {
        didApply: false,
        topLevelMessage: {
          level: "error",
          message: "Could not determine known pelvis transform. Cannot rotate pelvis.",
        },
      };
    }
    //test
    //pelvisBone.rotation.x = HalfPi;
    //pelvisBone.rotation.z = 0;
    //pelvisBone.rotation.y = 0;

    pelvisBone.updateMatrixWorld(true);

    function traverseAndTransposeBone(bone: THREE.Bone) {
      const tempPosY = bone.position.y;
      bone.position.y = bone.position.z;
      bone.position.z = -tempPosY;

      const [x, y, z, w] = bone.quaternion.toArray();
      bone.quaternion.set(-x, -z, y, -w);
      bone.updateMatrixWorld(true);

      for (const child of bone.children) {
        const asBone = child as THREE.Bone;
        if (asBone.isBone) {
          traverseAndTransposeBone(asBone);
        }
      }
    }
    for (const child of pelvisBone.children) {
      const asBone = child as THREE.Bone;
      if (asBone.isBone) {
        traverseAndTransposeBone(asBone);
      }
    }

    reposeSkinnedMeshes(group);

    logs.push({
      level: "info",
      message: "Rotated pelvis and all children and reposed meshes against new skeleton.",
    });

    return {
      didApply: true,
      logs: logs,
      topLevelMessage: {
        level: "info",
        message: "Detected pelvis was not at expected rotation (0, 0, PI/2)",
      },
    };
  },
};
