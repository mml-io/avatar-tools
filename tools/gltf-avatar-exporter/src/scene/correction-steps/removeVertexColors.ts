import * as THREE from "three";
import { Group } from "three";

import { LogMessage, Step } from "./types";

export const removeVertexColorsCorrectionStep: Step = {
  name: "removeVertexColors",
  action: (group: Group) => {
    const logs: Array<LogMessage> = [];
    group.traverse((child) => {
      const asSkinnedMesh = child as THREE.SkinnedMesh;
      if (asSkinnedMesh.isSkinnedMesh) {
        const geometry = asSkinnedMesh.geometry;
        if (geometry.attributes.color) {
          geometry.deleteAttribute("color");
          logs.push({
            level: "info",
            message: `Removed vertex colors from ${asSkinnedMesh.name}`,
          });
        }
      }
    });

    if (logs.length === 0) {
      return {
        didApply: false,
        topLevelMessage: {
          level: "info",
          message: "No meshes with vertex colors found.",
        },
        logs,
      };
    }

    return {
      didApply: true,
      topLevelMessage: {
        level: "info",
        message: `Found mesh(es) with vertex colors.`,
      },
      logs: logs,
    };
  },
};
