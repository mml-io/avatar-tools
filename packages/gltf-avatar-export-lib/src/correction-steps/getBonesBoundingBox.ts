import * as THREE from "three";

export function getBonesBoundingBox(group: THREE.Group) {
  const bonesBoundingBox = new THREE.Box3();
  group.traverse((child) => {
    const asBone = child as THREE.Bone;
    if (asBone.isBone) {
      const tempVector = new THREE.Vector3();
      asBone.getWorldPosition(tempVector);
      bonesBoundingBox.expandByPoint(tempVector);
    }
  });
  return bonesBoundingBox;
}
