"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type ThemeMode = "light" | "dark";

const THEME_CHANGE_EVENT = "almanac-theme-change";

function readStoredTheme(): ThemeMode {
  const stored = window.localStorage.getItem("almanac-theme");

  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  media.addEventListener("change", callback);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
    media.removeEventListener("change", callback);
  };
}

export function ThemeToggle() {
  // useSyncExternalStore renders the server snapshot (null) on the server and on
  // the first client render, so hydration matches exactly. React then re-renders
  // with the real client theme. This avoids both a hydration mismatch and a
  // set-state-in-effect, while still reflecting the inline theme script that
  // already applied `data-theme` before paint.
  const mode = useSyncExternalStore<ThemeMode | null>(
    subscribe,
    readStoredTheme,
    () => null,
  );

  function updateMode(nextMode: ThemeMode) {
    document.documentElement.dataset.theme = nextMode;
    window.localStorage.setItem("almanac-theme", nextMode);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Color mode">
      <button
        aria-pressed={mode === "light"}
        className={mode === "light" ? "active" : ""}
        onClick={() => updateMode("light")}
        type="button"
      >
        <Sun size={15} />
        Light
      </button>
      <button
        aria-pressed={mode === "dark"}
        className={mode === "dark" ? "active" : ""}
        onClick={() => updateMode("dark")}
        type="button"
      >
        <Moon size={15} />
        Dark
      </button>
    </div>
  );
}
