
export type ActionResultExtendedColors = "green" | "blue" | "yellow" | "red";

export interface IActionResult {
  message: string;
}

export interface IActionResultExtended {
  error: unknown;
  notification: {
    color: ActionResultExtendedColors;
    title: string;
    message: string;
  }
}
