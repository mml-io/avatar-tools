import { Material, Texture } from "three";
import * as THREE from "three";

import {
  lambertMaterialTextureKeys,
  phongMaterialTextureKeys,
  physicalMaterialTextureKeys,
  standardMaterialTextureKeys,
} from "./mapKeys";

export function forEachMapKey(
  material: Material,
  callback: (key: string, texture: Texture) => void,
) {
  if (material instanceof THREE.MeshLambertMaterial) {
    for (const key of lambertMaterialTextureKeys) {
      const texture = material[key];
      if (texture) {
        callback(key, texture);
      }
    }
  } else if (material instanceof THREE.MeshStandardMaterial) {
    for (const key of standardMaterialTextureKeys) {
      const texture = material[key];
      if (texture) {
        callback(key, texture);
      }
    }
  } else if (material instanceof THREE.MeshPhysicalMaterial) {
    for (const key of physicalMaterialTextureKeys) {
      const texture = material[key];
      if (texture) {
        callback(key, texture);
      }
    }
  } else if (material instanceof THREE.MeshPhongMaterial) {
    for (const key of phongMaterialTextureKeys) {
      const texture = material[key];
      if (texture) {
        callback(key, texture);
      }
    }
  }
}
