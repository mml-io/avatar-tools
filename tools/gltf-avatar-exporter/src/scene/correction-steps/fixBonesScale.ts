import * as THREE from "three";
import { Group } from "three";

import { getBonesBoundingBox } from "./getBonesBoundingBox";
import { LogMessage, Step } from "./types";

const scaleCorrection = new THREE.Matrix4().makeScale(0.01, 0.01, 0.01);

export const fixBonesScaleCorrectionStep: Step = {
  name: "fixBonesScale",
  action: (group: Group) => {
    const bonesBoundingBox = getBonesBoundingBox(group);
    const xBonesSize = bonesBoundingBox.max.x - bonesBoundingBox.min.x;
    const yBonesSize = bonesBoundingBox.max.y - bonesBoundingBox.min.y;
    const zBonesSize = bonesBoundingBox.max.z - bonesBoundingBox.min.z;
    const bonesSizeLog: LogMessage = {
      level: "info",
      message: `Bones size: x: ${xBonesSize}, y: ${yBonesSize}, z: ${zBonesSize}`,
    };
    const bonesAre100TimesTooLarge = zBonesSize > 10 || yBonesSize > 10;
    if (!bonesAre100TimesTooLarge) {
      return {
        didApply: false,
        topLevelMessage: {
          level: "info",
          message: "Detected bones were < 10 in y/z. No correction needed.",
        },
        logs: [bonesSizeLog],
      };
    }

    group.traverse((child) => {
      const asBone = child as THREE.Bone;
      if (asBone.isBone) {
        asBone.position.applyMatrix4(scaleCorrection);
        asBone.updateMatrixWorld(true);
      }
    });

    return {
      didApply: true,
      topLevelMessage: {
        level: "info",
        message: "Detected bones were > 10 in y/z. Scaled down to 10% of initial.",
      },
      logs: [bonesSizeLog],
    };
  },
};
