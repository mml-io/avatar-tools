import { ModelLoader } from "@mml-io/model-loader";
import { Group, LoadingManager, SkinnedMesh, Vector3 } from "three";
import { TGALoader } from "three/examples/jsm/loaders/TGALoader.js";

import { LoggerView } from "../logger/LoggerView";

import { createBoneHelpers } from "./debug-helpers/createBoneHelpers";
import { createSkeletonHelpers } from "./debug-helpers/createSkeletonHelpers";
import { Lights } from "./elements/Lights";
import { Room } from "./elements/Room";
import { createSkeletonLogFromGroup } from "./log-utils/bone-to-logs";
import { QuadrantScene } from "./QuadrantScene";
import styles from "./ui.module.css";

export class ImportView extends QuadrantScene {
  private readonly camOffset: Vector3 = new Vector3(0, 1.2, 0);
  private lights: Lights;
  private room: Room;
  private currentModel: Group | null = null;
  private debugCheckbox: HTMLInputElement;
  private debugCheckboxLabel: HTMLLabelElement;
  private debugGroup: Group;
  private loadingProgress: HTMLDivElement;

  constructor(
    private logger: LoggerView,
    private afterLoadCB: (model: Group | null, name: string) => void,
  ) {
    super();
    this.element.classList.add(styles.nwQuadrant);

    this.lights = new Lights(this.camOffset);
    this.scene.add(this.lights.ambientLight);
    this.scene.add(this.lights.mainLight);

    this.debugGroup = new Group();
    this.scene.add(this.debugGroup);

    this.loadingProgress = document.createElement("div");
    this.loadingProgress.textContent = "Importing...";
    this.loadingProgress.style.display = "none";
    this.loadingProgress.classList.add(styles.loadingProgress);
    this.element.append(this.loadingProgress);

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

    this.setupDragEvents();
  }

  private updateDebugVisibility() {
    this.debugGroup.visible = this.debugCheckbox.checked;
  }

  private setupDragEvents(): void {
    this.element.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    this.element.addEventListener("drop", (event) => {
      event.preventDefault();
      this.reset();
      this.loadingProgress.style.display = "flex";
      if (event.dataTransfer?.files) {
        const file = event.dataTransfer.files[0];
        // Strip extension from name
        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onloadend = async () => {
          this.reset();
          const data: ArrayBuffer = reader.result as ArrayBuffer;
          this.logger.log(`Loading ${file.name}`);
          await this.loadModelFromBuffer(data, nameWithoutExtension);
          this.loadingProgress.style.display = "none";
        };
      }
    });
  }

  private reset() {
    this.logger.reset();
    if (this.currentModel !== null) {
      this.scene.remove(this.currentModel);
    }
    this.afterLoadCB(null, "reset");
    this.debugGroup.clear();
    this.currentModel = null;
  }

  private async loadModelFromBuffer(buffer: ArrayBuffer, name: string): Promise<void> {
    const importViewLoadingManager = new LoadingManager();
    importViewLoadingManager.addHandler(/\.tga$/i, new TGALoader(importViewLoadingManager));
    const modelLoader = new ModelLoader(importViewLoadingManager);
    const { group } = await modelLoader.loadFromBuffer(buffer, "");

    if (group) {
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

      this.logger.logNestedLogMessage(createSkeletonLogFromGroup("Imported Skeleton", group));
      this.currentModel = group;
      this.scene.add(this.currentModel);
      this.fitCameraToGroup(this.currentModel);
    } else {
      console.error("Unable to load model");
      return;
    }

    const loadingManager = new LoadingManager();
    loadingManager.addHandler(/\.tga$/i, new TGALoader(loadingManager));
    let hasAssetsToLoad = false;
    loadingManager.onStart = () => {
      hasAssetsToLoad = true;
    };
    const didLoad = new Promise<void>((resolve) => {
      loadingManager.onLoad = () => {
        resolve();
      };
    });

    const exportViewModelLoader = new ModelLoader(loadingManager);
    const { group: pipelineGroup } = await exportViewModelLoader.loadFromBuffer(buffer, "");

    // Only wait for loading if there are assets to load
    if (hasAssetsToLoad) {
      // Wait for all resources to load - including (embedded) texture blobs
      await didLoad;
    }

    if (pipelineGroup) {
      this.afterLoadCB(pipelineGroup, name);
    } else {
      console.error("Unable to load model");
      return;
    }
  }
}
