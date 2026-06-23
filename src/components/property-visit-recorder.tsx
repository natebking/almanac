"use client";

import { useEffect } from "react";

export function PropertyVisitRecorder({
  propertyIndexId,
}: {
  propertyIndexId: string;
}) {
  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/property-visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyIndexId }),
      signal: controller.signal,
    }).catch(() => {
      // Visit tracking should never block the property page.
    });

    return () => controller.abort();
  }, [propertyIndexId]);

  return null;
}
