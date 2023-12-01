import { CircleGeometry, FrontSide, Group, Mesh, MeshStandardMaterial } from "three";

import { CheckerTexture } from "./CheckerTexture";

export class Room extends Group {
  private readonly floorSize = 30;
  private readonly floorGeometry = new CircleGeometry(this.floorSize, 36);
  private readonly floorMaterial: MeshStandardMaterial;
  private readonly floorMesh: Mesh | null = null;
  private readonly checkerTexture: CheckerTexture;

  constructor() {
    super();
    this.checkerTexture = new CheckerTexture(this.floorSize / 1, this.floorSize / 1);

    this.floorMaterial = new MeshStandardMaterial({
      color: 0xbcbcbc,
      side: FrontSide,
      metalness: 0.04,
      roughness: 0.49,
      map: this.checkerTexture,
    });
    this.floorMesh = new Mesh(this.floorGeometry, this.floorMaterial);
    this.floorMesh.receiveShadow = true;
    this.floorMesh.rotation.x = Math.PI * -0.5;
    this.floorMaterial.needsUpdate = true;

    this.add(this.floorMesh);
  }
}
