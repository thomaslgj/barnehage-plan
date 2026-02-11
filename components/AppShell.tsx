"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useHousehold } from "@/lib/HouseholdContext";
import Schedule from "./Schedule";
import Onboarding from "./Onboarding";

export default function AppShell() {
  const router = useRouter();
  const { user, needsOnboarding, loading, error } = useHousehold();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Laster…</div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <Onboarding />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 md:p-6">
      <div className="max-w-4xl mx-auto">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-sm text-red-300 mb-3">
            {error}
          </div>
        )}
        <Schedule />
      </div>
    </main>
  );
}

