import ScheduleSlot from "./ScheduleSlot";

type Who = "person1" | "person2" | null;

interface TodayCardProps {
  label: string;
  isToday: boolean;
  dropoff: Who;
  pickup: Who;
}

export default function TodayCard({ label, isToday, dropoff, pickup }: TodayCardProps) {
  return (
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
        <div className="flex gap-3">
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
      </div>
    </div>
  );
}

