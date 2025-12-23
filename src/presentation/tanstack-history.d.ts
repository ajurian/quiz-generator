import "@tanstack/history";

declare module "@tanstack/history" {
  interface HistoryState {
    restart?: boolean;
    resume?: boolean;
  }
}
