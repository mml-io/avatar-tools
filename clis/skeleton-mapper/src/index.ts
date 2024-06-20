import fs from "fs";

import { ModelLoader, ModelLoadResult } from "@mml-io/model-loader";
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

  const nearestN = 4;

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

    const derivedPosition = new THREE.Vector3();
    for (let i = 0; i < nearestNBones.length; i++) {
      const mixamoBone = nearestNBones[i];

      const mixamoWorldPosition = mixamoBone.worldPosition.clone().multiplyScalar(ratios[i]);
      derivedPosition.add(mixamoWorldPosition);
    }

    const worldPositionDelta = ueWorldPosition.clone().sub(derivedPosition);

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
        x: worldPositionDelta.x,
        y: worldPositionDelta.y,
        z: worldPositionDelta.z,
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

// function alignSkeletons(canonical: THREE.Skeleton, ue: THREE.Skeleton) {
//   const boneMapping = new Map<THREE.Bone, THREE.Bone>();
//
//   canonical.bones.forEach((canonicalBone) => {
//     let closestBone: THREE.Bone | null = null;
//     let closestDistance = Infinity;
//
//     ue.bones.forEach((ueBone) => {
//       const distance = canonicalBone.position.distanceTo(ueBone.position);
//       if (distance < closestDistance) {
//         closestDistance = distance;
//         closestBone = ueBone;
//       }
//     });
//
//     if (closestBone) {
//       boneMapping.set(canonicalBone, closestBone);
//     }
//   });
//
//   boneMapping.forEach((ueBone, canonicalBone) => {
//     ueBone.position.copy(canonicalBone.position);
//     //ueBone.quaternion.copy(canonicalBone.quaternion);
//     ueBone.scale.copy(canonicalBone.scale);
//   });
//
//   canonical.update();
//   ue.update();
// }
//
// function applyTransformations(skeleton: THREE.Skeleton) {
//   skeleton.bones.forEach((bone) => {
//     bone.updateMatrixWorld(true);
//   });
// }
//
// function exportSkeleton(skeleton: THREE.Skeleton) {
//   const scene = new THREE.Scene();
//   skeleton.bones.forEach((bone) => scene.add(bone));
//
//   const options = {
//     binary: true,
//   };
//
//   exporter.parse(
//     scene,
//     (result) => {
//       if (result instanceof ArrayBuffer) {
//         console.log("Export successful. Result is an ArrayBuffer:", result);
//
//         // Proceed with blob creation and download
//         const blob = new Blob([result], { type: "application/octet-stream" });
//         const url = URL.createObjectURL(blob);
//         const link = document.createElement("a");
//         link.href = url;
//         link.download = "posed_skeleton.glb";
//         link.click();
//       } else {
//         console.error("Error exporting the model. Result is not an ArrayBuffer.");
//       }
//     },
//     options as any,
//   );
// }
