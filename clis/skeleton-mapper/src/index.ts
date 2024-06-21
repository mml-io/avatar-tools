import fs from "fs";

import { ModelLoader, ModelLoadResult } from "@mml-io/model-loader";
import { worldTriangleToDeltaXYZ } from "gltf-avatar-export-lib";
import * as THREE from "three";
import { LoadingManager } from "three";
import { TGALoader } from "three/examples/jsm/loaders/TGALoader.js";
import { setupPolyfills } from "threejs-nodejs-polyfills";

setupPolyfills(global);

function loadFile(file: string): Promise<ModelLoadResult> {
  return new Promise((resolve, reject) => {
    fs.readFile(file, async (readFileErr, fileBuffer) => {
      if (readFileErr) {
        console.error("Could not open file: %s", readFileErr);
        process.exit(1);
      }

      try {
        const asArrayBuffer = fileBuffer.buffer.slice(0);
        const loadingManager = new LoadingManager();
        loadingManager.addHandler(/\.tga$/i, new TGALoader(loadingManager));

        const modelLoader = new ModelLoader(loadingManager);
        resolve(await modelLoader.loadFromBuffer(asArrayBuffer, ""));
      } catch (error) {
        console.error("Error loading model:", error);
        process.exit(1);
      }
    });
  });
}

// const triangle = new THREE.Triangle(
//   new THREE.Vector3(0, 1, 0),
//   new THREE.Vector3(0, 0, 1),
//   new THREE.Vector3(1, 0, 0),
// );
// const worldPos = new THREE.Vector3(3, 0.5, 0);
// const deltaXYZ = worldTriangleToDeltaXYZ(triangle, worldPos);
// console.log({ deltaXYZ });
//
// const derivedPosition = deltaXYZAndTriangleToWorldPos(deltaXYZ, triangle);
// console.log({ derivedPosition });

function parseBones(root: THREE.Group): THREE.Bone[] {
  const bones: THREE.Bone[] = [];
  root.traverse((child) => {
    if ((child as THREE.Bone).isBone) {
      bones.push(child);
    }
  });
  return bones;
}

type BoneConfig = {
  boneName: string;
  boneConfig?: {
    sourceBones: { name: string; ratio: number }[];
    delta: { x: number; y: number; z: number };
    originalPosition: { x: number; y: number; z: number };
    originalRotation: { x: number; y: number; z: number };
  };
  children: Array<BoneConfig>;
};

(async () => {
  const ueSkeleton = await loadFile("./ue5_skeleton.glb");
  const mixamoSkeleton = await loadFile("./canonical_char.glb");

  const ueBones = parseBones(ueSkeleton.group);
  const mixamoBones = parseBones(mixamoSkeleton.group);

  const nearestN = 3;

  // console.log("Mixamo Skeleton has", mixamoBones.length, "bones");
  // console.log("UE Skeleton has", ueBones.length, "bones");

  const traverseChildren = (obj: THREE.Object3D): BoneConfig => {
    const ueBone = obj as THREE.Bone;
    const ueWorldPosition = new THREE.Vector3();
    ueBone.getWorldPosition(ueWorldPosition);

    const bonesByDistance: {
      bone: THREE.Bone;
      worldPosition: THREE.Vector3;
      distance: number;
    }[] = [];
    for (const mixamoBone of mixamoBones) {
      const mixamoWorldPosition = new THREE.Vector3();
      mixamoBone.getWorldPosition(mixamoWorldPosition);
      const distance = ueWorldPosition.distanceTo(mixamoWorldPosition);
      bonesByDistance.push({ bone: mixamoBone, worldPosition: mixamoWorldPosition, distance });
    }

    const nearestNBones = bonesByDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, nearestN);

    const totalDistance = nearestNBones.reduce((acc, b) => acc + b.distance, 0);

    const ratios = nearestNBones.map((b) => 1 / (b.distance / totalDistance));

    const totalRatio = ratios.reduce((acc, r) => acc + r, 0);
    ratios.forEach((r, index) => {
      ratios[index] = r / totalRatio;
    });

    // Determine the triangle of the three closest points

    const triangle = new THREE.Triangle(
      nearestNBones[0].worldPosition,
      nearestNBones[1].worldPosition,
      nearestNBones[2].worldPosition,
    );

    const deltaXYZ = worldTriangleToDeltaXYZ(triangle, ueWorldPosition);

    // Calculate the coordinates of the point of the bone based on the normal of the triangle plus the multiple of the area of the triangle in each axis (relative to the normal)

    // This creates a point that is relative to the triangle formed by the three closest points, but without a possibility that a single axis is zero and therefore cannot be multiplied

    // const derivedPosition = new THREE.Vector3();
    // for (let i = 0; i < nearestNBones.length; i++) {
    //   const mixamoBone = nearestNBones[i];
    //
    //   const mixamoWorldPosition = mixamoBone.worldPosition.clone().multiplyScalar(ratios[i]);
    //   derivedPosition.add(mixamoWorldPosition);
    // }

    // if (ueBone.name === "hand_r") {
    // console.log(
    //   "Nearest bones to",
    //   ueBone.name,
    //   ":",
    //   nearestNBones.map((b, index) => {
    //     return { name: b.bone.name, ratio: ratios[index] };
    //   }),
    // );
    // console.log("Derived position:", derivedPosition);
    // console.log("World position delta:", worldPositionDelta);
    // }

    const boneConfig = {
      sourceBones: nearestNBones.map((b, boneIndex) => {
        return {
          name: b.bone.name,
          ratio: ratios[boneIndex],
        };
      }),
      delta: {
        x: deltaXYZ.x,
        y: deltaXYZ.y,
        z: deltaXYZ.z,
      },
      originalPosition: {
        x: ueWorldPosition.x,
        y: ueWorldPosition.y,
        z: ueWorldPosition.z,
      },
      originalRotation: {
        x: ueBone.rotation.x,
        y: ueBone.rotation.y,
        z: ueBone.rotation.z,
      },
    };

    const childConfigs: Array<BoneConfig> = [];
    obj.children.forEach((child) => {
      childConfigs.push(traverseChildren(child));
    });

    return {
      boneName: obj.name,
      boneConfig,
      children: childConfigs,
    };
  };

  let rootBone;
  ueSkeleton.group.traverse((bone) => {
    if (bone.name === "root") {
      rootBone = bone;
    }
  });
  if (!rootBone) {
    throw new Error("Root bone not found");
  }

  const ueBoneConfigs = traverseChildren(rootBone);

  console.log(JSON.stringify(ueBoneConfigs, null, 2));
})();
