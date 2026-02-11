"use client";

import { useEffect } from "react";

interface EquipmentItem {
  item_key: string;
  status: "ok" | "missing";
}

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: EquipmentItem[];
  onUpdateItem: (itemKey: string, status: "ok" | "missing") => void;
}

const ITEM_LABELS: Record<string, string> = {
  rain_gear: "Regntøy",
  change_clothes: "Skift",
  wool: "Ull",
  diapers: "Bleier/truser",
};

export default function EquipmentModal({
  isOpen,
  onClose,
  items,
  onUpdateItem,
}: EquipmentModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const markAsSentHome = (itemKey: string) => {
    onUpdateItem(itemKey, "missing");
    onClose();
  };

  const allOk = () => {
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-md bg-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Ble noe sendt hjem i dag?
        </h2>
        <div className="space-y-2 mb-6">
          {items
            .filter((item) => item.status === "ok")
            .map((item) => (
              <button
                key={item.item_key}
                onClick={() => markAsSentHome(item.item_key)}
                className="w-full text-left p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-white transition-colors"
              >
                {ITEM_LABELS[item.item_key] || item.item_key}
              </button>
            ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={allOk}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Alt OK
          </button>
          <button
            onClick={onClose}
            className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
}

