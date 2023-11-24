import { ModelLoader } from "@mml-io/3d-web-avatar";
import { Group, SkinnedMesh, Vector3 } from "three";

import { Logger } from "../logger/Logger";

import { Lights } from "./elements/Lights";
import { Room } from "./elements/Room";
import { QuadrantScene } from "./QuadrantScene";

export class NWQuadrant extends QuadrantScene {
  private readonly camOffset: Vector3 = new Vector3(0, 1.2, 0);
  private lights: Lights;
  private room: Room;
  private fileName: string | null = null;
  private currentModel: Group | null = null;

  constructor(
    private logger: Logger,
    private modelLoader: ModelLoader,
    private afterLoadCB: (model: Group) => void,
  ) {
    super("nwQuadrant");
    this.lights = new Lights(this.camOffset);
    this.scene.add(this.lights.ambientLight);
    this.scene.add(this.lights.mainLight);

    this.room = new Room();
    this.scene.add(this.room);

    this.setupDragEvents = this.setupDragEvents.bind(this);
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
        const fileName = file.name;
        const extension = file.name.split(".").pop();
        if (extension && ["gltf", "glb", "fbx"].includes(extension) && fileName !== this.fileName) {
          const reader = new FileReader();
          reader.readAsArrayBuffer(file);
          reader.onloadend = () => {
            this.fileName = fileName;
            const data: ArrayBuffer = reader.result as ArrayBuffer;
            if (extension === "glb") {
              this.logger.log(`Loading ${file.name}`);
              this.loadModelFromBuffer(data);
            }
          };
        } else if (fileName === this.fileName) {
          console.error("Error: trying to load the same file twice");
        }
      }
    });
  }

  private async loadModelFromBuffer(buffer: ArrayBuffer): Promise<void> {
    const blob = new Blob([buffer], { type: "model/gltf-binary" });
    const url = URL.createObjectURL(blob);
    const model = await this.modelLoader.load(url);
    if (model) {
      model?.scene.traverse((child) => {
        if (child.type === "SkinnedMesh") {
          (child as SkinnedMesh).receiveShadow = true;
          (child as SkinnedMesh).castShadow = true;
          this.logger.log(`Enabling shadows for mesh: ${child.name}`);
        }
      });
      if (this.currentModel !== null) {
        this.scene.remove(this.currentModel);
        this.currentModel = null;
      }
      this.currentModel = model!.scene;
      this.scene.add(this.currentModel);
      this.afterLoadCB(model?.scene);
    } else {
      console.error("Unable to load model ");
    }
  }
}
