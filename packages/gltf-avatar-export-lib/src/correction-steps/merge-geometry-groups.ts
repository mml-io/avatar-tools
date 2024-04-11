import * as THREE from "three";
import { Group } from "three";
// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

import { LogMessage, Step, StepResult } from "./types";

export const mergeGeometryGroupsCorrectionStep = {
  name: "merge-geometry-groups",
  action: (group: Group): StepResult => {
    const logs: Array<LogMessage> = [];

    group.traverse((child) => {
      const asSkinnedMesh = child as THREE.SkinnedMesh;
      if (asSkinnedMesh.isSkinnedMesh) {
        const geometry = asSkinnedMesh.geometry;
        const existingIds = new Set<number>();
        let didHaveDuplicateIds = false;
        if (geometry.groups.length > 0) {
          for (const geoGroup of geometry.groups) {
            if (geoGroup.materialIndex) {
              if (existingIds.has(geoGroup.materialIndex)) {
                didHaveDuplicateIds = true;
                break;
              }
              existingIds.add(geoGroup.materialIndex);
            }
          }
          if (didHaveDuplicateIds) {
            logs.push({
              level: "info",
              message: `Merging geometry groups for mesh: ${child.name}`,
            });
            BufferGeometryUtils.mergeGroups(geometry);
          }
        }
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
} as const;
