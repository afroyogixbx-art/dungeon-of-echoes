// Local stand-in for the "grok/canvas" kit used by the original Page.
// Re-exports React hooks and provides a fixed dark-fantasy theme.
export { useState, useEffect, useRef, useCallback, useReducer, useMemo } from "react";
export type { ReactNode, CSSProperties, ChangeEvent, FocusEvent } from "react";

export interface GrokTheme {
  bg: { base: string; elevated: string; subtle: string };
  text: { primary: string; secondary: string; tertiary: string; danger: string; success: string; warning: string; accent: string; onPrimary: string };
  border: { default: string; focus: string; strong: string };
  fill: { primary: string; secondary: string; accentSubtle: string; dangerSubtle: string; successSubtle: string; warningSubtle: string };
  font: { family: string; mono: string };
}

const THEME: GrokTheme = {
  bg: { base: "#0b0a09", elevated: "#161410", subtle: "#10100d" },
  text: { primary: "#e4dcd0", secondary: "#9a9286", tertiary: "#6e6860", danger: "#b43a36", success: "#6a8a62", warning: "#c9a24a", accent: "#a89878", onPrimary: "#1a140c" },
  border: { default: "#4a453c", focus: "#c9a24a", strong: "#6a6256" },
  fill: { primary: "#8a6a32", secondary: "#1e1c18", accentSubtle: "#241e16", dangerSubtle: "#2a1210", successSubtle: "#142016", warningSubtle: "#2a2210" },
  font: {
    family: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
};

export function useGrokTheme(): GrokTheme {
  return THEME;
}
