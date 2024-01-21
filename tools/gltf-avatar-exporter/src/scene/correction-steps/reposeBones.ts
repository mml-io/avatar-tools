import * as THREE from "three";
import { Group } from "three";

import { LogMessage, Step } from "./types";

export const reposeBonesCorrectionStep: Step = {
  name: "reposeBones",
  action: (group: Group) => {
    const logs: Array<LogMessage> = [];

    group.traverse((child) => {
      const asSkinnedMesh = child as THREE.SkinnedMesh;
      if (asSkinnedMesh.isSkinnedMesh) {
        console.log("reposing", asSkinnedMesh.name);
        asSkinnedMesh.skeleton.pose();
        asSkinnedMesh.skeleton.calculateInverses();
      }
    });

    if (logs.length === 0) {
      return {
        didApply: false,
        topLevelMessage: {
          level: "info",
          message: "No geometries with duplicate material ids found.",
        },
      };
    }

    return {
      didApply: true,
      topLevelMessage: {
        level: "info",
        message: "Merged geometry groups",
      },
      logs,
    };
  },
};
