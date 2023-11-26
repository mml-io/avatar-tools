import * as THREE from "three";
import { Group } from "three";

export const createBoneHelpers = (group: Group) => {
  const boneHelpers = new THREE.Group();
  group.traverse((child) => {
    const asBone = child as THREE.Bone;
    if (asBone.isBone) {
      asBone.updateMatrixWorld(true);
      const debugAxes = new THREE.AxesHelper(0.25);
      debugAxes.matrix.copy(asBone.matrixWorld);
      debugAxes.matrixAutoUpdate = false;
      debugAxes.onBeforeRender = () => {
        debugAxes.matrix.copy(asBone.matrixWorld);
      };
      debugAxes.updateMatrixWorld(true);
      boneHelpers.add(debugAxes);
    }
  });

  return boneHelpers;
};
