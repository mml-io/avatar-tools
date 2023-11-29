import * as THREE from "three";
import { Group } from "three";

import { reposeSkinnedMeshes } from "./reposeSkinnedMeshes";
import { targetBoneTransformations } from "./targetBoneTransformations";
import { LogMessage, Step } from "./types";

export const checkBonesStep: Step = {
  name: "checkBones",
  action: (group: Group) => {
    const rootBone = group.getObjectByName("root") as THREE.Bone;
    if (!rootBone) {
      return {
        didApply: true,
        topLevelMessage: {
          level: "error",
          message: "Could not find root bone. Cannot check bones.",
        },
      };
    }

    const logs: Array<LogMessage> = [];

    function checkBone(bone: THREE.Bone) {
      const target = targetBoneTransformations[bone.name]!;
      if (!target) {
        logs.push({
          level: "error",
          message: `Bone in imported model not found in target skeleton: ${bone.name}.`,
        });
      }

      const targetQuaternion = new THREE.Quaternion().fromArray(target.rot);
      const targetAsEuler = new THREE.Euler().setFromQuaternion(targetQuaternion);
      const targetEulerStr = `${targetAsEuler.x.toFixed(3)}, ${targetAsEuler.y.toFixed(
        3,
      )}, ${targetAsEuler.z.toFixed(3)}`;

      const eulerStr = `${bone.rotation.x.toFixed(3)}, ${bone.rotation.y.toFixed(
        3,
      )}, ${bone.rotation.z.toFixed(3)}`;

      const dot = Math.abs(bone.quaternion.dot(targetQuaternion));
      const isTolerableRotation = dot > 0.75;
      if (!isTolerableRotation) {
        logs.push({
          level: "warn",
          message: `Bone ${bone.name} has a rotation that is not close to the target rotation. Target: ${targetEulerStr}, actual: ${eulerStr}.`,
        });
      }

      const targetChildrenNames = new Set(target.children);
      const actualChildrenNames = bone.children
        .filter((child) => {
          const asBone = child as THREE.Bone;
          return asBone.isBone;
        })
        .map((child) => child.name);

      const missingChildren = target.children.filter(
        (child) => !actualChildrenNames.includes(child),
      );
      const extraChildren = actualChildrenNames.filter((child) => !targetChildrenNames.has(child));

      if (missingChildren.length > 0) {
        logs.push({
          level: "warn",
          message: `Bone ${bone.name} is missing children: ${missingChildren.join(", ")}.`,
        });
      }
      if (extraChildren.length > 0) {
        logs.push({
          level: "warn",
          message: `Bone ${bone.name} has extra children: ${extraChildren.join(", ")}.`,
        });
      }

      for (const child of bone.children) {
        const asBone = child as THREE.Bone;
        if (asBone.isBone) {
          checkBone(asBone);
        }
      }
    }

    checkBone(rootBone);

    const errors = logs.filter((log) => log.level === "error");
    const warns = logs.filter((log) => log.level === "warn");

    const hasErrorsOrWarns = errors.length > 0 || warns.length > 0;
    if (!hasErrorsOrWarns) {
      return {
        didApply: false,
        topLevelMessage: {
          level: "info",
          message: "All bones found and at approximate target rotations.",
        },
        autoOpenLogs: false,
        logs,
      };
    }

    reposeSkinnedMeshes(group);

    return {
      didApply: true,
      topLevelMessage: {
        level: "error",
        message: "Detected issues with bone positions and rotations. See logs below for details.",
      },
      autoOpenLogs: true,
      logs,
    };
  },
};