import Schedule from "@/components/Schedule";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6 tracking-tight">Barnehage-plan</h1>
        <Schedule />
      </div>
    </main>
  );
}
