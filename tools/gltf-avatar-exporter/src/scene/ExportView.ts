import { AnimationClip, AnimationMixer, Group, SkinnedMesh, Vector3 } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

import { LoggerView } from "../logger/LoggerView";

import { correctionSteps } from "./correction-steps/runFixes";
import { createBoneHelpers } from "./debug-helpers/createBoneHelpers";
import { createSkeletonHelpers } from "./debug-helpers/createSkeletonHelpers";
import { Lights } from "./elements/Lights";
import { Room } from "./elements/Room";
import { ModelLoader } from "./ModelLoader";
import { QuadrantScene } from "./QuadrantScene";

export class ExportView extends QuadrantScene {
  private readonly camOffset: Vector3 = new Vector3(0, 1.2, 0);
  private lights: Lights;
  private room: Room;
  private currentModel: Group | null = null;
  private exportButton: HTMLButtonElement;
  private debugCheckbox: HTMLInputElement;
  private buffer: ArrayBuffer | null = null;
  private debugGroup: Group;

  private currentAnimationClip: AnimationClip | null = null;
  private loadedAnimationState: {
    animationClip: AnimationClip;
    animationMixer: AnimationMixer;
  } | null = null;
  private name: string | null = null;

  constructor(
    private logger: LoggerView,
    private modelLoader: ModelLoader,
  ) {
    super("neQuadrant");
    this.lights = new Lights(this.camOffset);
    this.scene.add(this.lights.ambientLight);
    this.scene.add(this.lights.mainLight);
    this.debugGroup = new Group();
    this.scene.add(this.debugGroup);

    this.exportButton = document.getElementById("export-button")! as HTMLButtonElement;
    this.exportButton.addEventListener("click", () => {
      if (this.buffer !== null) {
        const blob = new Blob([this.buffer], { type: "application/octet-stream" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${this.name || "avatar"}.glb`;
        link.click();
      }
    });
    this.debugCheckbox = document.getElementById("debug-checkbox")! as HTMLInputElement;
    this.debugCheckbox.addEventListener("change", () => {
      this.updateDebugVisibility();
    });
    this.debugGroup.visible = this.debugCheckbox.checked;

    this.room = new Room();
    this.scene.add(this.room);

    this.parentElement.addEventListener("dragover", this.preventDragDrop);
    this.parentElement.addEventListener("drop", this.preventDragDrop);
    this.parentElement.addEventListener("dragover", this.preventDragDrop);
    this.parentElement.addEventListener("drop", this.preventDragDrop);
  }

  private preventDragDrop = (event: DragEvent) => {
    event.preventDefault();
  };

  public async loadModelFromBuffer(buffer: ArrayBuffer, name: string): Promise<void> {
    this.buffer = buffer;
    this.name = name;
    const { group } = await this.modelLoader.loadFromBuffer(buffer, "");
    if (group) {
      group.traverse((child) => {
        if (child.type === "SkinnedMesh") {
          (child as SkinnedMesh).receiveShadow = true;
          (child as SkinnedMesh).castShadow = true;
        }
      });

      const skeletonHelpers = createSkeletonHelpers(group);
      this.debugGroup.add(skeletonHelpers);
      const boneHelpers = createBoneHelpers(group);
      this.debugGroup.add(boneHelpers);

      if (this.currentModel !== null) {
        this.scene.remove(this.currentModel);
        this.currentModel = null;
      }
      this.currentModel = group;
      this.scene.add(this.currentModel);
      this.fitCameraToGroup(this.currentModel);

      this.setAnimationClip(this.currentAnimationClip);
    } else {
      console.error("Unable to load model");
      return;
    }
  }

  private reset() {
    if (this.currentModel !== null) {
      this.scene.remove(this.currentModel);
      this.currentModel = null;
    }
    this.debugGroup.clear();
    this.buffer = null;
  }

  public setImportedModelGroup(group: Group, name: string) {
    this.reset();
    for (const step of correctionSteps) {
      const stepResult = step.action(group);
      this.logger.logStepResult(step.name, stepResult);
    }

    new GLTFExporter().parse(
      group,
      (gltf) => {
        this.loadModelFromBuffer(gltf as ArrayBuffer, name);
      },
      (err) => {
        console.error("gltf error", err);
      },
      {
        binary: true,
      },
    );
  }

  private updateDebugVisibility() {
    this.debugGroup.visible = this.debugCheckbox.checked;
  }

  public update() {
    if (this.loadedAnimationState !== null) {
      this.loadedAnimationState.animationMixer.setTime(Date.now() / 1000);
    }
    super.update();
  }

  setAnimationClip(clip: AnimationClip | null) {
    if (this.loadedAnimationState !== null) {
      this.loadedAnimationState.animationMixer.stopAllAction();
      this.loadedAnimationState.animationMixer.uncacheClip(this.loadedAnimationState.animationClip);
    }
    this.currentAnimationClip = clip;
    if (clip !== null && this.currentModel !== null) {
      this.loadedAnimationState = {
        animationClip: clip,
        animationMixer: new AnimationMixer(this.currentModel),
      };
      this.loadedAnimationState.animationMixer.clipAction(clip).play();
    } else {
      this.loadedAnimationState = null;
    }
  }
}
