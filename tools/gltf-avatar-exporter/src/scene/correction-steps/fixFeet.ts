import * as THREE from "three";
import { Group } from "three";

import { reposeSkinnedMeshes } from "./reposeSkinnedMeshes";
import { LogMessage, Step } from "./types";

function isNear(a: number, b: number, epsilon = Math.PI / 8) {
  return Math.abs(a - b) < epsilon;
}

const HalfPi = Math.PI / 2;

// TODO - there are some cases where this doesn't work - and the added rotation potentially overcorrects.
export const fixFeetCorrectionStep: Step = {
  name: "fixFeet",
  action: (group: Group) => {
    const logs: Array<LogMessage> = [];

    const footRBone = group.getObjectByName("foot_r") as THREE.Bone;
    if (!footRBone) {
      logs.push({
        level: "error",
        message: "Could not find foot_r bone. Cannot rotate foot_r.",
      });
    } else {
      const boneX = footRBone.rotation.x;
      const boneY = footRBone.rotation.y;
      const boneZ = footRBone.rotation.z;
      const targetX = 0;
      const targetY = 0;
      const targetZ = 0;
      if (isNear(boneX, targetX) && isNear(boneY, targetY) && isNear(boneZ, targetZ)) {
        // Is near target rotation - no need to rotate
      } else if (isNear(boneX, 0) && isNear(boneY, 0) && isNear(boneZ, HalfPi)) {
        // footRBone.rotation.z -= Math.PI;
        // const { x, y, z, w } = footRBone.quaternion;
        // footRBone.rotation.set(targetX, targetY, targetZ);
        // footRBone.quaternion.set(0.001, -0.023, 0.027, -0.999);
        footRBone.quaternion.set(0, 0, 0, 1);
        logs.push({
          level: "info",
          message: "Detected foot_r was at non-target rotation. Corrected.",
        });
        footRBone.updateMatrixWorld(true);
      } else {
        logs.push({
          level: "error",
          message: "Could not determine known foot_r transform. Cannot rotate foot_r.",
        });
      }
    }

    const ballRBone = group.getObjectByName("ball_r") as THREE.Bone;
    if (!ballRBone) {
      logs.push({
        level: "error",
        message: "Could not find ball_r bone. Cannot rotate ball_r.",
      });
    } else {
      const boneX = ballRBone.rotation.x;
      const boneY = ballRBone.rotation.y;
      const boneZ = ballRBone.rotation.z;
      const targetX = 0;
      const targetY = -HalfPi;
      const targetZ = 0;
      if (isNear(boneX, targetX) && isNear(boneY, targetY) && isNear(boneZ, targetZ)) {
        // Is near target rotation - no need to rotate
      } else if (isNear(boneX, -HalfPi) && isNear(boneY, 0) && isNear(boneZ, -HalfPi)) {
        // ballRBone.rotation.x += HalfPi;
        // ballRBone.rotation.y -= HalfPi;
        // ballRBone.rotation.z += HalfPi;
        // const { x, y, z, w } = ballRBone.quaternion;
        // ballRBone.quaternion.set(-x, z, -y, -w);
        // ballRBone.rotation.set(targetX, targetY, targetZ);
        ballRBone.quaternion.set(0, -0.7071067811865475, 0, 0.7071067811865476);
        logs.push({
          level: "info",
          message: "Detected ball_r was at non-target rotation. Corrected.",
        });
        ballRBone.updateMatrixWorld(true);
      } else {
        logs.push({
          level: "error",
          message: "Could not determine known ball_r transform. Cannot rotate ball_r.",
        });
      }
    }

    if (logs.length === 0) {
      return {
        didApply: false,
        topLevelMessage: {
          level: "info",
          message: "Foot bones found and at approximate target positions and rotations.",
        },
        autoOpenLogs: false,
      };
    }

    reposeSkinnedMeshes(group);

    return {
      didApply: true,
      topLevelMessage: {
        level: "error",
        message: "Feet bones were at non-target rotations.",
      },
      autoOpenLogs: true,
      logs,
    };
  },
};
