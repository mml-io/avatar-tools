import { Bone, Group, Object3D } from "three";

import { NestedLogMessage } from "../../logger/LogMessageRow";

function boneToLogMessages(bone: Object3D): NestedLogMessage {
  const innerLogs: Array<NestedLogMessage> = [];
  innerLogs.push({ level: "info", message: `type: ${bone.type}` });
  innerLogs.push({
    level: "info",
    message: `pos: x: ${bone.position.x.toFixed(2)}, y: ${bone.position.y.toFixed(
      2,
    )}, z: ${bone.position.z.toFixed(2)}`,
  });
  innerLogs.push({
    level: "info",
    message: `rot: x: ${bone.rotation.x.toFixed(2)}, y: ${bone.rotation.y.toFixed(
      2,
    )}, z: ${bone.rotation.z.toFixed(2)}`,
  });
  innerLogs.push({
    level: "info",
    message: `quat: x: ${bone.quaternion.x.toFixed(2)}, y: ${bone.quaternion.y.toFixed(
      2,
    )}, z: ${bone.quaternion.z.toFixed(2)} w: ${bone.quaternion.w.toFixed(2)}`,
  });
  innerLogs.push({
    level: "info",
    message: `scale: ${bone.scale.x.toFixed(2)}, y: ${bone.scale.y.toFixed(
      2,
    )}, z: ${bone.scale.z.toFixed(2)}`,
  });
  for (const child of bone.children) {
    const childAsBone = child as Bone;
    if (childAsBone.isBone) {
      innerLogs.push(boneToLogMessages(childAsBone));
    }
  }
  const logMessage: NestedLogMessage = {
    level: "info",
    message: bone.name,
    messages: innerLogs,
  };
  return logMessage;
}

export function createSkeletonLogFromGroup(name: string, group: Group): NestedLogMessage {
  const rootBone = group.getObjectByName("root");
  if (!rootBone) {
    return {
      message: `${name} - No root bone found`,
      level: "error",
    };
  }
  return {
    message: name,
    level: "info",
    messages: [boneToLogMessages(rootBone)],
  };
}
