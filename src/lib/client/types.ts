
export type ActionResultExtendedColors = "green" | "blue" | "yellow" | "red";

export interface IActionResult {
  error: unknown;
  notification: {
    color: ActionResultExtendedColors;
    title: string;
    message: string;
  }
}
