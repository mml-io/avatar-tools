import * as THREE from "three";

import { LogMessage, Step } from "./types";

const unrealBones = [
  "root",
  "pelvis",
  "thigh_l",
  "calf_l",
  "foot_l",
  "ball_l",
  "calf_twist_01_l",
  "calf_twist_02_l",
  "thigh_twist_01_l",
  "thigh_twist_02_l",
  "thigh_r",
  "calf_r",
  "foot_r",
  "ball_r",
  "calf_twist_01_r",
  "calf_twist_02_r",
  "thigh_twist_01_r",
  "thigh_twist_02_r",
  "spine_01",
  "spine_02",
  "spine_03",
  "spine_04",
  "spine_05",
  "clavicle_r",
  "upperarm_r",
  "lowerarm_r",
  "hand_r",
  "thumb_01_r",
  "thumb_02_r",
  "thumb_03_r",
  "index_metacarpal_r",
  "index_01_r",
  "index_02_r",
  "index_03_r",
  "middle_metacarpal_r",
  "middle_01_r",
  "middle_02_r",
  "middle_03_r",
  "ring_metacarpal_r",
  "ring_01_r",
  "ring_02_r",
  "ring_03_r",
  "pinky_metacarpal_r",
  "pinky_01_r",
  "pinky_02_r",
  "pinky_03_r",
  "lowerarm_twist_01_r",
  "lowerarm_twist_02_r",
  "upperarm_twist_01_r",
  "upperarm_twist_02_r",
  "clavicle_l",
  "upperarm_l",
  "lowerarm_l",
  "hand_l",
  "thumb_01_l",
  "thumb_02_l",
  "thumb_03_l",
  "index_metacarpal_l",
  "index_01_l",
  "index_02_l",
  "index_03_l",
  "middle_metacarpal_l",
  "middle_01_l",
  "middle_02_l",
  "middle_03_l",
  "ring_metacarpal_l",
  "ring_01_l",
  "ring_02_l",
  "ring_03_l",
  "pinky_metacarpal_l",
  "pinky_01_l",
  "pinky_02_l",
  "pinky_03_l",
  "lowerarm_twist_01_l",
  "lowerarm_twist_02_l",
  "upperarm_twist_01_l",
  "upperarm_twist_02_l",
  "neck_01",
  "neck_02",
  "head",
  "ik_foot_root",
  "ik_foot_l",
  "ik_foot_r",
  "ik_hand_root",
  "ik_hand_gun",
  "ik_hand_l",
  "ik_hand_r",
];

