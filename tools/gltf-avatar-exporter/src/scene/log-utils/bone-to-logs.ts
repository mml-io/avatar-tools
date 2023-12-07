import { Bone, Group, Object3D } from "three";

import { NestedLogMessage } from "../../logger/LogMessageRow";

function boneToLogMessages(bone: Object3D): NestedLogMessage {
  const innerLogs: Array<NestedLogMessage> = [];
  const bonePosition = bone.position.toArray().toString();
  const boneRotation = bone.rotation.toArray().toString();
  const boneQuaternion = bone.quaternion.toArray().toString();
  const boneScale = bone.scale.toArray().toString();
  innerLogs.push({ level: "info", message: `type: ${bone.type}` });
  innerLogs.push({ level: "info", message: `pos: ${bonePosition}` });
  innerLogs.push({ level: "info", message: `rot: ${boneRotation}` });
  innerLogs.push({ level: "info", message: `quat: ${boneQuaternion}` });
  innerLogs.push({ level: "info", message: `scale: ${boneScale}` });
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
