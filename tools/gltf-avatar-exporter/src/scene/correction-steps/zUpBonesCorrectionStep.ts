import { Group } from "three";
import * as THREE from "three";

import { getBonesBoundingBox } from "./getBonesBoundingBox";
import { LogMessage, Step } from "./types";

const zUpCorrection = new THREE.Matrix4().makeRotationX(-Math.PI / 2);

export const zUpBonesCorrectionStep: Step = {
  name: "zUpBones",
  action: (group: Group) => {
    const bonesBoundingBox = getBonesBoundingBox(group);
    const xBonesSize = bonesBoundingBox.max.x - bonesBoundingBox.min.x;
    const yBonesSize = bonesBoundingBox.max.y - bonesBoundingBox.min.y;
    const zBonesSize = bonesBoundingBox.max.z - bonesBoundingBox.min.z;
    const bonesSizeLog: LogMessage = {
      level: "info",
      message: `Bones size: x: ${xBonesSize}, y: ${yBonesSize}, z: ${zBonesSize}`,
    };
    const bonesAreZUp = zBonesSize > yBonesSize;
    if (!bonesAreZUp) {
      return {
        didApply: false,
        logs: [bonesSizeLog],
        topLevelMessage: {
          level: "info",
          message: "Detected bones were y-up (height was in y axis). No correction needed.",
        },
      };
    }

    group.traverse((child) => {
      const asBone = child as THREE.Bone;
      if (asBone.isBone) {
        if (child.name === "root") {
          /*
           If the skeleton is Z-up, apply the matrix transformation to the immediate children of the root bone. This is
           cleaner that rotating the root itself.
          */
          child.children.forEach((innerChild) => {
            innerChild.applyMatrix4(zUpCorrection);
          });
        }
      }
    });

    return {
      didApply: true,
      topLevelMessage: {
        level: "info",
        message: "Detected bones were z-up (height was in z axis). Rotated to make height y axis.",
      },
      logs: [bonesSizeLog],
    };
  },
};
