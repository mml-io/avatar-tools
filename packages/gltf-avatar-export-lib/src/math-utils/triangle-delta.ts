import * as THREE from "three";

function getTriangleRotation(triangle: THREE.Triangle): THREE.Matrix4 {
  // Get the vertices of the triangle
  const { a, b, c } = triangle;

  const edge1 = new THREE.Vector3().subVectors(b, a);

  const triangleNormal = triangle.getNormal(new THREE.Vector3());
  const yAxis = triangleNormal.clone().normalize();

  // The local x-axis will be edge1 normalized
  const xAxis = edge1.clone().normalize();

  const zAxis = new THREE.Vector3().crossVectors(yAxis, xAxis).normalize();

  // Create the rotation matrix from the local axes
  const rotationMatrix = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);

  return rotationMatrix;
}

export function worldTriangleToDeltaXYZ(worldTriangle: THREE.Triangle, worldPos: THREE.Vector3) {
  const centerOfTriangle = new THREE.Vector3();
  worldTriangle.getMidpoint(centerOfTriangle);

  const triangleRotationMatrix = getTriangleRotation(worldTriangle);

  const fromTriangleCenter = worldPos.clone().sub(centerOfTriangle);

  const asMatrix = new THREE.Matrix4().setPosition(fromTriangleCenter);

  const inverseMatrix = asMatrix.multiply(triangleRotationMatrix.clone().invert());

  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  inverseMatrix.decompose(position, new THREE.Quaternion(), scale);

  const longestEdge = Math.max(
    worldTriangle.a.distanceTo(worldTriangle.b),
    worldTriangle.b.distanceTo(worldTriangle.c),
    worldTriangle.c.distanceTo(worldTriangle.a),
  );

  const asMultipleOfLength = position.clone().divideScalar(longestEdge);

  return asMultipleOfLength;
}

export function deltaXYZAndTriangleToWorldPos(
  deltaXYZ: THREE.Vector3,
  worldTriangle: THREE.Triangle,
) {
  const centerOfTriangle = new THREE.Vector3();
  worldTriangle.getMidpoint(centerOfTriangle);

  const longestEdge = Math.max(
    worldTriangle.a.distanceTo(worldTriangle.b),
    worldTriangle.b.distanceTo(worldTriangle.c),
    worldTriangle.c.distanceTo(worldTriangle.a),
  );

  const matrixForNormal = getTriangleRotation(worldTriangle);

  const matrixForWorldPosition = new THREE.Matrix4().setPosition(
    deltaXYZ.multiplyScalar(longestEdge),
  );

  matrixForWorldPosition.multiply(matrixForNormal);

  const derivedPosition = new THREE.Vector3();
  matrixForWorldPosition.decompose(derivedPosition, new THREE.Quaternion(), new THREE.Vector3());

  derivedPosition.add(centerOfTriangle);

  return derivedPosition;
}