const mixamoBonesNamingMap = new Map([
  ["mixamorigHips", "pelvis"],
  ["mixamorigSpine", "spine_01"],
  ["mixamorigSpine1", "spine_02"],
  ["mixamorigSpine2", "spine_03"],
  ["mixamorigNeck", "neck_01"],
  ["mixamorigHead", "head"],
  ["mixamorigHeadTop_End", "end"],
  ["mixamorigLeftShoulder", "clavicle_l"],
  ["mixamorigRightShoulder", "clavicle_r"],
  ["mixamorigLeftArm", "upperarm_l"],
  ["mixamorigRightArm", "upperarm_r"],
  ["mixamorigLeftForeArm", "lowerarm_l"],
  ["mixamorigRightForeArm", "lowerarm_r"],
  ["mixamorigLeftHand", "hand_l"],
  ["mixamorigRightHand", "hand_r"],
  ["mixamorigLeftUpLeg", "thigh_l"],
  ["mixamorigRightUpLeg", "thigh_r"],
  ["mixamorigLeftLeg", "calf_l"],
  ["mixamorigRightLeg", "calf_r"],
  ["mixamorigLeftFoot", "foot_l"],
  ["mixamorigRightFoot", "foot_r"],
  ["mixamorigLeftToe_End", "ball_l"],
  ["mixamorigRightToe_End", "ball_r"],
  ["mixamorigLeftHandThumb1", "thumb_01_l"],
  ["mixamorigRightHandThumb1", "thumb_01_r"],
  ["mixamorigLeftHandThumb2", "thumb_02_l"],
  ["mixamorigRightHandThumb2", "thumb_02_r"],
  ["mixamorigLeftHandThumb3", "thumb_03_l"],
  ["mixamorigRightHandThumb3", "thumb_03_r"],
  ["mixamorigLeftHandThumb4", "thumb_04_l"], // No Unreal equivalent
  ["mixamorigRightHandThumb4", "thumb_04_r"], // No Unreal equivalent
  ["mixamorigLeftHandIndex1", "index_metacarpal_l"],
  ["mixamorigRightHandIndex1", "index_metacarpal_r"],
  ["mixamorigLeftHandIndex2", "index_01_l"],
  ["mixamorigRightHandIndex2", "index_01_r"],
  ["mixamorigLeftHandIndex3", "index_02_l"],
  ["mixamorigRightHandIndex3", "index_02_r"],
  ["mixamorigLeftHandIndex4", "index_03_l"],
  ["mixamorigRightHandIndex4", "index_03_r"],
  ["mixamorigLeftHandMiddle1", "middle_metacarpal_l"],
  ["mixamorigRightHandMiddle1", "middle_metacarpal_r"],
  ["mixamorigLeftHandMiddle2", "middle_01_l"],
  ["mixamorigRightHandMiddle2", "middle_01_r"],
  ["mixamorigLeftHandMiddle3", "middle_02_l"],
  ["mixamorigRightHandMiddle3", "middle_02_r"],
  ["mixamorigLeftHandMiddle4", "middle_03_l"],
  ["mixamorigRightHandMiddle4", "middle_03_r"],
  ["mixamorigLeftHandRing1", "ring_metacarpal_l"],
  ["mixamorigRightHandRing1", "ring_metacarpal_r"],
  ["mixamorigLeftHandRing2", "ring_01_l"],
  ["mixamorigRightHandRing2", "ring_01_r"],
  ["mixamorigLeftHandRing3", "ring_02_l"],
  ["mixamorigRightHandRing3", "ring_02_r"],
  ["mixamorigLeftHandRing4", "ring_03_l"],
  ["mixamorigRightHandRing4", "ring_03_r"],
  ["mixamorigLeftHandPinky1", "pinky_metacarpal_l"],
  ["mixamorigRightHandPinky1", "pinky_metacarpal_r"],
  ["mixamorigLeftHandPinky2", "pinky_01_l"],
  ["mixamorigRightHandPinky2", "pinky_01_r"],
  ["mixamorigLeftHandPinky3", "pinky_02_l"],
  ["mixamorigRightHandPinky3", "pinky_02_r"],
  ["mixamorigLeftHandPinky4", "pinky_03_l"],
  ["mixamorigRightHandPinky4", "pinky_03_r"],
  ["mixamorigLeftToeBase", "ankle_fwd_l"],
  ["mixamorigRightToeBase", "ankle_fwd_r"],
]);

export const mixamoBonesRenaming: Step = {
  name: "mixamoBonesRenaming",
  action: (group: THREE.Group) => {
    const logs: LogMessage[] = [];

    const addRootBone: boolean = false;

    if (addRootBone) {
      const rootBone = new THREE.Bone();
      rootBone.name = "root";
      rootBone.rotation.x = -Math.PI * 0.5;
      let hipsBone = null;
      group.traverse((child) => {
        const asBone = child as THREE.Bone;
        if (asBone.isBone && child.name === "mixamorigHips") {
          hipsBone = child;
        }
      });
      if (hipsBone) {
        rootBone.add(hipsBone);
        group.add(rootBone);
        logs.push({
          level: "warn",
          message: "Added root bone and reparented mixamorigHips to it",
        });
      }
    }

    group.traverse((child) => {
      const asBone = child as THREE.Bone;
      if (asBone.isBone) {
        const newBoneName = mixamoBonesNamingMap.get(asBone.name);
        if (newBoneName) {
          asBone.name = newBoneName;
          logs.push({
            level: "info",
            message: `${asBone.name} -> ${newBoneName}`,
          });
        }
      }
    });

    group.traverse((child) => {
      const asBone = child as THREE.Bone;
      if (asBone.isBone) {
        if (!unrealBones.includes(asBone.name)) {
          let children =
            asBone.children.length > 0
              ? `Children: ${asBone.children.map((boneChild) => `${boneChild.name} `)}`
              : "LeafBone";
          if (children !== "LeafBone") {
            asBone.children.forEach((innerChild) => {
              asBone.parent?.add(innerChild);
              children = `${innerChild.name} added to ${asBone.parent?.name}`;
            });
          }
          logs.push({
            level: "warn",
            message: `${asBone.name} is not needed for the target Skeleton. ${children} `,
          });
        }
      }
    });

    if (logs.length === 0) {
      return {
        didApply: false,
        topLevelMessage: {
          level: "info",
          message: "No bones that need renaming found.",
        },
      };
    }

    return {
      didApply: true,
      topLevelMessage: {
        level: "info",
        message: "Some bones that needed renaming were found and renamed.",
      },
      logs: logs,
      autoOpenLogs: false,
    };
  },
};
