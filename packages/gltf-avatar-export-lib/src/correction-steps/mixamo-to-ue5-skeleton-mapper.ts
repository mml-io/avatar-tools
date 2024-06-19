import * as THREE from "three";
import { Group } from "three";

import MixamoToUE5ConfigJSON from "./mixamo-to-ue5.json";
import { LogMessage, Step, StepResult } from "./types";

type BoneConfig = {
  boneName: string;
  boneConfig: {
    sourceBones: { name: string; ratio: number }[];
    delta: { x: number; y: number; z: number };
    originalPosition: { x: number; y: number; z: number };
    originalRotation: { x: number; y: number; z: number };
  };
  children: Array<BoneConfig>;
};

const mixamoToUE5Config = MixamoToUE5ConfigJSON as unknown as BoneConfig;

export const mixamoToUe5SkeletonMapper = {
  name: "mixamo-to-ue5-skeleton-mapper",
  action: (group: Group): StepResult => {
    const logs: Array<LogMessage> = [];

    const bonesByName = new Map<string, THREE.Bone>();

    const originalBonesByInfluencedBone = new Map<
      THREE.Bone,
      Array<{
        targetBone: THREE.Bone;
        ratio: number;
      }>
    >();

    group.traverse((child) => {
      const asBone = child as THREE.Bone;
      if (asBone.isBone) {
        let name = asBone.name;
        if (name.startsWith("mixamorig")) {
          name = name.replace("mixamorig", "");
        }
        bonesByName.set(name, asBone);
      }
    });

    const ue5SkeletonGroup = new Group();
    const allUE5Bones: Array<THREE.Bone> = [];

    const boneConfigToBone = (
      boneConfig: BoneConfig,
      parent: THREE.Object3D | null,
    ): THREE.Bone => {
      const bone = new THREE.Bone();
      bone.name = boneConfig.boneName;
      if (parent) {
        parent.add(bone);
      } else {
        ue5SkeletonGroup.add(bone);
      }
      allUE5Bones.push(bone);

      // TODO - apply positions

      if (boneConfig.boneConfig) {
        const sourceBones = boneConfig.boneConfig.sourceBones;
        const delta = boneConfig.boneConfig.delta;
        const originalPosition = boneConfig.boneConfig.originalPosition;
        const originalRotation = boneConfig.boneConfig.originalRotation;
        const boneWorldPosition = new THREE.Vector3();
        for (const sourceBone of sourceBones) {
          const sourceBoneObject = bonesByName.get(sourceBone.name);
          if (!sourceBoneObject) {
            console.warn(`Missing bone ${sourceBone.name}`);
          } else {
            const sourceBoneWorldPosition = new THREE.Vector3();
            sourceBoneObject.getWorldPosition(sourceBoneWorldPosition);
            boneWorldPosition.addScaledVector(sourceBoneWorldPosition, sourceBone.ratio);

            let influencedBones = originalBonesByInfluencedBone.get(sourceBoneObject);
            if (!influencedBones) {
              influencedBones = [];
              originalBonesByInfluencedBone.set(sourceBoneObject, []);
            }
            influencedBones.push({
              targetBone: bone,
              ratio: sourceBone.ratio,
            });
          }
        }
        boneWorldPosition.add(new THREE.Vector3(delta.x, delta.y, delta.z));

        // boneWorldPosition.set(originalPosition.x, originalPosition.y, originalPosition.z);

        const parentPosition = parent
          ? parent.getWorldPosition(new THREE.Vector3())
          : new THREE.Vector3();
        console.log("bone.name", bone.name);
        console.log("boneWorldPosition", boneWorldPosition);
        console.log("parentPosition", parentPosition);
        bone.position.copy(boneWorldPosition).sub(parentPosition);
        bone.rotation.set(originalRotation.x, originalRotation.y, originalRotation.z);

        const matrixWorld = new THREE.Matrix4();

        parent?.updateMatrixWorld(true);

        const parentQuaternion = new THREE.Quaternion();
        if (parent) {
          parent.getWorldQuaternion(parentQuaternion);
        }
        const combinedQuaternion = new THREE.Quaternion().multiplyQuaternions(
          parentQuaternion,
          new THREE.Quaternion().setFromEuler(bone.rotation),
        );
        matrixWorld.makeRotationFromQuaternion(combinedQuaternion);
        matrixWorld.setPosition(boneWorldPosition);
        console.log("matrixWorld", matrixWorld);
        const parentMatrix = parent ? parent.matrixWorld : new THREE.Matrix4();
        const localMatrix = parentMatrix.clone().invert().multiply(matrixWorld);
        const localPosition = new THREE.Vector3();
        const localQuaternion = new THREE.Quaternion();
        const localScale = new THREE.Vector3();
        console.log("localPosition", localPosition);
        console.log("localQuaternion", localQuaternion);
        console.log("localScale", localScale);

        localMatrix.decompose(localPosition, localQuaternion, localScale);
        bone.position.copy(localPosition);
        bone.quaternion.copy(localQuaternion);
        bone.scale.copy(localScale);

        bone.updateMatrixWorld(true);
      }

      for (const childConfig of boneConfig.children) {
        boneConfigToBone(childConfig, bone);
      }

      return bone;
    };
    boneConfigToBone(mixamoToUE5Config, ue5SkeletonGroup);

    const ue5Skeleton = new THREE.Skeleton(allUE5Bones);

    function addWeights(
      mapOfBonesToSummedWeights: Map<THREE.Bone, number>,
      bone: THREE.Bone,
      weight: number,
      boneName: string,
    ) {
      const targetBoneInfluences = originalBonesByInfluencedBone.get(bone);
      if (targetBoneInfluences) {
        for (const targetBoneInfluence of targetBoneInfluences) {
          let existing = mapOfBonesToSummedWeights.get(targetBoneInfluence.targetBone);
          if (!existing) {
            existing = 0;
          }
          mapOfBonesToSummedWeights.set(
            targetBoneInfluence.targetBone,
            existing + targetBoneInfluence.ratio * weight,
          );
        }
      } else {
        // console.warn(`No influences for bone ${boneName}`);
      }
    }

    group.traverse((child) => {
      const asSkinnedMesh = child as THREE.SkinnedMesh;
      if (asSkinnedMesh.isSkinnedMesh) {
        const originalBones = [...asSkinnedMesh.skeleton.bones];
        asSkinnedMesh.skeleton = ue5Skeleton;

        // console.log("asSkinnedMesh.geometry", asSkinnedMesh.geometry);

        const skinIndices = asSkinnedMesh.geometry.getAttribute(
          "skinIndex",
        ) as THREE.BufferAttribute;

        const skinWeights = asSkinnedMesh.geometry.getAttribute(
          "skinWeight",
        ) as THREE.BufferAttribute;

        for (let i = 0; i < skinIndices.count; i++) {
          const indexX = skinIndices.getX(i);
          const indexY = skinIndices.getY(i);
          const indexZ = skinIndices.getZ(i);
          const indexW = skinIndices.getW(i);

          const weightX = skinWeights.getX(i);
          const weightY = skinWeights.getY(i);
          const weightZ = skinWeights.getZ(i);
          const weightW = skinWeights.getW(i);

          const boneX = originalBones[indexX];
          const boneY = originalBones[indexY];
          const boneZ = originalBones[indexZ];
          const boneW = originalBones[indexW];

          const boneXName = originalBones[indexX]?.name;
          const boneYName = originalBones[indexY]?.name;
          const boneZName = originalBones[indexZ]?.name;
          const boneWName = originalBones[indexW]?.name;

          const mapOfBonesToSummedWeights = new Map<THREE.Bone, number>();
          addWeights(mapOfBonesToSummedWeights, boneX, weightX, boneXName);
          addWeights(mapOfBonesToSummedWeights, boneY, weightY, boneYName);
          addWeights(mapOfBonesToSummedWeights, boneZ, weightZ, boneZName);
          addWeights(mapOfBonesToSummedWeights, boneW, weightW, boneWName);

          const entries = Array.from(mapOfBonesToSummedWeights.entries());
          entries.sort((a, b) => b[1] - a[1]);
          const sorted = entries.slice(0, 4);
          // console.log("entries", sorted);

          const summed = sorted.reduce((acc, [_, weight]) => acc + weight, 0);
          // console.log("summed", summed);

          if (summed === 0) {
            console.warn("Summed weights are 0. Skipping normalization.");
            continue;
          }

          const normalized = sorted.map(([bone, weight]) => weight / summed);
          // console.log("normalized", normalized);
          //
          // console.log("index", {
          //   0: [indexX, weightX, boneXName],
          //   1: [indexY, weightY, boneYName],
          //   2: [indexZ, weightZ, boneZName],
          //   3: [indexW, weightW, boneWName],
          // });
          // const newIndex = index;
          // skinIndices.setX(i, newIndex);

          skinIndices.setX(i, allUE5Bones.indexOf(sorted[0][0]));
          skinIndices.setY(i, allUE5Bones.indexOf(sorted[1][0]));
          skinIndices.setZ(i, allUE5Bones.indexOf(sorted[2][0]));
          skinIndices.setW(i, allUE5Bones.indexOf(sorted[3][0]));

          skinWeights.setX(i, normalized[0]);
          skinWeights.setY(i, normalized[1]);
          skinWeights.setZ(i, normalized[2]);
          skinWeights.setW(i, normalized[3]);
        }
        // console.log("skinWeights", skinWeights);
      }
    });
    group.add(ue5SkeletonGroup);

    return {
      didApply: true,
      topLevelMessage: {
        level: "info",
        message: "Skeletons were remapped to UE5 skeleton.",
      },
      logs,
    };
  },
} as const;
