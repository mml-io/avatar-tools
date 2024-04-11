import * as THREE from "three";
import { Group } from "three";

import { getBonesBoundingBox } from "./getBonesBoundingBox";
import { LogMessage, Step, StepResult } from "./types";

const scaleCorrection = new THREE.Matrix4().makeScale(0.01, 0.01, 0.01);
const scaleKCorrection = new THREE.Matrix4().makeScale(0.001, 0.001, 0.001);

export const fixBonesScaleCorrectionStep = {
  name: "fix-bones-scale",
  action: (group: Group): StepResult => {
    const bonesBoundingBox = getBonesBoundingBox(group);
    const xBonesSize = bonesBoundingBox.max.x - bonesBoundingBox.min.x;
    const yBonesSize = bonesBoundingBox.max.y - bonesBoundingBox.min.y;
    const zBonesSize = bonesBoundingBox.max.z - bonesBoundingBox.min.z;
    const bonesSizeLog: LogMessage = {
      level: "info",
      message: `Bones size: x: ${xBonesSize}, y: ${yBonesSize}, z: ${zBonesSize}`,
    };
    const bonesAre100TimesTooLarge = zBonesSize > 50 || yBonesSize > 50;
    const bonesAre1000TimesTooLarge = zBonesSize > 500 || yBonesSize > 500;

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
        if (bonesAre1000TimesTooLarge) {
          asBone.position.applyMatrix4(scaleKCorrection);
        } else {
          asBone.position.applyMatrix4(scaleCorrection);
        }
        asBone.updateMatrixWorld(true);
      }
    });

    return {
      didApply: true,
      topLevelMessage: {
        level: "info",
        message: `Detected bones were > ${
          bonesAre1000TimesTooLarge ? "100" : "10"
        } in y/z. Scaled down to ${bonesAre1000TimesTooLarge ? "1%" : "10%"} initial.`,
      },
      logs: [bonesSizeLog],
    };
  },
} as const;
