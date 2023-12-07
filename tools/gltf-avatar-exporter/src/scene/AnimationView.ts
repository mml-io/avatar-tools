import { TimeManager } from "@mml-io/3d-web-client-core";
import { AnimationClip, AnimationMixer, Bone, SkeletonHelper, Vector3 } from "three";

// Jump animation for UE5 Manny exported as GLB from UE5
import sampleJumpAnimationBase64 from "../assets/SampleJumpAnimation.glb";

import { Lights } from "./elements/Lights";
import { Room } from "./elements/Room";
import { ModelLoader } from "./ModelLoader";
import { QuadrantScene } from "./QuadrantScene";
import styles from "./ui.module.css";

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
  private toggleSlowMotionButton: HTMLButtonElement;
  private useSampleAnimationButton: HTMLButtonElement;

  public slowMotion: boolean = false;
  private buttonHolder: HTMLDivElement;

  constructor(
    private modelLoader: ModelLoader,
    private onAnimationClipLoaded: (clip: AnimationClip | null) => void,
    private timeManager: TimeManager,
  ) {
    super();
    this.element.classList.add(styles.seQuadrant);
    this.lights = new Lights(this.camOffset);
    this.scene.add(this.lights.ambientLight);
    this.scene.add(this.lights.mainLight);

    this.room = new Room();
    this.scene.add(this.room);

    this.buttonHolder = document.createElement("div");
    this.buttonHolder.classList.add(styles.animationViewButtonHolder);
    this.element.append(this.buttonHolder);

    this.useSampleAnimationButton = document.createElement("button");
    this.useSampleAnimationButton.classList.add(styles.button);
    this.useSampleAnimationButton.textContent = "Use Sample Animation";
    this.useSampleAnimationButton.addEventListener("click", () => {
      this.useSampleAnimation();
    });
    this.buttonHolder.append(this.useSampleAnimationButton);

    this.toggleSlowMotionButton = document.createElement("button");
    this.toggleSlowMotionButton.classList.add(styles.button);
    this.toggleSlowMotionButton.textContent = "Toggle Slow Motion";
    this.toggleSlowMotionButton.addEventListener("click", () => {
      this.slowMotion = !this.slowMotion;
    });
    this.buttonHolder.append(this.toggleSlowMotionButton);

    this.clearAnimationButton = document.createElement("button");
    this.clearAnimationButton.classList.add(styles.button);
    this.clearAnimationButton.textContent = "Clear Animation";
    this.clearAnimationButton.addEventListener("click", () => {
      this.reset();
    });
    this.buttonHolder.append(this.clearAnimationButton);

    this.setupDragEvents();
  }

  private setupDragEvents(): void {
    this.element.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    this.element.addEventListener("drop", (event) => {
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
      const dt = this.slowMotion ? this.timeManager.deltaTime * 0.25 : this.timeManager.deltaTime;
      this.loadedState.animationMixer.update(dt);
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

    setTimeout(() => {
      skeletonHelper.geometry.computeBoundingBox();
      this.fitCameraToBoundingBox(skeletonHelper.geometry.boundingBox!);
    }, 100);

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
