import * as THREE from "three";

import { LogMessage, Step } from "./types";

const boneNamesMap = new Map<string, string>([
  // Add more bone names here
  ["Hips", "pelvis"],
  ["Spine", "spine_01"],
  ["Spine1", "spine_02"],
  ["Spine2", "spine_03"],
  ["Neck", "neck_01"],
  ["Head", "head"],
  ["HeadTop_End", "end"],
  ["LeftShoulder", "clavicle_l"],
  ["RightShoulder", "clavicle_r"],
  ["LeftArm", "upperarm_l"],
  ["RightArm", "upperarm_r"],
  ["LeftForeArm", "lowerarm_l"],
  ["RightForeArm", "lowerarm_r"],
  ["LeftHand", "hand_l"],
  ["RightHand", "hand_r"],
  ["LeftUpLeg", "thigh_l"],
  ["RightUpLeg", "thigh_r"],
  ["LeftLeg", "calf_l"],
  ["RightLeg", "calf_r"],
  ["LeftFoot", "foot_l"],
  ["RightFoot", "foot_r"],
  ["LeftToe_End", "ball_l"],
  ["RightToe_End", "ball_r"],

  ["LeftHandThumb1", "thumb_01_l"],
  ["RightHandThumb1", "thumb_01_r"],
  ["LeftHandThumb2", "thumb_02_l"],
  ["RightHandThumb2", "thumb_02_r"],
  ["LeftHandThumb3", "thumb_03_l"],
  ["LeftHandThumb4", "thumb_04_l"],
  ["RightHandThumb3", "thumb_03_r"],
  ["RightHandThumb4", "thumb_04_r"],

  ["LeftHandIndex1", "index_metacarpal_l"],
  ["RightHandIndex1", "index_metacarpal_r"],
  ["LeftHandIndex2", "index_01_l"],
  ["RightHandIndex2", "index_01_r"],
  ["LeftHandIndex3", "index_02_l"],
  ["LeftHandIndex4", "index_03_l"],
  ["RightHandIndex3", "index_02_r"],
  ["RightHandIndex4", "index_03_r"],

  ["LeftHandMiddle1", "middle_metacarpal_l"],
  ["RightHandMiddle1", "middle_metacarpal_r"],
  ["LeftHandMiddle2", "middle_01_l"],
  ["RightHandMiddle2", "middle_01_r"],
  ["LeftHandMiddle3", "middle_02_l"],
  ["LeftHandMiddle4", "middle_03_l"],
  ["RightHandMiddle3", "middle_02_r"],
  ["RightHandMiddle4", "middle_03_r"],

  ["LeftHandRing1", "ring_metacarpal_l"],
  ["RightHandRing1", "ring_metacarpal_r"],
  ["LeftHandRing2", "ring_01_l"],
  ["RightHandRing2", "ring_01_r"],
  ["LeftHandRing3", "ring_02_l"],
  ["LeftHandRing4", "ring_03_l"],
  ["RightHandRing3", "ring_02_r"],
  ["RightHandRing4", "ring_03_r"],

  ["LeftHandPinky1", "pinky_metacarpal_l"],
  ["RightHandPinky1", "pinky_metacarpal_r"],
  ["LeftHandPinky2", "pinky_01_l"],
  ["RightHandPinky2", "pinky_02_r"],
  ["LeftHandPinky3", "pinky_02_l"],
  ["LeftHandPinky4", "pinky_03_l"],
  ["RightHandPinky3", "pinky_02_r"],
  ["RightHandPinky4", "pinky_03_r"],

  ["LeftToeBase", "ankle_fwd_l"],
  ["RightToeBase", "ankle_fwd_r"],
]);

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

