import { Vector3 } from "three";

import { Lights } from "./elements/Lights";
import { Room } from "./elements/Room";
import { QuadrantScene } from "./QuadrantScene";

export class SEQuadrant extends QuadrantScene {
  private readonly camOffset: Vector3 = new Vector3(0, 1.2, 0);
  private lights: Lights;
  private room: Room;

  constructor() {
    super("seQuadrant");
    this.lights = new Lights(this.camOffset);
    this.scene.add(this.lights.ambientLight);
    this.scene.add(this.lights.mainLight);

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
}
