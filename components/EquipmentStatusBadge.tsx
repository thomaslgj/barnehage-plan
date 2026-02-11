"use client";

interface EquipmentStatusBadgeProps {
  status: "ready" | "missing" | "not_ready";
  onClick: () => void;
}

export default function EquipmentStatusBadge({
  status,
  onClick,
}: EquipmentStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "ready":
        return {
          text: "Barnehageklar",
          dotColor: "bg-green-500",
          textColor: "text-slate-300",
          hoverColor: "hover:bg-slate-700/50",
        };
      case "missing":
        return {
          text: "Mangler noe",
          dotColor: "bg-yellow-500",
          textColor: "text-slate-300",
          hoverColor: "hover:bg-slate-700/50",
        };
      case "not_ready":
        return {
          text: "Ikke barnehageklar",
          dotColor: "bg-red-500",
          textColor: "text-slate-300",
          hoverColor: "hover:bg-slate-700/50",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 ${config.textColor} ${config.hoverColor} px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer w-full`}
    >
      <span className={`w-2 h-2 ${config.dotColor} rounded-full`}></span>
      {config.text}
    </button>
  );
}

