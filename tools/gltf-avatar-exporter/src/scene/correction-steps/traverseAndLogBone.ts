import * as THREE from "three";

import { targetBoneTransformations } from "./targetBoneTransformations";

function toFixed(value: number) {
  const asFixed = value.toFixed(3);
  if (asFixed === "-0.000") {
    return "0.000";
  }
  return asFixed;
}

export function traverseAndLogBone(bone: THREE.Bone, depth = 0) {
  // print with indentation
  const indent = "-".repeat(depth);
  if (!bone) {
    console.error(`Error. Undefined bone`);
    return;
  }
  const target = targetBoneTransformations[bone.name];

  if (target === null || typeof target === "undefined") {
    console.error(`Error finding targetBoneTransformations for ${bone.name}`);
    return;
  }

  const targetPosStr = target.pos.map((n) => toFixed(n)).join(",");
  const posString = bone.position
    .toArray()
    .map((n) => toFixed(n))
    .join(",");

  const targetRotStr = target.rot.map((n) => toFixed(n)).join(",");
  const rotString = bone.quaternion
    .toArray()
    .map((n) => toFixed(n))
    .join(",");

  const targetAsEuler = new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion().fromArray(target.rot),
  );

  console.log(
    `${indent}${bone.name}, ${
      targetPosStr === posString ? "EXACTPOS" : `pos: ${posString}, targetPos: ${targetPosStr}`
    }, ${
      targetRotStr === rotString ? "EXACTROT" : `rot: ${rotString}, targetRot: ${targetRotStr}`
    }, targetEuler: ${targetAsEuler.x.toFixed(3)}, ${targetAsEuler.y.toFixed(
      3,
    )}, ${targetAsEuler.z.toFixed(3)}, euler: ${bone.rotation.x.toFixed(
      3,
    )}, ${bone.rotation.y.toFixed(3)}, ${bone.rotation.z.toFixed(3)}`,
  );

  for (const child of bone.children) {
    const asBone = child as THREE.Bone;
    if (asBone.isBone) {
      traverseAndLogBone(asBone, depth + 1);
    }
  }
}
