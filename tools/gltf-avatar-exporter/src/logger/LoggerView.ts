import { StepResult } from "gltf-avatar-export-lib";

import styles from "../scene/quadrant.module.css";

import { LogMessageRow, NestedLogMessage } from "./LogMessageRow";

export class LoggerView {
  public readonly element: HTMLDivElement;
  private foldableLogs: Map<string, { container: HTMLDivElement; content: string[] }>;

  constructor() {
    this.element = document.createElement("div");
    this.element.classList.add(styles.swQuadrant, styles.quadrant);
    this.foldableLogs = new Map();
    this.reset();
  }

  public reset() {
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild);
    }
    this.foldableLogs.clear();
    this.log("⬆️ Drag & drop your asset onto the quadrant above to load it ⬆️");
  }

  public logStepResult(stepName: string, stepResult: StepResult) {
    console.log("logStepResult", stepName, stepResult);
    const logRow = new LogMessageRow(
      stepResult.topLevelMessage.level,
      `${stepResult.didApply ? "🔨 (Applied)" : "⏭️ (Skipped)"} ${stepName} - ${
        stepResult.topLevelMessage.message
      }`,
      stepResult.autoOpenLogs,
      !stepResult.didApply && stepResult.topLevelMessage.level === "info",
    );
    this.element.appendChild(logRow.element);

    if (stepResult.logs) {
      for (const log of stepResult.logs) {
        const child = new LogMessageRow(log.level, log.message);
        logRow.addChild(child);
      }
    }
  }

  public log(logMessage: string, level: "info" | "warn" | "error" = "info") {
    console.log("log", logMessage, level);

    const logRow = new LogMessageRow(level, logMessage);
    this.element.appendChild(logRow.element);
  }

  public logNestedLogMessage(nestedLogMessage: NestedLogMessage) {
    console.log("logNestedLogMessage", nestedLogMessage);
    const logRow = new LogMessageRow(nestedLogMessage.level, nestedLogMessage.message);
    if (nestedLogMessage.messages) {
      logRow.addNestedLogMessages(nestedLogMessage.messages);
    }
    this.element.appendChild(logRow.element);
  }
}
