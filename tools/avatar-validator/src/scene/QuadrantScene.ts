import { CameraManager, CollisionsManager } from "@mml-io/3d-web-client-core";
import { Fog, PCFSoftShadowMap, Scene, WebGLRenderer } from "three";

export class QuadrantScene {
  private width: number = window.innerWidth / 2;
  private height: number = window.innerHeight / 2;
  private aspect: number = this.width / this.height;

  public parentElement: HTMLDivElement;

  public scene: Scene = new Scene();
  private collisionsManager: CollisionsManager = new CollisionsManager(this.scene);
  private renderer: WebGLRenderer = new WebGLRenderer({ antialias: true });
  private cameraManager: CameraManager;

  constructor(parentDivId: string) {
    this.parentElement = document.getElementById(parentDivId) as HTMLDivElement;

    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.shadowMap.enabled = true;
    this.renderer.setSize(this.width, this.height);

    this.scene.fog = new Fog(0x000000, 0.01, 50);

    this.cameraManager = new CameraManager(
      this.parentElement,
      this.collisionsManager,
      Math.PI / 2.3,
      Math.PI * 0.5,
    );

    this.parentElement.appendChild(this.renderer.domElement);
    window.addEventListener("resize", this.updateProjection.bind(this));
  }

  private updateProjection(): void {
    if (!this.renderer) return;
    this.width = window.innerWidth / 2;
    this.height = window.innerHeight / 2;
    this.aspect = this.width / this.height;
    this.renderer.setSize(this.width, this.height);
    if (this.cameraManager) {
      this.cameraManager.updateAspect(this.aspect);
    }
  }

  public update(): void {
    this.cameraManager.update();
    this.renderer.render(this.scene, this.cameraManager.camera);
  }
}
