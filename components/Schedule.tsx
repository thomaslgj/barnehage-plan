"use client";

import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import "dayjs/locale/nb";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

const PEOPLE = { person1: "Thomas", person2: "Helene" } as const;
const ORDER = [null, "person1", "person2"] as const;
const SLOTS = [
  { id: "dropoff", label: "Levering" },
  { id: "pickup", label: "Henting" },
];

type Who = (typeof ORDER)[number];

export default function Schedule() {
  const [data, setData] = useState<Record<string, Who>>({});
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = inneværende uke, -1 = forrige uke, 1 = neste uke

  // sett norsk locale
  dayjs.locale("nb");

  // generer 2 uker med hverdager, starter med mandag i valgt uke
  const today = dayjs();
  const currentWeekStart = today.startOf("isoWeek"); // mandag i inneværende uke (ISO uke starter på mandag)
  const start = currentWeekStart.add(weekOffset, "week"); // juster basert på weekOffset
  const allDays = Array.from({ length: 14 })
    .map((_, i) => start.add(i, "day"))
    .filter((d) => d.day() !== 6 && d.day() !== 0);

  const from = allDays[0].format("YYYY-MM-DD");
  const to = allDays[allDays.length - 1].format("YYYY-MM-DD");

  // Funksjon for å hente data
  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const res = await fetch(`/api/schedule?from=${from}&to=${to}`);
      const json = await res.json();
      const next: Record<string, Who> = {};
      json.forEach((row: { date: string; slot: string; who: Who }) => {
        const key = `${row.date}-${row.slot}`;
        next[key] = (row.who as Who) ?? null;
      });
      setData(next);
    } catch (error) {
      console.error("Feil ved henting av data:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [from, to]);

  // Hent data når komponenten monteres eller weekOffset endres
  useEffect(() => {
    fetchData(true);
  }, [fetchData, weekOffset]);

  // Automatisk oppdatering hvert 30. sekund
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false); // Ikke vis loading-indikator ved automatisk oppdatering
    }, 10000); // 10 sekunder

    return () => clearInterval(interval);
  }, [fetchData]);

  // Oppdater også når vinduet får fokus igjen (hvis brukeren har byttet fane)
  useEffect(() => {
    const handleFocus = () => {
      fetchData(false);
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchData]);

  const handleClick = async (dateStr: string, slot: string) => {
    const key = `${dateStr}-${slot}`;
    const current = data[key] ?? null;
    const idx = ORDER.indexOf(current);
    const next = ORDER[(idx + 1) % ORDER.length];

    // optimistic update
    setData((prev) => ({ ...prev, [key]: next }));

    // send til API
    await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: dateStr,
        slot,
        who: next,
      }),
    });
  };

  const currentWeekNumber = start.week();
  const currentYear = start.year();
  const weekRange = `${allDays[0].format("DD.MM")} - ${allDays[allDays.length - 1].format("DD.MM")}`;

  const isCurrentWeek = weekOffset === 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setWeekOffset(weekOffset - 1)}
          className="p-2.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-all duration-200 text-white hover:scale-105 active:scale-95"
          aria-label="Forrige uke"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center flex-1 px-4">
          <div className="text-lg font-semibold text-white">
            Uke {currentWeekNumber}, {currentYear}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{weekRange}</div>
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekOffset(0)}
              className="mt-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              aria-label="Gå til inneværende uke"
            >
              Gå til inneværende uke
            </button>
          )}
        </div>
        <button
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="p-2.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-all duration-200 text-white hover:scale-105 active:scale-95"
          aria-label="Neste uke"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      {allDays.map((d, index) => {
        const dateStr = d.format("YYYY-MM-DD");
        const prevDay = index > 0 ? allDays[index - 1] : null;
        const isNewWeek =
          prevDay && d.week() !== prevDay.week();
        const isToday = d.isSame(today, "day");
        return (
          <div key={dateStr}>
            {isNewWeek && (
              <div className="my-6 border-t border-slate-700/30">
                <div className="mt-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Uke {d.week()}
                </div>
              </div>
            )}
            <div className={`p-4 rounded-xl shadow-lg transition-all duration-200 ${
              isToday 
                ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-2 border-blue-400/50" 
                : "bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50"
            }`}>
              <div className={`text-sm font-semibold capitalize flex items-center gap-2 mb-3 ${
                isToday ? "text-blue-300" : "text-slate-300"
              }`}>
                {isToday && (
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                )}
                {d.format("dddd DD.MM")}
              </div>
              <div className="flex gap-3">
              {SLOTS.map((slot) => {
                const key = `${dateStr}-${slot.id}`;
                const who = data[key] ?? null;
                const isLoading = loading && Object.keys(data).length === 0;
                return (
                  <button
                    key={slot.id}
                    onClick={() => handleClick(dateStr, slot.id)}
                    disabled={loading}
                    className={`flex-1 rounded-xl py-4 px-3 text-sm font-medium relative overflow-hidden transition-all duration-200
                      ${who === "person1"
                        ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                        : who === "person2"
                        ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                        : "bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500"}
                      ${isLoading ? "animate-pulse-slow" : ""}
                      ${loading ? "cursor-wait" : "cursor-pointer"}
                    `}
                  >
                    {isLoading && (
                      <div className="animate-shimmer" />
                    )}
                    <div className="relative z-10">
                      <div className={`text-xs font-medium mb-1.5 ${
                        who ? "text-white/90" : "text-slate-400"
                      }`}>
                        {slot.label}
                      </div>
                      <div className={`text-lg font-bold ${
                        who ? "text-white drop-shadow-sm" : "text-slate-500"
                      }`}>
                        {who ? PEOPLE[who] : loading && Object.keys(data).length === 0 ? "…" : "-"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
