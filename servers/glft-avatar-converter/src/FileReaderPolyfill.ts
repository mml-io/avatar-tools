export class FileReader extends EventTarget {
  public onloadend: () => void = () => {};
  public result = new ArrayBuffer(0);

  public readAsArrayBuffer(blob: Blob) {
    console.log("readAsArrayBuffer");

    process.nextTick(async () => {
      this.result = await blob.arrayBuffer();
      this.onloadend();
    });
  }
}
