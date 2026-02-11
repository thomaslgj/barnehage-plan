type Who = "person1" | "person2" | null;

interface ScheduleSlotProps {
  slotId: "dropoff" | "pickup";
  who: Who;
  displayName?: string;
  isLoading?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  showLabel?: boolean;
  isInHero?: boolean;
}

export default function ScheduleSlot({ 
  slotId, 
  who, 
  displayName,
  isLoading = false, 
  onClick, 
  disabled = false,
  showLabel = false,
  isInHero = false
}: ScheduleSlotProps) {
  const getPersonColorClass = (who: Who) => {
    const shadowClass = isInHero ? "" : "shadow-md hover:shadow-lg";
    if (who === "person1") {
      return `bg-gradient-to-br from-emerald-600 to-teal-700 text-white ${shadowClass}`;
    }
    if (who === "person2") {
      return `bg-gradient-to-br from-amber-500 to-orange-600 text-white ${shadowClass}`;
    }
    return "bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700 hover:border-slate-500";
  };

  const isClickable = onClick && !disabled;
  const Component = isClickable ? "button" : "div";
  const paddingY = isInHero ? "py-3" : "py-2.5";
  const paddingX = isInHero ? "px-2.5" : "px-2";
  const baseClasses = `flex-1 rounded-lg ${paddingY} ${paddingX} text-xs font-medium relative overflow-hidden transition-all duration-200 ${getPersonColorClass(who)}`;
  const interactiveClasses = isClickable 
    ? "hover:scale-[1.02] active:scale-[0.98] cursor-pointer" 
    : "";
  const loadingClasses = isLoading ? "animate-pulse-slow" : "";
  const disabledClasses = disabled ? "cursor-wait" : "";

  const label = who
    ? (displayName ?? "?")
    : isLoading
      ? "…"
      : "-";

  return (
    <Component
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${interactiveClasses} ${loadingClasses} ${disabledClasses}`}
    >
      {isLoading && (
        <div className="animate-shimmer" />
      )}
      <div className="relative z-10 text-center">
        {showLabel && (
          <div className={`text-[10px] font-medium mb-0.5 ${
            who ? "text-white/90" : "text-slate-400"
          }`}>
            {slotId === "dropoff" ? "Levering" : "Henting"}
          </div>
        )}
        <div className="flex items-center justify-center mb-1">
          {slotId === "dropoff" ? (
            <svg className={`w-4 h-4 ${who ? "text-white/90" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          ) : (
            <svg className={`w-4 h-4 ${who ? "text-white/90" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
            </svg>
          )}
        </div>
        <div className={`${isInHero ? "text-xl" : "text-base"} font-bold ${
          who ? "text-white drop-shadow-sm" : "text-slate-500"
        }`}>
          {label}
        </div>
      </div>
    </Component>
  );
}
