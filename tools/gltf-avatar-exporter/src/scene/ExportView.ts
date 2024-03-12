import { correctionSteps, ModelLoader } from "gltf-avatar-export-lib";
import { AnimationClip, AnimationMixer, Group, SkinnedMesh, Vector3 } from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

import { LoggerView } from "../logger/LoggerView";

import { createBoneHelpers } from "./debug-helpers/createBoneHelpers";
import { createSkeletonHelpers } from "./debug-helpers/createSkeletonHelpers";
import { Lights } from "./elements/Lights";
import { Room } from "./elements/Room";
import { createSkeletonLogFromGroup } from "./log-utils/bone-to-logs";
import { QuadrantScene } from "./QuadrantScene";
import { TimeManager } from "./TimeManager";
import styles from "./ui.module.css";

export class ExportView extends QuadrantScene {
  private readonly camOffset: Vector3 = new Vector3(0, 1.2, 0);
  private lights: Lights;
  private room: Room;
  private currentModel: Group | null = null;
  private buffer: ArrayBuffer | null = null;
  private exportButton: HTMLButtonElement;
  private debugCheckbox: HTMLInputElement;
  private debugCheckboxLabel: HTMLLabelElement;
  private debugGroup: Group;

  private loadingProgress: HTMLDivElement;

  private currentAnimationClip: AnimationClip | null = null;
  private loadedAnimationState: {
    animationClip: AnimationClip;
    animationMixer: AnimationMixer;
  } | null = null;
  private name: string | null = null;

  constructor(
    private logger: LoggerView,
    private modelLoader: ModelLoader,
    private timeManager: TimeManager,
  ) {
    super();
    this.element.classList.add(styles.neQuadrant);

    this.lights = new Lights(this.camOffset);
    this.scene.add(this.lights.ambientLight);
    this.scene.add(this.lights.mainLight);

    this.loadingProgress = document.createElement("div");
    this.loadingProgress.textContent = "Processing...";
    this.loadingProgress.style.display = "none";
    this.loadingProgress.classList.add(styles.loadingProgress);
    this.element.append(this.loadingProgress);

    this.debugGroup = new Group();
    this.scene.add(this.debugGroup);

    this.exportButton = document.createElement("button");
    this.exportButton.classList.add(styles.button, styles.exportButton);
    this.exportButton.textContent = "Export";
    this.exportButton.addEventListener("click", () => {
      if (this.buffer !== null) {
        const blob = new Blob([this.buffer], { type: "application/octet-stream" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${this.name || "avatar"}.glb`;
        link.click();
      }
    });
    this.element.append(this.exportButton);

    this.debugCheckboxLabel = document.createElement("label");
    this.debugCheckboxLabel.classList.add(styles.debugCheckboxLabel);
    this.debugCheckboxLabel.textContent = "Debug";
    this.debugCheckbox = document.createElement("input");
    this.debugCheckbox.type = "checkbox";
    this.debugCheckbox.checked = true;
    this.debugCheckbox.addEventListener("change", () => {
      this.updateDebugVisibility();
    });
    this.debugCheckboxLabel.append(this.debugCheckbox);
    this.element.append(this.debugCheckboxLabel);
    this.debugGroup.visible = this.debugCheckbox.checked;

    this.room = new Room();
    this.scene.add(this.room);

    this.element.addEventListener("dragover", this.preventDragDrop);
    this.element.addEventListener("drop", this.preventDragDrop);
    this.element.addEventListener("dragover", this.preventDragDrop);
    this.element.addEventListener("drop", this.preventDragDrop);
  }

  private preventDragDrop = (event: DragEvent) => {
    event.preventDefault();
  };

  public async loadModelFromBuffer(buffer: ArrayBuffer, name: string): Promise<void> {
    this.buffer = buffer;
    this.name = name;
    const { group } = await this.modelLoader.loadFromBuffer(buffer, "");
    if (group) {
      this.logger.logNestedLogMessage(createSkeletonLogFromGroup("Export Skeleton", group));
      group.traverse((child) => {
        const asSkinnedMesh = child as SkinnedMesh;
        if (asSkinnedMesh.isSkinnedMesh) {
          asSkinnedMesh.receiveShadow = true;
          asSkinnedMesh.castShadow = true;
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

  public setImportedModelGroup(group: Group | null, name: string) {
    this.reset();
    if (group) {
      this.loadingProgress.style.display = "flex";
      for (const step of correctionSteps) {
        const stepResult = step.action(group);
        this.logger.logStepResult(step.name, stepResult);
      }

      new GLTFExporter().parse(
        group,
        async (gltf) => {
          await this.loadModelFromBuffer(gltf as ArrayBuffer, name);
          this.loadingProgress.style.display = "none";
        },
        (err) => {
          console.error("gltf error", err);
        },
        {
          binary: true,
        },
      );
    }
  }

  private updateDebugVisibility() {
    this.debugGroup.visible = this.debugCheckbox.checked;
  }

  public update(slowMotion: boolean) {
    if (this.loadedAnimationState !== null) {
      const dt = slowMotion ? this.timeManager.deltaTime * 0.25 : this.timeManager.deltaTime;
      this.loadedAnimationState.animationMixer.update(dt);
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
