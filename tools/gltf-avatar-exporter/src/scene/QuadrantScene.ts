import {
  Box3,
  BufferGeometry,
  Fog,
  Group,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  Sphere,
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
  public camera: PerspectiveCamera = new PerspectiveCamera(60, this.aspect, 0.01, 10000);
  private renderer: WebGLRenderer = new WebGLRenderer({ antialias: true });

  private orbitControls: OrbitControls;

  constructor(parentDivId: string) {
    this.parentElement = document.getElementById(parentDivId) as HTMLDivElement;

    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.shadowMap.enabled = true;
    this.renderer.setSize(this.width, this.height);

    this.scene.fog = new Fog(0x000000, 0.01, 50);

    this.camera.position.set(0, 1, 2);
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
    const boundingBox = new Box3();
    boundingBox.makeEmpty();
    group.traverse((child) => {
      if (child.type === "SkinnedMesh") {
        child.updateMatrixWorld();
        boundingBox.expandByObject(child);
      }
    });
    const size = boundingBox.getSize(new Vector3());
    const center = boundingBox.getCenter(new Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * this.camera.fov) / 360));
    const fitWidthDistance = fitHeightDistance / this.camera.aspect;
    const distance = Math.max(fitHeightDistance, fitWidthDistance);
    this.scene.fog = new Fog(0x000000, 0.01, distance * 5);

    const offset = new Vector3(0, distance * 0.1, 0);

    const direction = this.orbitControls.target
      .clone()
      .sub(this.camera.position)
      .normalize()
      .multiplyScalar(distance);

    this.orbitControls.maxDistance = distance * 10;
    this.orbitControls.target.copy(center.clone().add(offset));

    this.camera.near = distance / 100;
    this.camera.far = distance * 100;
    this.camera.updateProjectionMatrix();

    this.camera.position.copy(this.orbitControls.target.clone().sub(offset)).sub(direction);

    this.orbitControls.update();
  }

  public fitCameraToGeometry(geometry: BufferGeometry): void {
    const sphere = geometry.boundingSphere as Sphere;
    const { center, radius } = sphere;
    const maxSize = radius * 2.0;
    const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * this.camera.fov) / 360));
    const fitWidthDistance = fitHeightDistance / this.camera.aspect;
    const distance = Math.max(fitHeightDistance, fitWidthDistance);
    const offset = new Vector3(0, distance * 0.1, 0);

    const direction = this.orbitControls.target
      .clone()
      .sub(this.camera.position)
      .normalize()
      .multiplyScalar(distance);

    this.orbitControls.maxDistance = distance * 10;
    this.orbitControls.target.copy(center.clone().add(offset));

    this.camera.near = distance / 100;
    this.camera.far = distance * 100;
    this.camera.updateProjectionMatrix();

    this.camera.position.copy(this.orbitControls.target.clone().sub(offset)).sub(direction);

    this.orbitControls.update();
  }

  public update(_slowMotion: boolean = false): void {
    this.renderer.render(this.scene, this.camera);
    this.orbitControls.update();
  }
}
