import styles from "./LogMessageRow.module.css";

export type NestedLogMessage = {
  message: string;
  level: "info" | "warn" | "error";
  messages?: NestedLogMessage[];
};

export class LogMessageRow {
  public readonly element: HTMLDivElement;
  private iconHolder: HTMLDivElement;
  private icon: HTMLDivElement;
  private messageElement: HTMLDivElement;
  private childrenHolder: HTMLDivElement;
  private children: Array<LogMessageRow> = [];
  private topRow: HTMLDivElement;

  constructor(
    public level: "info" | "warn" | "error",
    public message: string,
    private expanded: boolean = false,
    private lowVisibility = false,
  ) {
    this.element = document.createElement("div");
    this.element.classList.add(styles.logMessageRow);
    if (this.lowVisibility) {
      this.element.classList.add(styles.lowVisibility);
    }

    this.topRow = document.createElement("div");
    this.topRow.classList.add(styles.topRow);
    this.topRow.addEventListener("click", () => {
      if (this.children.length === 0) {
        return;
      }
      this.expanded = !this.expanded;
      this.childrenHolder.style.display = this.expanded ? "block" : "none";
      this.icon.textContent = this.expanded ? "▼" : "▶";
    });
    this.element.appendChild(this.topRow);

    this.iconHolder = document.createElement("div");
    this.iconHolder.classList.add(styles.iconHolder);

    this.icon = document.createElement("div");
    this.icon.classList.add(styles.icon);
    this.iconHolder.appendChild(this.icon);
    this.topRow.appendChild(this.iconHolder);

    this.messageElement = document.createElement("div");
    this.messageElement.classList.add(styles.message);
    this.messageElement.classList.add(styles[level]);
    this.messageElement.textContent = message;
    this.topRow.appendChild(this.messageElement);

    this.childrenHolder = document.createElement("div");
    this.childrenHolder.classList.add(styles.childrenHolder);
    this.childrenHolder.style.display = this.expanded ? "block" : "none";
    this.element.appendChild(this.childrenHolder);
  }

  public addChild(child: LogMessageRow) {
    this.topRow.classList.add(styles.hasChildren);
    this.icon.textContent = this.expanded ? "▼" : "▶";
    this.children.push(child);
    this.childrenHolder.appendChild(child.element);
  }

  public addNestedLogMessages(nestedLogMessages: Array<NestedLogMessage>) {
    for (const nestedLogMessage of nestedLogMessages) {
      const child = new LogMessageRow(nestedLogMessage.level, nestedLogMessage.message);
      this.addChild(child);
      if (nestedLogMessage.messages) {
        child.addNestedLogMessages(nestedLogMessage.messages);
      }
    }
  }
}
