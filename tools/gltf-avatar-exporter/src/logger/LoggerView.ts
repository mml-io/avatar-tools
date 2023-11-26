import { StepResult } from "../scene/correction-steps/types";

function createLogElement(level: string, logString: string) {
  const logElement = document.createElement("div");
  logElement.classList.add("log-element");
  logElement.classList.add(level);
  logElement.textContent = `(${level}) ${logString}`;
  return logElement;
}

function createStepResultElement(stepName: string, stepResult: StepResult) {
  const stepResultElement = document.createElement("div");
  stepResultElement.classList.add("step-result");
  if (!stepResult.didApply) {
    stepResultElement.classList.add("skipped");
  }

  const rowElement = document.createElement("div");
  rowElement.classList.add("step-result-row");

  const titleElement = document.createElement("span");
  titleElement.textContent = `${stepResult.didApply ? "🔨(Applied)" : "⏭️ (Skipped)"} ${stepName}${
    stepResult.topLevelMessage ? ` - ${stepResult.topLevelMessage.message}` : ""
  }`;
  rowElement.appendChild(titleElement);

  const logElementHolder = document.createElement("div");
  logElementHolder.classList.add("step-result-inner-logs");

  if (stepResult.logs) {
    for (const logString of stepResult.logs) {
      const logElement = createLogElement(logString.level, logString.message);
      logElementHolder.appendChild(logElement);
    }
  }

  stepResultElement.appendChild(rowElement);
  stepResultElement.appendChild(logElementHolder);
  return stepResultElement;
}

export class LoggerView {
  private logElement: HTMLDivElement;

  constructor() {
    this.logElement = document.getElementById("swQuadrant") as HTMLDivElement;
    this.reset();
  }

  public reset() {
    // Remove all children
    while (this.logElement.firstChild) {
      this.logElement.removeChild(this.logElement.firstChild);
    }
    this.log("⬆️ Drag & drop your asset onto the quadrant above to load it ⬆️");
  }

  public logStepResult(stepName: string, stepResult: StepResult) {
    const stepResultElement = createStepResultElement(stepName, stepResult);
    this.logElement.appendChild(stepResultElement);
  }

  public log(dataString: string) {
    console.log("log", dataString);
    const logElement = createLogElement("info", dataString);
    this.logElement.appendChild(logElement);
  }
}
