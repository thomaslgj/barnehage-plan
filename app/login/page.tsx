"use client";

import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      // gå til forsiden
      window.location.href = "/";
    } else {
      setError("Feil passord");
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-xl shadow p-6 w-full max-w-sm space-y-4 text-black"
      >
        <h1 className="text-lg font-semibold">Logg inn</h1>
        <p className="text-sm text-gray-500">
          Skriv inn vårt passord.
        </p>
        <input
          type="password"
          className="w-full border rounded-md px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded-md"
        >
          Logg inn
        </button>
      </form>
    </main>
  );
}
