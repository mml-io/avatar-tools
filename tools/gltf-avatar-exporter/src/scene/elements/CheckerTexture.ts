import {
  DataTexture,
  LinearMipmapLinearFilter,
  NearestFilter,
  RGBAFormat,
  RepeatWrapping,
} from "three";

export class CheckerTexture extends DataTexture {
  constructor(
    private repeatX: number,
    private repeatY: number,
  ) {
    super(
      CheckerTexture.createCheckerData(),
      2, // width
      2, // height
      RGBAFormat,
    );

    this.repeat.set(this.repeatX, this.repeatY);
    this.wrapS = RepeatWrapping;
    this.wrapT = RepeatWrapping;
    this.magFilter = NearestFilter;
    this.minFilter = LinearMipmapLinearFilter;
    this.needsUpdate = true;
  }

  private static createCheckerData(): Uint8Array {
    const width = 2;
    const height = 2;
    const size = width * height * 4; // RGBA
    const data = new Uint8Array(size);

    for (let i = 0; i <= 12; i += 4) {
      const c = i === 4 || i === 8 ? 70 : 200;
      CheckerTexture.fillData(data, i, c, c, c, 255);
    }

    return data;
  }

  private static fillData(
    data: Uint8Array,
    offset: number,
    red: number,
    green: number,
    blue: number,
    alpha: number,
  ) {
    data[offset + 0] = red;
    data[offset + 1] = green;
    data[offset + 2] = blue;
    data[offset + 3] = alpha;
  }
}
