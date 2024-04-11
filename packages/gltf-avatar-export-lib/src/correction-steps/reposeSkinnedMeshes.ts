import * as THREE from "three";

export function reposeSkinnedMeshes(group: THREE.Group) {
  // This function forces skeletons to recalculate the matrices of their bones (after bones have potentially changed)

  group.traverse((child) => {
    const asSkinnedMesh = child as THREE.SkinnedMesh;
    if (asSkinnedMesh.isSkinnedMesh) {
      asSkinnedMesh.bindMatrix.identity();
      asSkinnedMesh.bindMatrixInverse.identity().invert();

      const skeleton = asSkinnedMesh.skeleton;
      skeleton.calculateInverses();
      skeleton.pose();
    }
  });
}
