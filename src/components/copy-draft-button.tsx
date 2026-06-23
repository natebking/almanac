"use client";

import { useRef, useState } from "react";
import { Check, Clipboard } from "lucide-react";

type CopyState = "idle" | "copied" | "manual";

export function CopyDraftButton({ text }: { text: string }) {
  const [state, setState] = useState<CopyState>("idle");
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  const Icon = state === "copied" ? Check : Clipboard;
  const label =
    state === "copied" ? "Copied" : state === "manual" ? "Select draft" : "Copy draft";

  async function handleCopy() {
    if (state === "manual") {
      fallbackRef.current?.select();
      return;
    }

    try {
      await copyText(text);
      setState("copied");
    } catch {
      setState("manual");
    }
  }

  return (
    <div className="copy-draft-control">
      <button
        aria-live="polite"
        className={`copy-draft-button ${state}`}
        onClick={handleCopy}
        type="button"
      >
        <Icon size={16} />
        {label}
      </button>
      {state === "manual" ? (
        <textarea
          aria-label="Draft text"
          className="copy-draft-fallback"
          ref={fallbackRef}
          onFocus={(event) => event.currentTarget.select()}
          readOnly
          value={text}
        />
      ) : null}
    </div>
  );
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Some mobile browsers expose Clipboard API but reject it outside a fully focused context.
      fallbackCopyText(text);
      return;
    }
  }

  fallbackCopyText(text);
}

function fallbackCopyText(text: string) {
  const element = document.createElement("textarea");
  element.value = text;
  element.setAttribute("readonly", "");
  element.style.position = "fixed";
  element.style.opacity = "0";
  document.body.append(element);
  element.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Copy command failed.");
    }
  } finally {
    element.remove();
  }
}
