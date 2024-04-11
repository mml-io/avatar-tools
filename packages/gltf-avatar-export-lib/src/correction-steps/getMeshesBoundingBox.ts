import * as THREE from "three";

export function getMeshesBoundingBox(group: THREE.Group): THREE.Box3 {
  const meshesBoundingBox = new THREE.Box3();
  group.traverse((child) => {
    const asSkinnedMesh = child as THREE.SkinnedMesh;
    if (asSkinnedMesh.isSkinnedMesh) {
      asSkinnedMesh.position.x = 0;
      asSkinnedMesh.position.y = 0;
      asSkinnedMesh.position.z = 0;
      asSkinnedMesh.rotation.x = 0;
      asSkinnedMesh.rotation.y = 0;
      asSkinnedMesh.rotation.z = 0;
      meshesBoundingBox.expandByObject(asSkinnedMesh);
    }
  });
  return meshesBoundingBox;
}
