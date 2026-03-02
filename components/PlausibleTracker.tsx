"use client";

import { useEffect } from "react";

export default function PlausibleTracker() {
  useEffect(() => {
    import("@plausible-analytics/tracker").then(({ init }) => {
      init({
        domain: "flytfamilie.app",
        autoCapturePageviews: true,
      });
    });
  }, []);

  return null;
}
