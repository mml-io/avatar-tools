import { Group } from "three";

export type LogMessage = {
  message: string;
  level: "info" | "warn" | "error";
};

export type StepResult = {
  didApply: boolean;
  logs?: Array<LogMessage>;
  topLevelMessage: LogMessage;
  autoOpenLogs?: boolean;
};

export type Step = {
  name: string;
  action: (group: Group) => StepResult;
};
