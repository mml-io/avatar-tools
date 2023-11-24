export class Logger {
  private logElement: HTMLDivElement;
  private data: string[] = [];
  private dataMaxSize: number | null = 1000;
  private firstMessage: boolean = false;

  constructor() {
    this.logElement = document.getElementById("swQuadrant") as HTMLDivElement;
    this.log = this.log.bind(this);
    this.log("⬆️ Drag and drop your asset in the quadrant above to load it ⬆️");

    this.logElement.addEventListener("dragover", this.preventDragDrop);
    this.logElement.addEventListener("drop", this.preventDragDrop);
    this.logElement.addEventListener("dragover", this.preventDragDrop);
    this.logElement.addEventListener("drop", this.preventDragDrop);
  }

  private preventDragDrop = (event: DragEvent) => {
    event.preventDefault();
  };

  public log(dataString: string) {
    this.data.push(dataString);
    if (this.dataMaxSize && this.data.length > this.dataMaxSize) {
      this.data.shift();
    }
    this.logElement.innerText = this.data.join("\n");
    this.logElement.scrollTop = this.logElement.scrollHeight;
    if (this.firstMessage === false) {
      this.data.shift();
      this.firstMessage = true;
    }
  }
}
