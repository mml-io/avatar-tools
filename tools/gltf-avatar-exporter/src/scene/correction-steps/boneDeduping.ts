import * as THREE from "three";
import { Group } from "three";

import { reposeSkinnedMeshes } from "./reposeSkinnedMeshes";
import { Step } from "./types";

export const boneDedupingCorrectionStep: Step = {
  name: "boneDeduping",
  action: (group: Group) => {
    const toRemove: Array<THREE.Bone> = [];
    const bonesByName = new Map<string, THREE.Bone>();
    group.traverse((child) => {
      const asBone = child as THREE.Bone;
      if (asBone.isBone) {
        if (child.parent && child.parent.name === child.name) {
          toRemove.push(asBone);
        } else {
          bonesByName.set(child.name, asBone);
        }
      }
    });
    for (const child of toRemove) {
      child.parent!.remove(child);
    }

    if (toRemove.length === 0) {
      return {
        didApply: false,
        topLevelMessage: {
          level: "info",
          message: "No bones with same name as their parent bone found.",
        },
      };
    }

    group.traverse((child) => {
      const asSkinnedMesh = child as THREE.SkinnedMesh;
      if (asSkinnedMesh.isSkinnedMesh) {
        const skeleton = asSkinnedMesh.skeleton;
        const bones = skeleton.bones;
        const replacedBones = bones.map((bone) => {
          const replacement = bonesByName.get(bone.name);
          if (!replacement) {
            throw new Error(`Missing bone ${bone.name}`);
          }
          return replacement;
        });
        skeleton.bones = replacedBones;
      }
    });

    reposeSkinnedMeshes(group);

    return {
      didApply: true,
      topLevelMessage: {
        level: "info",
        message:
          "Detected bones with same name as their parent bone. Removed duplicates and remapped skeletons of meshes.",
      },
    };
  },
};
