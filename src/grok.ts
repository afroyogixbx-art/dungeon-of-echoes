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
  bg: { base: "#0e0b12", elevated: "#1a1520", subtle: "#141018" },
  text: { primary: "#ece4d6", secondary: "#b3a896", tertiary: "#7d7468", danger: "#ff6b6b", success: "#5fd38d", warning: "#f5b84a", accent: "#c79bff", onPrimary: "#1a1206" },
  border: { default: "#3a3040", focus: "#e0b25a", strong: "#5a4a60" },
  fill: { primary: "#d9a441", secondary: "#262030", accentSubtle: "#2e2340", dangerSubtle: "#3a1618", successSubtle: "#16301f", warningSubtle: "#3a2c12" },
  font: {
    family: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  },
};

export function useGrokTheme(): GrokTheme {
  return THEME;
}
