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
        
        // Merge data fra databasen med default items
        // Dette sikrer at vi alltid viser alle items
        const mergedItems = DEFAULT_ITEMS.map((defaultItem) => {
          const dbItem = data?.find((item: EquipmentItem) => item.item_key === defaultItem.item_key);
          return dbItem || defaultItem;
        });
        
        setEquipmentItems(mergedItems);
      } catch (error) {
        console.error("Feil ved henting av equipment:", error);
        // Hvis det er feil, bruk default items
        setEquipmentItems(DEFAULT_ITEMS);
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

  // Beregn status basert på viktighet
  // Kritisk: rain_gear eller diapers mangler → not_ready (rødt)
  // Ikke-kritisk: change_clothes eller wool mangler → missing (gult)
  const getEquipmentStatus = (): {
    status: "ready" | "missing" | "not_ready";
    missingItems: EquipmentItem[];
  } => {
    const criticalItems = ["rain_gear", "diapers"];
    const nonCriticalItems = ["change_clothes", "wool"];
    
    const allMissing = equipmentItems.filter((item) => item.status === "missing");
    
    // Sjekk om noen kritiske items mangler
    const missingCritical = allMissing.filter((item) =>
      criticalItems.includes(item.item_key)
    );
    
    if (missingCritical.length > 0) {
      return { status: "not_ready", missingItems: missingCritical };
    }
    
    // Sjekk om noen ikke-kritiske items mangler
    const missingNonCritical = allMissing.filter((item) =>
      nonCriticalItems.includes(item.item_key)
    );
    
    if (missingNonCritical.length > 0) {
      return { status: "missing", missingItems: missingNonCritical };
    }
    
    // Alt er ok
    return { status: "ready", missingItems: [] };
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

  const { status: equipmentStatus, missingItems } = getEquipmentStatus();

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
              missingItems={missingItems}
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


