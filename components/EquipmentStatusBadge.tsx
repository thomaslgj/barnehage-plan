"use client";

interface EquipmentItem {
  item_key: string;
  status: "ok" | "missing";
}

interface EquipmentStatusBadgeProps {
  status: "ready" | "missing" | "not_ready";
  onClick: () => void;
  missingItems?: EquipmentItem[];
}

const ITEM_LABELS: Record<string, string> = {
  rain_gear: "Regntøy",
  change_clothes: "Skift",
  wool: "Ull",
  diapers: "Bleier/truser",
};

export default function EquipmentStatusBadge({
  status,
  onClick,
  missingItems = [],
}: EquipmentStatusBadgeProps) {
  const getStatusText = () => {
    if (status === "ready") {
      return "Alt klart for barnehagen";
    }
    
    if (missingItems.length === 0) {
      return status === "not_ready" ? "Må ordnes før i morgen" : "Bør ordnes";
    }
    
    const missingLabels = missingItems
      .map((item) => ITEM_LABELS[item.item_key] || item.item_key)
      .join(", ");
    
    if (status === "not_ready") {
      return `Mangler: ${missingLabels}`;
    } else {
      return `Bør ordnes: ${missingLabels}`;
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case "ready":
        return {
          dotColor: "bg-green-500",
          borderColor: "border-green-500/30",
          hoverBorderColor: "hover:border-green-500/50",
          textColor: "text-slate-200",
          hoverColor: "hover:bg-slate-700/70",
        };
      case "missing":
        return {
          dotColor: "bg-yellow-500",
          borderColor: "border-yellow-500/30",
          hoverBorderColor: "hover:border-yellow-500/50",
          textColor: "text-slate-200",
          hoverColor: "hover:bg-slate-700/70",
        };
      case "not_ready":
        return {
          dotColor: "bg-red-500",
          borderColor: "border-red-500/30",
          hoverBorderColor: "hover:border-red-500/50",
          textColor: "text-slate-200",
          hoverColor: "hover:bg-slate-700/70",
        };
    }
  };

  const config = getStatusConfig();
  const statusText = getStatusText();

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between gap-2 ${config.textColor} ${config.hoverColor} ${config.borderColor} ${config.hoverBorderColor} border px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer w-full active:scale-[0.98]`}
    >
      <div className="flex items-center gap-2">
        {status === "ready" ? (
          <svg
            className="w-5 h-5 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <span className={`w-2.5 h-2.5 ${config.dotColor} rounded-full`}></span>
        )}
        <span className="flex-1 text-left">{statusText}</span>
      </div>
      <svg
        className="w-4 h-4 text-slate-400"
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
  );
}

