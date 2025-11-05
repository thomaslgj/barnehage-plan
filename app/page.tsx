import Schedule from "@/components/Schedule";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-800 p-4">
      <h1 className="text-xl font-bold text-white mb-4">Barnehage-plan</h1>
      <Schedule />
    </main>
  );
}
