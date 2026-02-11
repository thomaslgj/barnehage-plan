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
          bgColor: "bg-green-600",
          hoverColor: "hover:bg-green-700",
          textColor: "text-white",
        };
      case "missing":
        return {
          text: "Mangler noe",
          bgColor: "bg-yellow-600",
          hoverColor: "hover:bg-yellow-700",
          textColor: "text-white",
        };
      case "not_ready":
        return {
          text: "Ikke barnehageklar",
          bgColor: "bg-red-600",
          hoverColor: "hover:bg-red-700",
          textColor: "text-white",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <button
      onClick={onClick}
      className={`${config.bgColor} ${config.hoverColor} ${config.textColor} px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer w-full`}
    >
      {config.text}
    </button>
  );
}

