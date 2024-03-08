import * as THREE from "three";
import { Group } from "three";

import { LogMessage, Step } from "./types";

export const levelOfDetailDedupingCorrectionStep: Step = {
  name: "levelOfDetailDeduping",
  action: (group: Group) => {
    const skinnedMeshByName = new Map<string, THREE.SkinnedMesh>();
    const skinnedMeshByLODName = new Map<
      string,
      Array<{ lodNumber: number; mesh: THREE.SkinnedMesh }>
    >();

    let didRemoveMeshes = false;
    const logs: Array<LogMessage> = [];
    const toRemove: Array<THREE.SkinnedMesh> = [];
    group.traverse((child) => {
      const asSkinnedMesh = child as THREE.SkinnedMesh;
      if (asSkinnedMesh.isSkinnedMesh) {
        const existing = skinnedMeshByName.get(asSkinnedMesh.name);
        if (existing) {
          toRemove.push(asSkinnedMesh);
          didRemoveMeshes = true;
          logs.push({
            level: "info",
            message: `Removed mesh with duplicate name: ${child.name}`,
          });
        } else {
          skinnedMeshByName.set(asSkinnedMesh.name, asSkinnedMesh);

          // Check if any of the meshes have the same name, but different LODs (e.g. MyMesh_LOD0 and MyMesh_LOD1)
          // If so, remove the higher LODs
          const splitByLOD = asSkinnedMesh.name.split("_LOD", 2);
          const lodName = splitByLOD[0];
          if (splitByLOD.length > 1) {
            // This name includes a LOD number
            const lodNumber = splitByLOD[1];
            const parsedLodNumber = parseInt(lodNumber, 10);
            if (!isNaN(parsedLodNumber)) {
              const existingLOD = skinnedMeshByLODName.get(lodName);
              if (existingLOD) {
                existingLOD.push({ lodNumber: parsedLodNumber, mesh: asSkinnedMesh });
              } else {
                skinnedMeshByLODName.set(lodName, [
                  { lodNumber: parsedLodNumber, mesh: asSkinnedMesh },
                ]);
              }
            }
          }
        }
      }
    });

    for (const [, meshes] of skinnedMeshByLODName.entries()) {
      if (meshes.length > 1) {
        // Sort so that the lowest LOD is first
        const sortedByLODNumber = meshes.sort((a, b) => a.lodNumber - b.lodNumber);
        for (let i = 1; i < sortedByLODNumber.length; i++) {
          const mesh = sortedByLODNumber[i].mesh;
          toRemove.push(mesh);
          didRemoveMeshes = true;
          logs.push({
            level: "info",
            message: `Removed mesh with duplicate LOD: ${mesh.name}`,
          });
        }
      }
    }
    for (const child of toRemove) {
      child.parent!.remove(child);
    }

    if (!didRemoveMeshes) {
      return {
        didApply: false,
        topLevelMessage: {
          level: "info",
          message: "No meshes with duplicate names or LODs found.",
        },
      };
    }

    return {
      didApply: true,
      topLevelMessage: {
        level: "info",
        message: "Removed meshes with duplicate names and LODs.",
      },
      logs,
    };
  },
};
