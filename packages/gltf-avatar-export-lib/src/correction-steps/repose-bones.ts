import * as THREE from "three";
import { Group } from "three";

import { LogMessage, Step, StepResult } from "./types";

export const reposeBonesCorrectionStep = {
  name: "repose-bones",
  action: (group: Group): StepResult => {
    const logs: Array<LogMessage> = [];

    group.traverse((child) => {
      const asSkinnedMesh = child as THREE.SkinnedMesh;
      if (asSkinnedMesh.isSkinnedMesh) {
        const inverses = [...asSkinnedMesh.skeleton.boneInverses];
        asSkinnedMesh.skeleton.pose();
        asSkinnedMesh.skeleton.calculateInverses();
        const newInverses = asSkinnedMesh.skeleton.boneInverses;
        let allInversesEqual = true;
        for (let i = 0; i < inverses.length; i++) {
          if (!inverses[i].equals(newInverses[i])) {
            allInversesEqual = false;
            break;
          }
        }
        if (!allInversesEqual) {
          logs.push({
            level: "info",
            message: `Reposed skeleton for ${asSkinnedMesh.name}`,
          });
        }
      }
    });

    if (logs.length === 0) {
      return {
        didApply: false,
        topLevelMessage: {
          level: "info",
          message: "No skeletons were reposed.",
        },
      };
    }

    return {
      didApply: true,
      topLevelMessage: {
        level: "info",
        message: "Skeletons were reposed",
      },
      logs,
    };
  },
} as const;
