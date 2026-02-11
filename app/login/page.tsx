"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // If already logged in, redirect to home
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        router.replace("/");
      } else {
        setCheckingSession(false);
      }
    });
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.replace("/");
    }
  };

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-slate-400 text-sm">Laster…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-xl shadow p-6 w-full max-w-sm space-y-4 text-black"
      >
        <h1 className="text-lg font-semibold">Logg inn</h1>
        <p className="text-sm text-gray-500">
          Logg inn med e-post og passord.
        </p>
        <input
          type="email"
          placeholder="E-post"
          className="w-full border rounded-md px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        <input
          type="password"
          placeholder="Passord"
          className="w-full border rounded-md px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded-md disabled:opacity-50"
        >
          {loading ? "Logger inn…" : "Logg inn"}
        </button>
      </form>
    </main>
  );
}
