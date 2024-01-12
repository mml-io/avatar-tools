import * as THREE from "three";
import { Group } from "three";

import { LogMessage, Step } from "./types";

export const connectRootCorrectionStep: Step = {
  name: "connectRoot",
  action: (group: Group) => {
    const logs: Array<LogMessage> = [];

    let rootBone = group.getObjectByName("root") as THREE.Bone;
    if (!rootBone) {
      rootBone = new THREE.Bone();
      rootBone.updateMatrixWorld(true);
      rootBone.name = "root";
      group.add(rootBone);

      const pelvis = group.getObjectByName("pelvis") as THREE.Bone;
      if (pelvis) {
        rootBone.add(pelvis);
      }
      const hips = group.getObjectByName("Hips") as THREE.Bone;
      if (hips) {
        rootBone.add(hips);
      }

      logs.push({
        level: "info",
        message: "Added root bone.",
      });
    }

    group.traverse((child) => {
      const asSkinnedMesh = child as THREE.SkinnedMesh;
      if (asSkinnedMesh.isSkinnedMesh) {
        const skeleton = asSkinnedMesh.skeleton;
        if (skeleton.bones.indexOf(rootBone) === -1) {
          skeleton.bones.push(rootBone);
          skeleton.calculateInverses();
          logs.push({
            level: "info",
            message: `Added root bone to ${asSkinnedMesh.name}.`,
          });
        }
      }
    });

    if (logs.length === 0) {
      return {
        didApply: false,
        topLevelMessage: {
          level: "info",
          message: "No skinned meshes with missing roots to fix.",
        },
        logs,
      };
    }
    return {
      didApply: true,
      topLevelMessage: {
        level: "info",
        message: "Applied root to skinned meshes.",
      },
      logs,
    };
  },
};
