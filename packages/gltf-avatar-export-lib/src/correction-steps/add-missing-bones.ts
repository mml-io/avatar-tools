import { Bone, Group } from "three";

import { reposeSkinnedMeshes } from "./reposeSkinnedMeshes";
import { traverseAndLogBone } from "./traverseAndLogBone";
import { Step } from "./types";

export const addMissingBonesCorrectionStep: Step = {
  name: "addMissingBones",
  action: (group: Group) => {
    console.log("group", group);

    const rootBone = group.getObjectByName("root") as Bone;

    const spine1Bone = group.getObjectByName("spine_01") as Bone;

    const spine2Bone = group.getObjectByName("spine_02") as Bone;

    const spine3Bone = group.getObjectByName("spine_03") as Bone;
    const spine3BoneChildren = Array.from(spine3Bone.children);
    const neck1Bone = group.getObjectByName("neck_01") as Bone;
    const headBone = group.getObjectByName("head") as Bone;

    const spine4Bone = new Bone();
    spine4Bone.name = "spine_04";

    const spine5Bone = new Bone();
    spine5Bone.name = "spine_05";

    const neck2Bone = new Bone();
    neck2Bone.name = "neck_02";

    spine3BoneChildren.forEach((child) => {
      spine5Bone.add(child);
    });

    spine3Bone.add(spine4Bone);
    spine4Bone.add(spine5Bone);
    spine5Bone.add(neck1Bone);

    neck1Bone.add(neck2Bone);
    neck2Bone.add(headBone);

    //spine1Bone.position.set(0.037, -0.0, -0.0);
    spine1Bone.quaternion.set(0.0, 0.126, 0.0, -0.992);
    spine1Bone.updateMatrixWorld(true);

    //spine2Bone.position.set(0.068, 0.0, -0.0);
    spine2Bone.quaternion.set(0.0, -0.03, 0.0, -1.0);
    spine2Bone.updateMatrixWorld(true);

    //spine3Bone.position.set(0.072, 0.0, 0.0);
    spine3Bone.quaternion.set(0.0, -0.095, 0.0, -0.995);
    spine3Bone.updateMatrixWorld(true);

    //original
    //spine4Bone.position.set(0.085, 0.0, 0.0);
    spine4Bone.position.set(spine4Bone.position.x, spine4Bone.position.y+0.01, spine4Bone.position.z);
    spine4Bone.quaternion.set(0.0, -0.051, 0.0, -0.999);
    spine4Bone.updateMatrixWorld(true);

    //spine5Bone.position.set(0.194, -0.0, 0.0);
    spine5Bone.position.set(spine5Bone.position.x, spine5Bone.position.y+0.01, spine5Bone.position.z);
    spine5Bone.quaternion.set(0.0, -0.006, 0.0, -1.0);
    spine5Bone.updateMatrixWorld(true);

    //neck1Bone.position.set(0.119, 0.0, -0.0);
    neck1Bone.position.set(neck1Bone.position.x, neck1Bone.position.y-0.02, neck2Bone.position.z);
    neck1Bone.quaternion.set(0.0, 0.207, 0.0, -0.978);
    neck1Bone.updateMatrixWorld(true);

    //neck2Bone.position.set(0.051, -0.0, 0.0);
    neck2Bone.quaternion.set(0.0, -0.017, 0.0, -1.0);
    neck2Bone.updateMatrixWorld(true);

    // spine_01: { pos: [0.037, -0.0, -0.0], rot: [0.0, 0.126, 0.0, -0.992], children: ["spine_02"] },
    // spine_02: { pos: [0.068, 0.0, -0.0], rot: [0.0, -0.03, 0.0, -1.0], children: ["spine_03"] },
    // spine_03: { pos: [0.072, 0.0, 0.0], rot: [0.0, -0.095, 0.0, -0.995], children: ["spine_04"] },
    // spine_04: { pos: [0.085, 0.0, 0.0], rot: [0.0, -0.051, 0.0, -0.999], children: ["spine_05"] },
    // spine_05: {
    //   pos: [0.194, -0.0, 0.0],
    //     rot: [0.0, -0.006, 0.0, -1.0],
    //     children: ["neck_01", "clavicle_l", "clavicle_r"],
    // },
    // neck_01: { pos: [0.119, 0.0, -0.0], rot: [0.0, 0.207, 0.0, -0.978], children: ["neck_02"] },
    // neck_02: { pos: [0.051, -0.0, 0.0], rot: [0.0, -0.017, 0.0, -1.0], children: ["head"] },

    //traverseAndLogBone(rootBone);

    reposeSkinnedMeshes(group);

    return {
      didApply: true,
      topLevelMessage: {
        level: "info",
        message: "Added missing bones spine_04 and spine_05.",
      },
    };
  },
};
