
export type ActionResultColors = "green" | "blue" | "yellow" | "red";

export interface IActionResult {
  color?: ActionResultColors;
  title?: string;
  message: string;
}

export interface IActionResultExtended {
  error: unknown;
  notification: {
    color: ActionResultColors;
    title: string;
    message: string;
  }
}
