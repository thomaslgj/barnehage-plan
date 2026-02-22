"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import dayjs from "dayjs";
import "dayjs/locale/nb";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isoWeek from "dayjs/plugin/isoWeek";
import TodayCard from "./TodayCard";
import ScheduleSlot from "./ScheduleSlot";
import { supabase } from "@/lib/supabase";
import { useHousehold } from "@/lib/HouseholdContext";

dayjs.extend(weekOfYear);
dayjs.extend(isoWeek);

type Who = "person1" | "person2" | null;

interface HouseholdMember {
  id: string;
  user_id: string | null;
  display_name: string | null;
}

const SLOTS = [
  { id: "dropoff", label: "Levering" },
  { id: "pickup", label: "Henting" },
];

export default function Schedule() {
  const { householdId, childId, user } = useHousehold();
  const [data, setData] = useState<Record<string, Who>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [members, setMembers] = useState<HouseholdMember[]>([]);

  // sett norsk locale
  dayjs.locale("nb");

  // Build member ↔ personKey maps
  // Members may have user_id=null (placeholder partner), use member.id as fallback key
  const memberMaps = useMemo(() => {
    const u2p = new Map<string, Who>();
    const p2u = new Map<string, string>();
    const p2d = new Map<string, string>();
    const keys: ("person1" | "person2")[] = ["person1", "person2"];

    members.forEach((m, i) => {
      if (i < keys.length) {
        const key = keys[i];
        // Use user_id if present, otherwise the member row id (for placeholder partners)
        const memberId = m.user_id || m.id;
        u2p.set(memberId, key);
        p2u.set(key, memberId);
        p2d.set(key, m.display_name || (m.user_id ? m.user_id.slice(0, 8) : "Partner"));
      }
    });

    const order: Who[] = [
      null,
      ...members.slice(0, 2).map((_, i) => keys[i]),
    ];

    return {
      userIdToPersonKey: u2p,
      personKeyToUserId: p2u,
      personKeyToDisplayName: p2d,
      ORDER: order,
    };
  }, [members]);

  // Memoize date range to avoid React Compiler issues
  const dateRange = useMemo(() => {
    const today = dayjs();
    const currentWeekStart = today.startOf("isoWeek");
    const start = currentWeekStart.add(weekOffset, "week");
    const allDays = Array.from({ length: 14 })
      .map((_, i) => start.add(i, "day"))
      .filter((d) => d.day() !== 6 && d.day() !== 0);

    return {
      today,
      start,
      allDays,
      from: allDays[0].format("YYYY-MM-DD"),
      to: allDays[allDays.length - 1].format("YYYY-MM-DD"),
    };
  }, [weekOffset]);

  const { today, start, allDays, from, to } = dateRange;

  // Fetch household members
  useEffect(() => {
    if (!householdId) return;

    supabase
      .from("household_members")
      .select("id, user_id, display_name")
      .eq("household_id", householdId)
      .then(({ data: membersData, error: membersError }) => {
        if (membersError) {
          setError(membersError.message);
          return;
        }
        setMembers(membersData || []);
      });
  }, [householdId]);

  // Keep a ref to the latest fetch params so intervals/focus can call without stale closures
  const fetchRef = useRef<(() => Promise<void>) | null>(null);

  // Primary data fetch — runs when childId, date range, or member mapping changes
  useEffect(() => {
    if (!childId || members.length === 0) return;

    let cancelled = false;

    const doFetch = async (showLoading: boolean) => {
      if (showLoading) setLoading(true);
      setError(null);

      const { data: assignments, error: fetchError } = await supabase
        .from("schedule_assignments")
        .select("date, slot, assigned_user_id")
        .eq("child_id", childId)
        .gte("date", from)
        .lte("date", to);

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        if (showLoading) setLoading(false);
        return;
      }

      const next: Record<string, Who> = {};
      (assignments || []).forEach(
        (row: { date: string; slot: string; assigned_user_id: string }) => {
          const key = `${row.date}-${row.slot}`;
          next[key] =
            memberMaps.userIdToPersonKey.get(row.assigned_user_id) ?? null;
        }
      );
      setData(next);
      if (showLoading) setLoading(false);
    };

    // Store a silent refetch for timers / focus
    fetchRef.current = () => doFetch(false);

    doFetch(true);

    return () => {
      cancelled = true;
    };
  }, [childId, from, to, members, memberMaps]);

  // Auto-refresh every 10 s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRef.current?.();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Refresh on window focus
  useEffect(() => {
    const handleFocus = () => fetchRef.current?.();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const handleClick = async (dateStr: string, slot: string) => {
    if (!childId || !householdId || !user) return;

    const key = `${dateStr}-${slot}`;
    const current = data[key] ?? null;
    const idx = memberMaps.ORDER.indexOf(current);
    const next = memberMaps.ORDER[(idx + 1) % memberMaps.ORDER.length];

    // optimistic update
    setData((prev) => ({ ...prev, [key]: next }));

    if (next === null) {
      // Delete assignment
      const { error: delError } = await supabase
        .from("schedule_assignments")
        .delete()
        .eq("child_id", childId)
        .eq("date", dateStr)
        .eq("slot", slot);

      if (delError) {
        setError(delError.message);
        setData((prev) => ({ ...prev, [key]: current }));
      }
    } else {
      const assignedUserId = memberMaps.personKeyToUserId.get(next);
      if (!assignedUserId) return;

      const { error: upsertError } = await supabase
        .from("schedule_assignments")
        .upsert(
          {
            household_id: householdId,
            child_id: childId,
            date: dateStr,
            slot,
            assigned_user_id: assignedUserId,
            updated_by: user.id,
          },
          { onConflict: "child_id,date,slot" }
        );

      if (upsertError) {
        setError(upsertError.message);
        setData((prev) => ({ ...prev, [key]: current }));
      }
    }
  };

  const currentWeekNumber = start.week();
  const currentYear = start.year();
  const weekRange = `${allDays[0].format("DD.MM")} - ${allDays[allDays.length - 1].format("DD.MM")}`;

  const isCurrentWeek = weekOffset === 0;

  // Bestem hvilken dag som skal vises basert på klokkeslett
  const currentHour = today.hour();
  const showTomorrow = currentHour >= 15 || currentHour < 3;
  const targetDate = showTomorrow ? today.add(1, "day") : today;
  const targetDateStr = targetDate.format("YYYY-MM-DD");
  const label = showTomorrow ? "I morgen" : "I dag";

  const targetDropoff = data[`${targetDateStr}-dropoff`] ?? null;
  const targetPickup = data[`${targetDateStr}-pickup`] ?? null;

  const hasAnyAssignments = Object.keys(data).length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      {/* I dag/I morgen kort – kun vises for inneværende uke */}
      {isCurrentWeek && (
        <TodayCard
          label={label}
          isToday={!showTomorrow}
          dropoff={targetDropoff}
          pickup={targetPickup}
          dropoffName={targetDropoff ? memberMaps.personKeyToDisplayName.get(targetDropoff) : undefined}
          pickupName={targetPickup ? memberMaps.personKeyToDisplayName.get(targetPickup) : undefined}
        />
      )}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setWeekOffset(weekOffset - 1)}
          className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-all duration-200 text-white hover:scale-105 active:scale-95"
          aria-label="Forrige uke"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
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
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Inline error */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-2 text-xs text-red-300 mb-2">
          {error}
        </div>
      )}

      {/* Empty week hint */}
      {!loading && !hasAnyAssignments && (
        <div className="text-center text-slate-400 text-sm py-2 mb-2">
          Tom uke – trykk for å sette
        </div>
      )}

      {/* Tabell-header */}
      <div className="flex gap-2 mb-2 px-1">
        <div className="flex-1 text-center">
          <div className="text-[10px] font-medium text-slate-400">
            Levering
          </div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-[10px] font-medium text-slate-400">Henting</div>
        </div>
      </div>

      {allDays.map((d, index) => {
        const dateStr = d.format("YYYY-MM-DD");
        const prevDay = index > 0 ? allDays[index - 1] : null;
        const isNewWeek = prevDay && d.week() !== prevDay.week();
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
            <div
              className={`p-2.5 rounded-lg shadow-md transition-all duration-200 ${
                isToday
                  ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-2 border-blue-400/50"
                  : "bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/50"
              }`}
            >
              <div
                className={`text-xs font-semibold capitalize flex items-center gap-1.5 mb-2 ${
                  isToday ? "text-blue-300" : "text-slate-300"
                }`}
              >
                {isToday && (
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
                )}
                {d.format("dddd DD.MM")}
              </div>
              <div className="flex gap-2">
                {SLOTS.map((slot) => {
                  const key = `${dateStr}-${slot.id}`;
                  const who = data[key] ?? null;
                  const isSlotLoading =
                    loading && Object.keys(data).length === 0;
                  return (
                    <ScheduleSlot
                      key={slot.id}
                      slotId={slot.id as "dropoff" | "pickup"}
                      who={who}
                      displayName={
                        who
                          ? memberMaps.personKeyToDisplayName.get(who)
                          : undefined
                      }
                      isLoading={isSlotLoading}
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
