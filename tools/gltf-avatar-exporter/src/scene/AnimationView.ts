import { AnimationClip, AnimationMixer, Bone, SkeletonHelper, Vector3 } from "three";

// Jump animation for UE5 Manny exported as GLB from UE5
import sampleJumpAnimationBase64 from "../assets/SampleJumpAnimation.glb";

import { Lights } from "./elements/Lights";
import { Room } from "./elements/Room";
import { ModelLoader } from "./ModelLoader";
import { QuadrantScene } from "./QuadrantScene";

export class AnimationView extends QuadrantScene {
  private readonly camOffset: Vector3 = new Vector3(0, 1.2, 0);
  private lights: Lights;
  private room: Room;
  private loadedState: {
    rootBone: Bone;
    helper: SkeletonHelper;
    animationClip: AnimationClip;
    animationMixer: AnimationMixer;
  } | null = null;
  private clearAnimationButton: HTMLButtonElement;
  private useSampleAnimationButton: HTMLButtonElement;

  constructor(
    private modelLoader: ModelLoader,
    private onAnimationClipLoaded: (clip: AnimationClip | null) => void,
  ) {
    super("seQuadrant");
    this.lights = new Lights(this.camOffset);
    this.scene.add(this.lights.ambientLight);
    this.scene.add(this.lights.mainLight);

    this.room = new Room();
    this.scene.add(this.room);

    this.clearAnimationButton = document.getElementById(
      "clear-animation-button",
    )! as HTMLButtonElement;
    this.clearAnimationButton.addEventListener("click", () => {
      this.reset();
    });

    this.useSampleAnimationButton = document.getElementById(
      "sample-animation-button",
    )! as HTMLButtonElement;
    this.useSampleAnimationButton.addEventListener("click", () => {
      this.useSampleAnimation();
    });

    this.setupDragEvents();
  }

  private setupDragEvents(): void {
    this.parentElement.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    this.parentElement.addEventListener("drop", (event) => {
      event.preventDefault();
      if (event.dataTransfer?.files) {
        const file = event.dataTransfer.files[0];
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onloadend = () => {
          const data: ArrayBuffer = reader.result as ArrayBuffer;
          this.loadModelFromBuffer(data);
        };
      }
    });
  }

  public update() {
    if (this.loadedState) {
      this.loadedState.animationMixer.setTime(1);
    }
    super.update();
  }

  private reset() {
    if (this.loadedState) {
      this.scene.remove(this.loadedState.rootBone);
      this.scene.remove(this.loadedState.helper);
      this.loadedState.animationMixer.stopAllAction();
    }
    this.loadedState = null;
    this.onAnimationClipLoaded(null);
  }

  private async loadModelFromBuffer(buffer: ArrayBuffer): Promise<void> {
    this.reset();
    const { group, animations } = await this.modelLoader.loadFromBuffer(buffer, "");
    if (!animations || animations.length === 0) {
      console.error("Unable to find animations");
      return;
    }
    const rootBone = group.getObjectByName("root");
    if (!rootBone || !(rootBone instanceof Bone)) {
      console.error("Unable to find root bone");
      return;
    }
    this.scene.add(rootBone);
    const skeletonHelper = new SkeletonHelper(rootBone);
    this.scene.add(skeletonHelper);

    const firstAnimation = animations[0];
    const animationMixer = new AnimationMixer(rootBone);
    animationMixer.clipAction(firstAnimation).play();
    this.loadedState = {
      rootBone,
      helper: skeletonHelper,
      animationClip: firstAnimation,
      animationMixer,
    };
    this.onAnimationClipLoaded(firstAnimation);
  }

  private useSampleAnimation() {
    // Decode base64 string to ArrayBuffer in browser
    const base64String = sampleJumpAnimationBase64;
    const binaryString = window.atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    this.loadModelFromBuffer(bytes.buffer);
  }
}
