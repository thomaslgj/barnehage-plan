"use client";

import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import "dayjs/locale/nb";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import TodayCard from "./TodayCard";
import ScheduleSlot from "./ScheduleSlot";

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

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

  // Bestem hvilken dag som skal vises basert på klokkeslett
  // Før kl 15: "I dag", kl 15-03: "I morgen"
  const currentHour = today.hour();
  const showTomorrow = currentHour >= 15 || currentHour < 3;
  const targetDate = showTomorrow ? today.add(1, "day") : today;
  const targetDateStr = targetDate.format("YYYY-MM-DD");
  const label = showTomorrow ? "I morgen" : "I dag";
  
  const targetDropoff = data[`${targetDateStr}-dropoff`] ?? null;
  const targetPickup = data[`${targetDateStr}-pickup`] ?? null;

  return (
    <div className="flex flex-col gap-1.5">
      {/* I dag/I morgen kort - kun vises for inneværende uke */}
      {isCurrentWeek && (
        <TodayCard
          label={label}
          isToday={!showTomorrow}
          dropoff={targetDropoff}
          pickup={targetPickup}
        />
      )}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setWeekOffset(weekOffset - 1)}
          className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-all duration-200 text-white hover:scale-105 active:scale-95"
          aria-label="Forrige uke"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center flex-1 px-3">
          <div className="text-base font-semibold text-white">
            Uke {currentWeekNumber}, {currentYear}
          </div>
          <div className="text-xs text-slate-400">{weekRange}</div>
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekOffset(0)}
              className="mt-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              aria-label="Gå til inneværende uke"
            >
              Gå til inneværende uke
            </button>
          )}
        </div>
        <button
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-all duration-200 text-white hover:scale-105 active:scale-95"
          aria-label="Neste uke"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Tabell-header */}
      <div className="flex gap-2 mb-2 px-1">
        <div className="flex-1 text-center">
          <div className="text-[10px] font-medium text-slate-400">Levering</div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-[10px] font-medium text-slate-400">Henting</div>
        </div>
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
              <div className="my-3 border-t border-slate-700/30">
                <div className="mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Uke {d.week()}
                </div>
              </div>
            )}
            <div className={`p-2.5 rounded-lg shadow-md transition-all duration-200 ${
              isToday 
                ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-2 border-blue-400/50" 
                : "bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50"
            }`}>
              <div className={`text-xs font-semibold capitalize flex items-center gap-1.5 mb-2 ${
                isToday ? "text-blue-300" : "text-slate-300"
              }`}>
                {isToday && (
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                )}
                {d.format("dddd DD.MM")}
              </div>
              <div className="flex gap-2">
              {SLOTS.map((slot) => {
                const key = `${dateStr}-${slot.id}`;
                const who = data[key] ?? null;
                const isLoading = loading && Object.keys(data).length === 0;
                return (
                  <ScheduleSlot
                    key={slot.id}
                    slotId={slot.id as "dropoff" | "pickup"}
                    who={who}
                    isLoading={isLoading}
                    onClick={() => handleClick(dateStr, slot.id)}
                    disabled={loading}
                  />
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
