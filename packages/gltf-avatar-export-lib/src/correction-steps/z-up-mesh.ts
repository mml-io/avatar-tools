import * as THREE from "three";
import { Group } from "three";

import { getBonesBoundingBox } from "./getBonesBoundingBox";
import { LogMessage, Step, StepResult } from "./types";

const zUpCorrection = new THREE.Matrix4().makeRotationX(-Math.PI / 2);

export const zUpMeshCorrectionStep = {
  name: "z-up-mesh",
  action: (group: Group): StepResult => {
    /*
     Detect the bone sizes to determine if we need to apply the scaling to the mesh. The mesh itself might be too small
    */
    const bonesBoundingBox = getBonesBoundingBox(group);
    const xBonesSize = bonesBoundingBox.max.x - bonesBoundingBox.min.x;
    const yBonesSize = bonesBoundingBox.max.y - bonesBoundingBox.min.y;
    const zBonesSize = bonesBoundingBox.max.z - bonesBoundingBox.min.z;
    const bonesSizeLog: LogMessage = {
      level: "info",
      message: `Bones size: x: ${xBonesSize}, y: ${yBonesSize}, z: ${zBonesSize}`,
    };
    const meshIsZUp = zBonesSize > yBonesSize;
    if (!meshIsZUp) {
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
      const asSkinnedMesh = child as THREE.SkinnedMesh;
      if (asSkinnedMesh.isSkinnedMesh) {
        asSkinnedMesh.geometry.applyMatrix4(zUpCorrection);
      }
    });

    return {
      didApply: true,
      topLevelMessage: {
        level: "info",
        message: "Detected mesh was z-up (height was in z axis). Rotated to make height y axis.",
      },
      logs: [bonesSizeLog],
    };
  },
} as const;
