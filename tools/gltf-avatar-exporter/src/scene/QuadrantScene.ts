import {
  Box3,
  Group,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import styles from "./quadrant.module.css";

export class QuadrantScene {
  private width: number = window.innerWidth / 2;
  private height: number = window.innerHeight / 2;
  private aspect: number = this.width / this.height;

  public element: HTMLDivElement;

  public scene: Scene = new Scene();
  public camera: PerspectiveCamera = new PerspectiveCamera(60, this.aspect, 0.01, 10000);
  private renderer: WebGLRenderer = new WebGLRenderer({ antialias: true });

  private orbitControls: OrbitControls;

  constructor() {
    this.element = document.createElement("div");
    this.element.classList.add(styles.quadrant);

    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.shadowMap.enabled = true;
    this.renderer.setSize(this.width, this.height);

    this.camera.position.set(0, 1, 2);
    this.camera.lookAt(this.scene.position);
    this.camera.updateProjectionMatrix();

    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbitControls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.minDistance = 0.1;
    this.orbitControls.maxDistance = 1000;

    this.element.appendChild(this.renderer.domElement);
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
    this.fitCameraToBoundingBox(boundingBox);
  }

  public fitCameraToBoundingBox(boundingBox: Box3): void {
    if (
      boundingBox.min.distanceTo(new Vector3()) === Infinity ||
      boundingBox.max.distanceTo(new Vector3()) === Infinity
    ) {
      boundingBox.min.set(-1, -1, -1);
      boundingBox.max.set(1, 1, 1);
    }
    // Create bounding box that is centered at the origin, but includes the bounding box
    const originBoundingBox = new Box3();
    originBoundingBox.expandByPoint(boundingBox.min);
    originBoundingBox.expandByPoint(boundingBox.max);
    originBoundingBox.expandByPoint(new Vector3(-boundingBox.min.x, 0, boundingBox.min.z));
    originBoundingBox.expandByPoint(new Vector3(-boundingBox.max.x, 0, boundingBox.max.z));

    const size = originBoundingBox.getSize(new Vector3());
    const maxSize = Math.max(size.x, size.y, size.z);
    const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * this.camera.fov) / 360));
    const fitWidthDistance = fitHeightDistance / this.camera.aspect;
    const distance = Math.max(fitHeightDistance, fitWidthDistance) * 1.5;

    const offset = new Vector3(0, maxSize / 2, 0);

    const direction = this.orbitControls.target
      .set(0, 0, 0)
      .clone()
      .sub(this.camera.position)
      .normalize()
      .multiplyScalar(distance);

    this.orbitControls.maxDistance = distance * 10;
    this.orbitControls.target.copy(offset);

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