const vrmBoneNamesMap = new Map<string, string>([
  ["Root", "root"],
  ["J_Bip_C_Hips", "pelvis"],
  ["J_Bip_C_Spine", "spine_01"],
  ["J_Bip_C_Chest", "spine_02"],
  ["J_Bip_C_UpperChest", "spine_03"],
  ["J_Bip_C_Neck", "neck_01"],
  ["J_Bip_C_Head", "head"],
  ["J_Bip_L_Shoulder", "clavicle_l"],
  ["J_Bip_L_UpperArm", "upperarm_l"],
  ["J_Bip_L_LowerArm", "lowerarm_l"],
  ["J_Bip_L_Hand", "hand_l"],
  ["J_Bip_L_Index1", "index_metacarpal_l"],
  ["J_Bip_L_Little1", "pinky_metacarpal_l"],
  ["J_Bip_L_Middle1", "middle_metacarpal_l"],
  ["J_Bip_L_Ring1", "ring_metacarpal_l"],
  ["J_Bip_L_Thumb1", "thumb_01_l"],
  ["J_Bip_L_Index2", "index_01_l"],
  ["J_Bip_L_Index3", "index_02_l"],
  ["J_Bip_L_Little2", "pinky_01_l"],
  ["J_Bip_L_Little3", "pinky_02_l"],
  ["J_Bip_L_Middle2", "middle_01_l"],
  ["J_Bip_L_Middle3", "middle_02_l"],
  ["J_Bip_L_Ring2", "ring_01_l"],
  ["J_Bip_L_Ring3", "ring_02_l"],
  ["J_Bip_L_Thumb2", "thumb_02_l"],
  ["J_Bip_L_Thumb3", "thumb_03_l"],
  ["J_Bip_R_Shoulder", "clavicle_r"],
  ["J_Bip_R_UpperArm", "upperarm_r"],
  ["J_Bip_R_LowerArm", "lowerarm_r"],
  ["J_Bip_R_Hand", "hand_r"],
  ["J_Bip_R_Index1", "index_metacarpal_r"],
  ["J_Bip_R_Little1", "pinky_metacarpal_r"],
  ["J_Bip_R_Middle1", "middle_metacarpal_r"],
  ["J_Bip_R_Ring1", "ring_metacarpal_r"],
  ["J_Bip_R_Thumb1", "thumb_01_r"],
  ["J_Bip_R_Index2", "index_01_r"],
  ["J_Bip_R_Index3", "index_02_r"],
  ["J_Bip_R_Little2", "pinky_01_r"],
  ["J_Bip_R_Little3", "pinky_02_r"],
  ["J_Bip_R_Middle2", "middle_01_r"],
  ["J_Bip_R_Middle3", "middle_02_r"],
  ["J_Bip_R_Ring2", "ring_01_r"],
  ["J_Bip_R_Ring3", "ring_02_r"],
  ["J_Bip_R_Thumb2", "thumb_02_r"],
  ["J_Bip_R_Thumb3", "thumb_03_r"],
  ["J_Bip_L_UpperLeg", "thigh_l"],
  ["J_Bip_L_LowerLeg", "calf_l"],
  ["J_Bip_L_Foot", "foot_l"],
  ["J_Bip_L_ToeBase", "ball_l"],
  ["J_Bip_R_UpperLeg", "thigh_r"],
  ["J_Bip_R_LowerLeg", "calf_r"],
  ["J_Bip_R_Foot", "foot_r"],
  ["J_Bip_R_ToeBase", "ball_r"],
]);

export const bonesRenaming: Step = {
  name: "globalBonesRenaming",
  action: (group: THREE.Group) => {
    const logs: LogMessage[] = [];

    let boneNames: Map<string, string> = boneNamesMap;
    let hasUnrealSkeleton: boolean = false;

    //Find skeleton type
    group.traverse((object) => {
      if (object instanceof THREE.Bone) {
        if (object.name === "root" || object.name === "pelvis") {
          hasUnrealSkeleton = true;
          return;
        } else if (object.name.startsWith("mixamo")) {
          boneNames = mixamoBonesNamingMap;
          return;
        } else if (object.name.startsWith("J_Bip")) {
          boneNames = vrmBoneNamesMap;
          return;
        }
      }
    });

    //newNames = boneNamesMap;
    //if it doesn't have a Unreal Skeleton
    if (!hasUnrealSkeleton) {
      group.traverse((object) => {
        if (object instanceof THREE.Bone) {
          const newName = boneNames.get(object.name);
          if (newName) {
            logs.push({
              level: "info",
              message: `${object.name} -> ${newName}`,
            });
            object.name = newName;
          }
          //test orient

          // const newOrientation = new THREE.Quaternion().setFromAxisAngle(
          //   new THREE.Vector3(1, 0, 0),
          //   THREE.MathUtils.degToRad(90), // Adjust this angle as needed
          // );
          // object.quaternion.multiplyQuaternions(newOrientation, object.quaternion);

          // const [x, y, z, w] = object.quaternion.toArray();
          // object.quaternion.set(x, -y, z ,w);
          // object.updateMatrixWorld(true);
          //test orient
        }
      });
    }

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
