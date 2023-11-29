import { Group, SkinnedMesh, Vector3 } from "three";

import { LoggerView } from "../logger/LoggerView";

import { createBoneHelpers } from "./debug-helpers/createBoneHelpers";
import { createSkeletonHelpers } from "./debug-helpers/createSkeletonHelpers";
import { Lights } from "./elements/Lights";
import { Room } from "./elements/Room";
import { ModelLoader } from "./ModelLoader";
import { QuadrantScene } from "./QuadrantScene";

export class ImportView extends QuadrantScene {
  private readonly camOffset: Vector3 = new Vector3(0, 1.2, 0);
  private lights: Lights;
  private room: Room;
  private currentModel: Group | null = null;
  private debugCheckbox: HTMLInputElement;
  private debugGroup: Group;

  constructor(
    private logger: LoggerView,
    private modelLoader: ModelLoader,
    private afterLoadCB: (model: Group, name: string) => void,
  ) {
    super("nwQuadrant");
    this.lights = new Lights(this.camOffset);
    this.scene.add(this.lights.ambientLight);
    this.scene.add(this.lights.mainLight);
    this.debugGroup = new Group();
    this.scene.add(this.debugGroup);

    this.debugCheckbox = document.getElementById("import-view-debug-checkbox")! as HTMLInputElement;
    this.debugCheckbox.addEventListener("change", () => {
      this.updateDebugVisibility();
    });
    this.debugGroup.visible = this.debugCheckbox.checked;

    this.room = new Room();
    this.scene.add(this.room);

    this.setupDragEvents();
  }

  private setupDragEvents(): void {
    this.parentElement.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    this.parentElement.addEventListener("drop", (event) => {
      event.preventDefault();
      this.logger.reset();
      if (event.dataTransfer?.files) {
        const file = event.dataTransfer.files[0];
        // Strip extension from name
        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onloadend = () => {
          const data: ArrayBuffer = reader.result as ArrayBuffer;
          this.logger.log(`Loading ${file.name}`);
          this.loadModelFromBuffer(data, nameWithoutExtension);
        };
      }
    });
  }

  private reset() {
    if (this.currentModel !== null) {
      this.scene.remove(this.currentModel);
      this.currentModel = null;
    }
    this.debugGroup.clear();
  }

  private updateDebugVisibility() {
    this.debugGroup.visible = this.debugCheckbox.checked;
  }

  private async loadModelFromBuffer(buffer: ArrayBuffer, name: string): Promise<void> {
    const { group } = await this.modelLoader.loadFromBuffer(buffer, "");
    this.reset();
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
    } else {
      console.error("Unable to load model");
      return;
    }

    const { group: pipelineGroup } = await this.modelLoader.loadFromBuffer(buffer, "");
    if (pipelineGroup) {
      this.afterLoadCB(pipelineGroup, name);
    } else {
      console.error("Unable to load model");
      return;
    }
  }
}
