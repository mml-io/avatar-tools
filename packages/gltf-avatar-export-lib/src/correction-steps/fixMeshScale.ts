import * as THREE from "three";
import { Group } from "three";

import { getBonesBoundingBox } from "./getBonesBoundingBox";
import { LogMessage, Step } from "./types";

const scaleCorrection = new THREE.Matrix4().makeScale(0.01, 0.01, 0.01);
const scaleKCorrection = new THREE.Matrix4().makeScale(0.001, 0.001, 0.001);

export const fixMeshScaleCorrectionStep: Step = {
  name: "fixMeshScale",
  action: (group: Group) => {
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
    const bonesAre100TimesTooLarge = zBonesSize > 50 || yBonesSize > 50;
    const bonesAre1000TimesTooLarge = zBonesSize > 500 || yBonesSize > 500;

    if (!bonesAre100TimesTooLarge) {
      return {
        didApply: false,
        logs: [bonesSizeLog],
        topLevelMessage: {
          level: "info",
          message: "Detected bones size was < 10 in y/z. No correction needed.",
        },
      };
    }

    group.traverse((child) => {
      const asSkinnedMesh = child as THREE.SkinnedMesh;
      if (asSkinnedMesh.isSkinnedMesh) {
        if (bonesAre1000TimesTooLarge) {
          asSkinnedMesh.geometry.applyMatrix4(scaleKCorrection);
        } else {
          asSkinnedMesh.geometry.applyMatrix4(scaleCorrection);
        }
      }
    });

    return {
      didApply: true,
      topLevelMessage: {
        level: "info",
        message: `Detected mesh size was > ${
          bonesAre1000TimesTooLarge ? "100" : "10"
        } in y/z. Scaled down to ${bonesAre1000TimesTooLarge ? "1%" : "10%"} of initial.`,
      },
      logs: [bonesSizeLog],
    };
  },
};
