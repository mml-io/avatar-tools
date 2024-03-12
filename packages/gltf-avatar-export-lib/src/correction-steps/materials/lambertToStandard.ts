import * as THREE from "three";

export function convertLambertToStandard(
  material: THREE.MeshLambertMaterial,
): THREE.MeshStandardMaterial {
  // Create a new MeshStandardMaterial
  const standardMaterial = new THREE.MeshStandardMaterial();

  // Common properties
  standardMaterial.name = material.name;
  standardMaterial.color.copy(material.color);
  standardMaterial.map = material.map;
  standardMaterial.lightMap = material.lightMap;
  standardMaterial.lightMapIntensity = material.lightMapIntensity;
  standardMaterial.aoMap = material.aoMap;
  standardMaterial.aoMapIntensity = material.aoMapIntensity;
  standardMaterial.emissive.copy(material.emissive);
  standardMaterial.emissiveMap = material.emissiveMap;
  standardMaterial.emissiveIntensity = material.emissiveIntensity;
  standardMaterial.alphaMap = material.alphaMap;
  standardMaterial.envMap = material.envMap;
  standardMaterial.wireframe = material.wireframe;
  standardMaterial.wireframeLinewidth = material.wireframeLinewidth;
  standardMaterial.flatShading = material.flatShading;
  standardMaterial.side = material.side;
  standardMaterial.vertexColors = material.vertexColors;
  standardMaterial.fog = material.fog;
  standardMaterial.blending = material.blending;
  standardMaterial.opacity = material.opacity;
  standardMaterial.transparent = material.transparent;
  standardMaterial.depthTest = material.depthTest;
  standardMaterial.depthWrite = material.depthWrite;
  standardMaterial.alphaTest = material.alphaTest;
  standardMaterial.normalMap = material.normalMap;
  standardMaterial.normalMapType = material.normalMapType;
  standardMaterial.normalScale.copy(material.normalScale);

  return standardMaterial;
}
