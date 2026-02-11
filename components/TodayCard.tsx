"use client";

import { useState, useEffect } from "react";
import ScheduleSlot from "./ScheduleSlot";
import EquipmentStatusBadge from "./EquipmentStatusBadge";
import EquipmentBottomSheet from "./EquipmentBottomSheet";
import EquipmentModal from "./EquipmentModal";

type Who = "person1" | "person2" | null;

interface EquipmentItem {
  item_key: string;
  status: "ok" | "missing";
}

interface TodayCardProps {
  label: string;
  isToday: boolean;
  dropoff: Who;
  pickup: Who;
}

const DEFAULT_ITEMS: EquipmentItem[] = [
  { item_key: "rain_gear", status: "ok" },
  { item_key: "change_clothes", status: "ok" },
  { item_key: "wool", status: "ok" },
  { item_key: "diapers", status: "ok" },
];

export default function TodayCard({ label, isToday, dropoff, pickup }: TodayCardProps) {
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>(DEFAULT_ITEMS);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Sjekk om vi allerede har vist modal i dag
  const [hasShownModalToday, setHasShownModalToday] = useState(() => {
    if (typeof window === "undefined") return false;
    const lastShown = localStorage.getItem("equipmentModalShown");
    const today = new Date().toDateString();
    return lastShown === today;
  });

  // Hent equipment status
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const res = await fetch("/api/equipment");
        const data = await res.json();
        if (data && data.length > 0) {
          setEquipmentItems(data);
        }
      } catch (error) {
        console.error("Feil ved henting av equipment:", error);
      }
    };
    fetchEquipment();
  }, []);

  // Sjekk om vi skal vise modal kl 16 (når man går fra "I dag" til "I morgen")
  // Modal skal vises når det er kl 16+ og vi er i "I morgen"-modus (ikke isToday)
  useEffect(() => {
    // Modal skal kun vises når vi er i "I morgen"-modus (isToday = false)
    // og det er kl 16 eller senere
    if (isToday || hasShownModalToday) return;

    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Sjekk om det er kl 16 eller senere (overgang fra "I dag" til "I morgen")
      // og om vi har items som er "ok" (som kan ha blitt sendt hjem)
      if (hour >= 16) {
        const hasOkItems = equipmentItems.some((item) => item.status === "ok");
        if (hasOkItems) {
          setIsModalOpen(true);
          setHasShownModalToday(true);
          // Lagre i localStorage at vi har vist modal i dag
          if (typeof window !== "undefined") {
            const today = new Date().toDateString();
            localStorage.setItem("equipmentModalShown", today);
          }
        }
      }
    };

    // Sjekk umiddelbart og deretter hvert minutt
    checkTime();
    const interval = setInterval(checkTime, 60000);

    return () => clearInterval(interval);
  }, [isToday, equipmentItems, hasShownModalToday]);

  // Beregn status
  const getEquipmentStatus = (): "ready" | "missing" | "not_ready" => {
    const missingItems = equipmentItems.filter((item) => item.status === "missing");
    if (missingItems.length === 0) {
      return "ready";
    } else if (missingItems.length < equipmentItems.length) {
      return "missing";
    } else {
      return "not_ready";
    }
  };

  const handleUpdateItem = async (itemKey: string, status: "ok" | "missing") => {
    try {
      await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_key: itemKey, status }),
      });
      
      setEquipmentItems((prev) =>
        prev.map((item) =>
          item.item_key === itemKey ? { ...item, status } : item
        )
      );
    } catch (error) {
      console.error("Feil ved oppdatering av equipment:", error);
    }
  };

  const equipmentStatus = getEquipmentStatus();

  return (
    <>
      <div className="mt-4 mb-6">
        <div className={`rounded-xl p-5 border ${
          !isToday 
            ? "bg-slate-800/50 border-slate-700/50"
            : "bg-slate-800/50 border-slate-600/80"
        }`}>
          <div className={`mb-4 ${
            isToday ? "text-white font-black text-2xl tracking-wide" : "text-slate-300 text-xl font-bold"
          }`}>
            {isToday ? label.toUpperCase() : label}
          </div>
          <div className="flex gap-3 mb-4">
            {dropoff && (
              <ScheduleSlot slotId="dropoff" who={dropoff} isInHero={true} />
            )}
            {pickup && (
              <ScheduleSlot slotId="pickup" who={pickup} isInHero={true} />
            )}
            {!dropoff && !pickup && (
              <div className={`text-sm py-2 ${
                isToday ? "text-slate-400" : "text-slate-400"
              }`}>
                Ingen oppgaver {isToday ? "i dag" : "i morgen"}
              </div>
            )}
          </div>
          {isToday && (
            <EquipmentStatusBadge
              status={equipmentStatus}
              onClick={() => setIsBottomSheetOpen(true)}
            />
          )}
        </div>
      </div>
      <EquipmentBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        items={equipmentItems}
        onUpdateItem={handleUpdateItem}
      />
      <EquipmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        items={equipmentItems}
        onUpdateItem={handleUpdateItem}
      />
    </>
  );
}

