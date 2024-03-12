import * as THREE from "three";
import { Group } from "three";

import { LogMessage, Step } from "./types";

export const connectRootCorrectionStep: Step = {
  name: "connectRoot",
  action: (group: Group) => {
    const rootBone = group.getObjectByName("root") as THREE.Bone;
    if (!rootBone) {
      return {
        didApply: false,
        topLevelMessage: {
          level: "error",
          message: "Could not find root bone. Cannot connect root.",
        },
      };
    }
    const logs: Array<LogMessage> = [];
    group.traverse((child) => {
      const asSkinnedMesh = child as THREE.SkinnedMesh;
      if (asSkinnedMesh.isSkinnedMesh) {
        const skeleton = asSkinnedMesh.skeleton;
        if (skeleton.bones.indexOf(rootBone) === -1) {
          skeleton.bones.push(rootBone);
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
