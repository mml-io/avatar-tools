import * as THREE from "three";
import { Group } from "three";

export const createSkeletonHelpers = (group: Group) => {
  const skeletonHelpers = new THREE.Group();
  group.traverse((child) => {
    const asSkinnedMesh = child as THREE.SkinnedMesh;
    if (asSkinnedMesh.isSkinnedMesh) {
      asSkinnedMesh.updateMatrixWorld(true);
      const skeletonHelper = new THREE.SkeletonHelper(asSkinnedMesh.skeleton.bones[0]);
      skeletonHelpers.add(skeletonHelper);
    }
  });

  return skeletonHelpers;
};
