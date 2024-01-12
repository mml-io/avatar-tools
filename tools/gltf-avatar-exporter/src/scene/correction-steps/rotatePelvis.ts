import * as THREE from "three";
import { Group } from "three";

import { reposeSkinnedMeshes } from "./reposeSkinnedMeshes";
import { Step } from "./types";

function isNear(a: number, b: number, epsilon = 0.1) {
  return Math.abs(a - b) < epsilon;
}

const HalfPi = Math.PI / 2;

// TODO - there are some cases where this doesn't work - and the added rotation potentially overcorrects.
export const rotatePelvisCorrectionStep: Step = {
  name: "rotatePelvis",
  action: (group: Group) => {
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
    } else if (isNear(pelvisX, 0) && isNear(pelvisY, HalfPi) && isNear(pelvisZ, 0)) {
      pelvisBone.rotation.x += 0;
      pelvisBone.rotation.y -= HalfPi;
      pelvisBone.rotation.z += HalfPi;
    } else if (isNear(pelvisX, -HalfPi) && isNear(pelvisY, HalfPi) && isNear(pelvisZ, 0)) {
      pelvisBone.rotation.x += HalfPi;
      pelvisBone.rotation.y -= HalfPi;
      pelvisBone.rotation.z += HalfPi;
    } else if (isNear(pelvisX, 0) && isNear(pelvisY, 0) && isNear(pelvisZ, 0)) {
      pelvisBone.rotation.x += 0;
      pelvisBone.rotation.y += 0;
      pelvisBone.rotation.z += HalfPi;
    } else {
      reposeSkinnedMeshes(group);
      return {
        didApply: false,
        topLevelMessage: {
          level: "error",
          message: `Could not determine known pelvis transform (${pelvisX.toFixed(
            2,
          )}, ${pelvisY.toFixed(2)}, ${pelvisZ.toFixed(2)})
          }. Cannot rotate pelvis.`,
        },
      };
    }
    pelvisBone.updateMatrixWorld(true);

    function traverseAndTransposeBone(bone: THREE.Bone) {
      // POS
      // X IS DEFINITELY MINUS Y
      // const tempPosX = bone.position.x;
      // bone.position.x = bone.position.y;
      // bone.position.y = tempPosX;
      const [x, y, z, w] = bone.quaternion.toArray();

      const tempPosX = bone.position.x;
      const tempPosY = bone.position.y;
      const tempPosZ = bone.position.z;
      console.log("bone.name", bone.name, tempPosX, tempPosY, tempPosZ, x, y, z, w);
      if (bone.name === "thigh_l") {
        bone.position.x = -tempPosY;
        bone.position.y = -tempPosX;
        bone.quaternion.set(y, x, w, -z);
      }
      if (bone.name === "thigh_r") {
        bone.position.x = -tempPosY;
        bone.position.y = -tempPosX;
        bone.quaternion.set(y, z, x, -w);
      }

      if (bone.name === "calf_l") {
        bone.position.x = -tempPosY;
        bone.position.y = -tempPosX;
        bone.quaternion.set(-y, -x, z, -w);
      }
      if (bone.name === "calf_r") {
        bone.position.x = tempPosY;
        bone.position.y = tempPosX;
        bone.quaternion.set(-y, -x, z, -w);
      }

      if (bone.name === "spine_01") {
        bone.position.x = tempPosY;
        bone.position.y = tempPosX;
        bone.quaternion.set(y, x, z, -w);
      }
      if (bone.name === "spine_02") {
        bone.position.x = tempPosY;
        bone.position.y = tempPosX;
        bone.quaternion.set(y, x, z, -w);
      }
      if (bone.name === "spine_03") {
        bone.position.x = tempPosY;
        bone.position.y = tempPosX;
        bone.quaternion.set(y, x, z, -w);
      }
      if (bone.name === "neck_01") {
        bone.position.x = tempPosY;
        bone.position.y = tempPosX;
        bone.quaternion.set(y, x, z, -w);
      }
      if (bone.name === "head") {
        bone.position.x = tempPosY;
        bone.position.y = tempPosX;
        bone.quaternion.set(y, x, z, -w);
      }
      if (bone.name === "clavicle_l") {
        bone.position.x = tempPosY;
        bone.position.y = -tempPosX;
        // bone.quaternion.set(x, z, -y, w);
        bone.quaternion.set(-0.08, 0.04, 0.75, -0.65); // TODO
      }
      if (bone.name === "clavicle_r") {
        bone.position.x = tempPosY;
        bone.position.y = -tempPosX;
        // bone.quaternion.set(y, x, z, -w);
        bone.quaternion.set(-0.75, 0.65, -0.08, 0.04); // TODO

        console.log("toArray", bone.quaternion.toArray());
      }
      if (bone.name === "upperarm_l") {
        bone.position.x = tempPosY;
        bone.position.y = tempPosX;
        bone.quaternion.set(-z, y, -x, w);
      }
      if (bone.name === "upperarm_r") {
        bone.position.x = -tempPosY;
        bone.position.y = tempPosX;
        bone.quaternion.set(-z, y, -x, w);
      }
      if (bone.name === "lowerarm_l") {
        bone.position.x = tempPosY;
        bone.position.y = tempPosX;
        bone.quaternion.set(x, z, -y, -w);
      }
      if (bone.name === "lowerarm_r") {
        bone.position.x = -tempPosY;
        bone.position.y = tempPosX;
        bone.quaternion.set(-x, z, y, w);
      }
      if (bone.name === "hand_l") {
        bone.position.x = tempPosY;
        bone.position.y = tempPosX;
        // bone.quaternion.set(x, z, -y, -w); // TODO - unknown as going from zeros to 0.56,0,0,-0.83
        bone.quaternion.set(0.56, -0.02, 0.0, -0.83); // TODO
      }
      if (bone.name === "hand_r") {
        bone.position.x = -tempPosY;
        bone.position.y = tempPosX;
        // bone.quaternion.set(x, z, -y, -w); // TODO - unknown as going from zeros to 0.56,0,0,-0.83
        bone.quaternion.set(0.56, -0.02, 0.0, -0.83); // TODO
      }

      // if (bone.name === "thigh_l") {
      //   bone.rotation.z += Math.PI;
      // }
      //
      // if (bone.name === "thigh_r") {
      //   bone.rotation.z += Math.PI;
      // }

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

    return {
      didApply: true,
      logs: [
        {
          message: "Rotated pelvis and all children and reposed meshes against new skeleton.",
          level: "info",
        },
      ],
      topLevelMessage: {
        level: "info",
        message: "Detected pelvis was not at expected rotation.",
      },
    };
  },
};
