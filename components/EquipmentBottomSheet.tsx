"use client";

import { useEffect } from "react";

interface EquipmentItem {
  item_key: string;
  status: "ok" | "missing";
}

interface EquipmentBottomSheetProps {
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

export default function EquipmentBottomSheet({
  isOpen,
  onClose,
  items,
  onUpdateItem,
}: EquipmentBottomSheetProps) {
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleItem = (itemKey: string, currentStatus: "ok" | "missing") => {
    const newStatus = currentStatus === "ok" ? "missing" : "ok";
    onUpdateItem(itemKey, newStatus);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/50 animate-[fadeIn_0.3s_ease-out]" />
      <div className="absolute bottom-0 left-0 right-0 w-full bg-slate-800 rounded-t-2xl max-h-[80vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]">
        <div className="p-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            Hva mangler i barnehagen?
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.item_key}
              className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg"
            >
              <span className="text-white font-medium">
                {ITEM_LABELS[item.item_key] || item.item_key}
              </span>
              <button
                onClick={() => toggleItem(item.item_key, item.status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  item.status === "ok"
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {item.status === "ok" ? "OK" : "Mangler"}
              </button>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}

