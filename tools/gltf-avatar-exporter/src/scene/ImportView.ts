import { Group, SkinnedMesh, Vector3 } from "three";

import { LoggerView } from "../logger/LoggerView";

import { Lights } from "./elements/Lights";
import { Room } from "./elements/Room";
import { ModelLoader } from "./ModelLoader";
import { QuadrantScene } from "./QuadrantScene";

export class ImportView extends QuadrantScene {
  private readonly camOffset: Vector3 = new Vector3(0, 1.2, 0);
  private lights: Lights;
  private room: Room;
  private currentModel: Group | null = null;

  constructor(
    private logger: LoggerView,
    private modelLoader: ModelLoader,
    private afterLoadCB: (model: Group, name: string) => void,
  ) {
    super("nwQuadrant");
    this.lights = new Lights(this.camOffset);
    this.scene.add(this.lights.ambientLight);
    this.scene.add(this.lights.mainLight);

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

  private async loadModelFromBuffer(buffer: ArrayBuffer, name: string): Promise<void> {
    const { group } = await this.modelLoader.loadFromBuffer(buffer, "");
    if (group) {
      group.traverse((child) => {
        if (child.type === "SkinnedMesh") {
          (child as SkinnedMesh).receiveShadow = true;
          (child as SkinnedMesh).castShadow = true;
        }
      });
      if (this.currentModel !== null) {
        this.scene.remove(this.currentModel);
        this.currentModel = null;
      }
      this.currentModel = group;
      this.scene.add(this.currentModel);
      setTimeout(() => this.fitCameraToGroup(this.currentModel!), 1000);
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
