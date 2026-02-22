"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useHousehold } from "@/lib/HouseholdContext";

export default function Onboarding() {
  const { refresh } = useHousehold();
  const [householdName, setHouseholdName] = useState("");
  const [myName, setMyName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [parentCount, setParentCount] = useState<1 | 2>(2);

  const [inviteCode, setInviteCode] = useState("");
  const [joinDisplayName, setJoinDisplayName] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myName.trim()) {
      setError("Du må fylle inn ditt navn.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const { error: rpcError } = await supabase.rpc("bootstrap_household", {
        p_name: householdName || "Min husstand",
        p_my_display_name: myName.trim(),
        p_partner_display_name:
          parentCount === 2 && partnerName.trim()
            ? partnerName.trim()
            : null,
      });

      if (rpcError) {
        setError(rpcError.message);
        setLoading(false);
        return;
      }

      await refresh();
    } catch {
      setError("Noe gikk galt. Prøv igjen.");
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: rpcError } = await supabase.rpc(
        "accept_household_invite",
        {
          invite_code: inviteCode,
          display_name: joinDisplayName || null,
        }
      );

      if (rpcError) {
        setError(rpcError.message);
        setLoading(false);
        return;
      }

      await refresh();
    } catch {
      setError("Noe gikk galt. Prøv igjen.");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-xl font-bold text-white text-center">
          Velkommen!
        </h1>
        <p className="text-sm text-slate-400 text-center">
          Opprett en ny husstand eller bli med i en eksisterende.
        </p>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Create household */}
        <form
          onSubmit={handleCreate}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3"
        >
          <h2 className="text-sm font-semibold text-white">
            Opprett husstand
          </h2>

          <input
            type="text"
            placeholder="Husstandsnavn (valgfritt)"
            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-md px-3 py-2 text-sm text-white placeholder-slate-400"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
          />

          {/* Parent count toggle */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">
              Antall foreldre
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setParentCount(1)}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  parentCount === 1
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700/50 text-slate-400 hover:text-white"
                }`}
              >
                1
              </button>
              <button
                type="button"
                onClick={() => setParentCount(2)}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  parentCount === 2
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700/50 text-slate-400 hover:text-white"
                }`}
              >
                2
              </button>
            </div>
          </div>

          <input
            type="text"
            placeholder="Ditt navn"
            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-md px-3 py-2 text-sm text-white placeholder-slate-400"
            value={myName}
            onChange={(e) => setMyName(e.target.value)}
            required
          />

          {parentCount === 2 && (
            <input
              type="text"
              placeholder="Partners navn"
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-md px-3 py-2 text-sm text-white placeholder-slate-400"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? "Oppretter…" : "Opprett"}
          </button>
        </form>

        {/* Join household */}
        <form
          onSubmit={handleJoin}
          className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-3"
        >
          <h2 className="text-sm font-semibold text-white">
            Bli med via invitasjonskode
          </h2>
          <input
            type="text"
            placeholder="Invitasjonskode"
            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-md px-3 py-2 text-sm text-white placeholder-slate-400"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Ditt navn (valgfritt)"
            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-md px-3 py-2 text-sm text-white placeholder-slate-400"
            value={joinDisplayName}
            onChange={(e) => setJoinDisplayName(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading || !inviteCode}
            className="w-full bg-slate-600 hover:bg-slate-500 text-white py-2 rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? "Blir med…" : "Bli med"}
          </button>
        </form>

        <button
          onClick={handleLogout}
          className="w-full text-slate-500 hover:text-slate-300 text-xs py-2 transition-colors"
        >
          Logg ut
        </button>
      </div>
    </div>
  );
}
