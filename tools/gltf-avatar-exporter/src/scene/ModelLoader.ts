import { AnimationClip, Group } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const textDecoder = new TextDecoder();

function convertArrayBufferToString(buffer: ArrayBuffer, from?: number, to?: number) {
  if (from === undefined) {
    from = 0;
  }
  if (to === undefined) {
    to = buffer.byteLength;
  }

  return textDecoder.decode(new Uint8Array(buffer, from, to));
}

function IsFBXBinary(buffer: ArrayBuffer): boolean {
  const CORRECT = "Kaydara\u0020FBX\u0020Binary\u0020\u0020\0";
  return (
    buffer.byteLength >= CORRECT.length &&
    CORRECT === convertArrayBufferToString(buffer, 0, CORRECT.length)
  );
}

function isFbxFormatASCII(text: string): boolean {
  const CORRECT = [
    "K",
    "a",
    "y",
    "d",
    "a",
    "r",
    "a",
    "\\",
    "F",
    "B",
    "X",
    "\\",
    "B",
    "i",
    "n",
    "a",
    "r",
    "y",
    "\\",
    "\\",
  ];
  let cursor = 0;

  function read(offset: number) {
    const result = text[offset - 1];
    text = text.slice(cursor + offset);
    cursor++;
    return result;
  }

  for (let i = 0; i < CORRECT.length; ++i) {
    const num = read(1);
    if (num !== CORRECT[i]) {
      return false;
    }
  }

  return true;
}

const BINARY_EXTENSION_HEADER_MAGIC = "glTF";

export class ModelLoader {
  private gltfLoader = new GLTFLoader();
  private fbxLoader = new FBXLoader();

  async loadFromBuffer(
    buffer: ArrayBuffer,
    pathName: string,
  ): Promise<{ group: Group; animations?: Array<AnimationClip> }> {
    if (IsFBXBinary(buffer)) {
      console.log("Loading FBX binary");
      const group = this.fbxLoader.parse(buffer, pathName);
      return { group };
    }

    const gltfMagic = textDecoder.decode(new Uint8Array(buffer, 0, 4));
    if (gltfMagic === BINARY_EXTENSION_HEADER_MAGIC) {
      console.log("Loading GLTF binary");
      return new Promise((resolve, reject) => {
        this.gltfLoader.parse(
          buffer,
          pathName,
          (gltf: GLTF) => {
            resolve({ group: gltf.scene, animations: gltf.animations });
          },
          (err) => {
            reject(err);
          },
        );
      });
    }

    const text = convertArrayBufferToString(buffer);
    if (isFbxFormatASCII(text)) {
      console.log("Loading FBX text");
      const group = this.fbxLoader.parse(text, pathName);
      return { group };
    }

    console.log("Loading GLTF text");
    return new Promise<{ group: Group; animations?: Array<AnimationClip> }>((resolve, reject) => {
      this.gltfLoader.parse(
        buffer,
        pathName,
        (gltf: GLTF) => {
          resolve({ group: gltf.scene, animations: gltf.animations });
        },
        (err) => {
          reject(err);
        },
      );
    });
  }
}
