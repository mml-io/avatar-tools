import { StepResult } from "../scene/correction-steps/types";

function createLogElement(level: string, logString: string, showLevel: boolean = true) {
  const logElement = document.createElement("div");
  logElement.classList.add("log-element");
  logElement.classList.add(level);
  logElement.textContent = showLevel ? `(${level}) ${logString}` : `${logString}`;
  return logElement;
}

function createStepResultElement(stepResult: StepResult): HTMLElement {
  const stepResultElement = document.createElement("div");
  stepResultElement.classList.add("step-result");

  if (!stepResult.didApply) {
    stepResultElement.classList.add("skipped");
  }

  // Add logs if any
  if (stepResult.logs) {
    const logElementHolder = document.createElement("div");
    logElementHolder.classList.add("step-result-inner-logs");

    for (const log of stepResult.logs) {
      const logElement = createLogElement(log.level, log.message);
      logElementHolder.appendChild(logElement);
    }

    stepResultElement.appendChild(logElementHolder);
  }

  return stepResultElement;
}

export class LoggerView {
  private logElement: HTMLDivElement;
  private foldableLogs: Map<string, { container: HTMLDivElement; content: string[] }>;

  constructor() {
    this.logElement = document.getElementById("swQuadrant") as HTMLDivElement;
    this.foldableLogs = new Map();
    this.reset();
  }

  public reset() {
    while (this.logElement.firstChild) {
      this.logElement.removeChild(this.logElement.firstChild);
    }
    this.log("⬆️ Drag & drop your asset onto the quadrant above to load it ⬆️");
  }

  public logStepResult(stepName: string, stepResult: StepResult) {
    // Determine the folder title and icon based on the step result
    const folderTitle = `${stepResult.didApply ? "🔨 (Applied)" : "⏭️ (Skipped)"} - ${
      stepResult.topLevelMessage ? stepResult.topLevelMessage.message : stepName
    }`;

    // Only create a foldable container if there are logs
    if (stepResult.logs && stepResult.logs.length > 0) {
      let stepContainerEntry = this.foldableLogs.get(folderTitle);
      if (!stepContainerEntry) {
        const stepContainer = document.createElement("div");
        stepContainer.classList.add("foldable-log-container");
        this.logElement.appendChild(stepContainer);

        // Create the foldable container with the folder title
        this.createFoldableContainer(stepContainer, folderTitle);

        // If the step did apply, unfold the container by default
        if (stepResult.didApply) {
          stepContainer.classList.add("expanded");
        }

        stepContainerEntry = { container: stepContainer, content: [] };
        this.foldableLogs.set(folderTitle, stepContainerEntry);
      }

      // Create the step result element without the top level message
      const stepResultElement = createStepResultElement(stepResult);
      stepContainerEntry.container
        .querySelector(".foldable-log-content")!
        .appendChild(stepResultElement);
    } else {
      // Log the topLevelMessage directly without a foldable container
      const logElement = createLogElement(stepResult.topLevelMessage.level, folderTitle, false);
      this.logElement.appendChild(logElement);
    }
  }

  public log(dataString: string) {
    console.log("log", dataString);
    const logElement = createLogElement("info", dataString);
    this.logElement.appendChild(logElement);
  }

  public logFoldableData(
    id: string,
    dataStrings: string[],
    logLevel: "info" | "warn" | "error" = "info",
  ) {
    if (!dataStrings || dataStrings.length === 0) {
      return;
    }

    let topLevelEntry = this.foldableLogs.get(id);
    if (!topLevelEntry) {
      const topLevelContainer = document.createElement("div");
      topLevelContainer.classList.add("foldable-log-top-container");
      this.logElement.appendChild(topLevelContainer);

      topLevelEntry = { container: topLevelContainer, content: [] };
      this.foldableLogs.set(id, topLevelEntry);
    }

    let currentContainer = topLevelEntry.container;

    if (dataStrings.length > 1 && !topLevelEntry.container.querySelector("button")) {
      this.createFoldableContainer(topLevelEntry.container, id);
    }

    dataStrings.forEach((label, index) => {
      if (index < dataStrings.length - 1) {
        let nestedContainer = currentContainer.querySelector(
          `.foldable-log-container[data-label="${label}"]`,
        );
        if (!nestedContainer) {
          nestedContainer = document.createElement("div") as HTMLElement;
          nestedContainer.classList.add("foldable-log-container");
          nestedContainer.setAttribute("data-label", label);
          this.createFoldableContainer(nestedContainer as HTMLElement, label);
          currentContainer.appendChild(nestedContainer);
        }
        currentContainer = nestedContainer.querySelector(".foldable-log-content")!;
      }
    });

    const logElement = createLogElement(logLevel, dataStrings[dataStrings.length - 1]);
    currentContainer.appendChild(logElement);
  }

  private createFoldableContainer(container: HTMLElement, label: string): void {
    const toggleButton = document.createElement("button");
    toggleButton.textContent = "📁 " + label;
    toggleButton.onclick = () => {
      container.classList.toggle("expanded");
      toggleButton.textContent = container.classList.contains("expanded")
        ? `📂 ${label}`
        : `📁 ${label}`;
    };

    const contentContainer = document.createElement("div");
    contentContainer.classList.add("foldable-log-content");

    while (container.firstChild) {
      contentContainer.appendChild(container.firstChild);
    }

    container.appendChild(toggleButton);
    container.appendChild(contentContainer);
  }
}
