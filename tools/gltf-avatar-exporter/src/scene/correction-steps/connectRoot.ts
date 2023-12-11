import * as THREE from "three";
import { Group } from "three";

import { LogMessage, Step } from "./types";

export const connectRootCorrectionStep: Step = {
  name: "connectRoot",
  action: (group: Group) => {
    let rootBone = group.getObjectByName("root") as THREE.Bone;

    if (!rootBone) {
      const pelvisBone = group.getObjectByName("pelvis");
      const pelvisParent = pelvisBone?.parent;

      if (!pelvisBone || !pelvisParent) {
        return {
          didApply: false,
          topLevelMessage: {
            level: "error",
            message: "Could not find root bone or pelvis. Cannot connect root.",
          },
        };
      }

      rootBone = new THREE.Bone();
      rootBone.name = "root";
      rootBone.add(pelvisBone);

      pelvisParent.add(rootBone);
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
            message: `Added ${rootBone.name} bone to ${asSkinnedMesh.name} mesh.`,
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
