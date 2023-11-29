import {
  Box3,
  Fog,
  Group,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class QuadrantScene {
  private width: number = window.innerWidth / 2;
  private height: number = window.innerHeight / 2;
  private aspect: number = this.width / this.height;

  public parentElement: HTMLDivElement;

  public scene: Scene = new Scene();
  public camera: PerspectiveCamera = new PerspectiveCamera(60, this.aspect, 0.01, 1000);
  private renderer: WebGLRenderer = new WebGLRenderer({ antialias: true });

  private orbitControls: OrbitControls;

  constructor(parentDivId: string) {
    this.parentElement = document.getElementById(parentDivId) as HTMLDivElement;

    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.shadowMap.enabled = true;
    this.renderer.setSize(this.width, this.height);

    this.scene.fog = new Fog(0x000000, 0.01, 50);

    this.camera.position.set(0, 2, 3);
    this.camera.lookAt(this.scene.position);
    this.camera.updateProjectionMatrix();

    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.minDistance = 1;
    this.orbitControls.maxDistance = 500;
    this.orbitControls.maxPolarAngle = Math.PI / 2;

    this.parentElement.appendChild(this.renderer.domElement);
    window.addEventListener("resize", this.updateProjection.bind(this));
  }

  private updateProjection(): void {
    if (!this.renderer) return;
    this.width = window.innerWidth / 2;
    this.height = window.innerHeight / 2;
    this.aspect = this.width / this.height;
    this.renderer.setSize(this.width, this.height);
    if (this.camera) {
      this.camera.aspect = this.aspect;
      this.camera.updateProjectionMatrix();
    }
  }

  public fitCameraToGroup(group: Group): void {
    const boundingBox = new Box3().setFromObject(group);
    const center = boundingBox.getCenter(new Vector3());
    const size = boundingBox.getSize(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs((maxDim / 2) * Math.tan(fov / 2)) + 3;
    cameraZ /= this.camera.aspect;
    const target = new Vector3(center.x, center.y, center.z);
    this.camera.position.set(center.x, center.y + size.y / 3, center.z + cameraZ);
    this.camera.lookAt(target);
    this.orbitControls.target.copy(target);
    this.camera.updateProjectionMatrix();
  }

  public update(): void {
    this.renderer.render(this.scene, this.camera);
    this.orbitControls.update();
  }
}
