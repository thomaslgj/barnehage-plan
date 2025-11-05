"use client";

import { useEffect, useState } from "react";
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

  // sett norsk locale
  dayjs.locale("nb");

  // generer 2 uker med hverdager, starter med mandag i inneværende uke
  const today = dayjs();
  const start = today.startOf("isoWeek"); // mandag i inneværende uke (ISO uke starter på mandag)
  const allDays = Array.from({ length: 14 })
    .map((_, i) => start.add(i, "day"))
    .filter((d) => d.day() !== 6 && d.day() !== 0);

  const from = allDays[0].format("YYYY-MM-DD");
  const to = allDays[allDays.length - 1].format("YYYY-MM-DD");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await fetch(`/api/schedule?from=${from}&to=${to}`);
      const json = await res.json();
      const next: Record<string, Who> = {};
      json.forEach((row: { date: string; slot: string; who: Who }) => {
        const key = `${row.date}-${row.slot}`;
        next[key] = (row.who as Who) ?? null;
      });
      setData(next);
      setLoading(false);
    };
    fetchData();
  }, [from, to]);

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

  return (
    <div className="">
      {allDays.map((d, index) => {
        const dateStr = d.format("YYYY-MM-DD");
        const prevDay = index > 0 ? allDays[index - 1] : null;
        const isNewWeek =
          prevDay && d.week() !== prevDay.week();
        const isToday = d.isSame(today, "day");
        return (
          <div key={dateStr}>
            {isNewWeek && (
              <div className="my-4 border-t border-gray-200">
                <div className="mt-3 text-xs font-semibold text-gray-200 uppercase tracking-wide">
                  Uke {d.week()}
                </div>
              </div>
            )}
            <div className={`p-3 border-t-4 border-gray-600 ${isToday ? "bg-blue-100" : "bg-white"}`}>
              <div className={`text-sm font-semibold capitalize flex items-center gap-2 ${isToday ? "text-blue-600" : "text-gray-700"}`}>
                {isToday && (
                  <span className="text-blue-500">●</span>
                )}
                {d.format("dddd DD.MM")}
              </div>
              <div className="flex gap-2 mt-2">
              {SLOTS.map((slot) => {
                const key = `${dateStr}-${slot.id}`;
                const who = data[key] ?? null;
                return (
                  <button
                    key={slot.id}
                    onClick={() => handleClick(dateStr, slot.id)}
                    disabled={loading}
                    className={`flex-1 rounded-lg py-3 text-sm font-medium border-1 border-black
                      ${who === "person1"
                        ? "bg-green-200 text-black"
                        : who === "person2"
                        ? "bg-blue-200 text-black"
                        : "bg-gray-100"}
                      ${loading ? "opacity-50" : ""}
                    `}
                  >
                    <div className="text-xs text-gray-600">{slot.label}</div>
                    <div className="text-lg">
                      {who ? PEOPLE[who] : loading ? "…" : "-"}
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
