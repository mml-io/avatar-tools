import { TimeManager } from "@mml-io/3d-web-client-core";
import { Group } from "three";

import { LoggerView } from "./logger/LoggerView";
import { AnimationView } from "./scene/AnimationView";
import { ExportView } from "./scene/ExportView";
import { ImportView } from "./scene/ImportView";
import { ModelLoader } from "./scene/ModelLoader";

class App {
  private readonly timeManager = new TimeManager();

  private modelLoader: ModelLoader = new ModelLoader();
  private logger: LoggerView = new LoggerView();

  private importView: ImportView;
  private exportView: ExportView;
  private animationView: AnimationView;

  constructor() {
    this.importView = new ImportView(
      this.logger,
      this.modelLoader,
      (group: Group, name: string) => {
        this.logger.logFoldableData("skeleton data", ["skeleton data"]);
        group.traverse((child) => {
          if (child.type === "Bone") {
            const bonePosition = child.position.toArray().toString();
            const boneRotation = child.rotation.toArray().toString();
            const boneQuaternion = child.quaternion.toArray().toString();
            const boneScale = child.scale.toArray().toString();
            this.logger.logFoldableData("skeleton data", [`${child.name}`, `pos: ${bonePosition}`]);
            this.logger.logFoldableData("skeleton data", [`${child.name}`, `rot: ${boneRotation}`]);
            this.logger.logFoldableData("skeleton data", [
              `${child.name}`,
              `quat: ${boneQuaternion}`,
            ]);
            this.logger.logFoldableData("skeleton data", [`${child.name}`, `scale: ${boneScale}`]);
          }
        });
        this.exportView.setImportedModelGroup(group, name);
      },
    );
    this.exportView = new ExportView(this.logger, this.modelLoader, this.timeManager);
    this.animationView = new AnimationView(
      this.modelLoader,
      (clip) => {
        this.exportView.setAnimationClip(clip);
      },
      this.timeManager,
    );
    this.disableDragAndDropElsewhere();
  }

  disableDragAndDropElsewhere(): void {
    // Disable drag and drop on the body to prevent the browser from loading the file if the user misses the drop zone
    document.body.addEventListener("dragover", this.preventDragDrop);
    document.body.addEventListener("drop", this.preventDragDrop);
    document.body.addEventListener("dragover", this.preventDragDrop);
    document.body.addEventListener("drop", this.preventDragDrop);
  }
  private preventDragDrop = (event: DragEvent) => {
    event.preventDefault();
  };

  public update(): void {
    this.timeManager.update();
    this.importView.update();
    this.exportView.update(this.animationView.slowMotion);
    this.animationView.update();
    requestAnimationFrame(() => {
      this.update();
    });
  }
}

const app = new App();
app.update();
