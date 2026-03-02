"use client";

import { useEffect } from "react";
import { init } from "@plausible-analytics/tracker";

export default function PlausibleTracker() {
  useEffect(() => {
    init({
      domain: "flytfamilie.app",
      autoCapturePageviews: true,
    });
  }, []);

  return null;
}
