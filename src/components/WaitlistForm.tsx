"use client";

import { useState } from "react";

type Role = "creator" | "participant";

export default function WaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("creator");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Etwas ist schiefgelaufen.");
      }

      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Unbekannter Fehler");
    }
  }

  if (status === "success") {
    return (
      <div className="w-full p-6 rounded-2xl border border-brand-500/30 bg-brand-500/10 text-center">
        <div className="text-3xl mb-3">🎉</div>
        <h3 className="text-white font-bold text-lg mb-1">Du bist dabei!</h3>
        <p className="text-gray-400 text-sm">
          Wir haben dir eine Bestätigungs-E-Mail geschickt. Wir melden uns,
          sobald ClipContest live geht.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full p-6 rounded-2xl border border-white/10 bg-white/3 backdrop-blur-sm"
    >
      <h3 className="text-white font-bold text-lg mb-1">
        Jetzt auf die Warteliste
      </h3>
      <p className="text-gray-500 text-sm mb-5">
        Sei dabei, wenn wir launchen — und sichere dir den Beta-Preis.
      </p>

      {/* Name */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Name
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dein Name"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500 transition-colors"
        />
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          E-Mail
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="du@beispiel.de"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500 transition-colors"
        />
      </div>

      {/* Role */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Ich bin...
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole("creator")}
            className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
              role === "creator"
                ? "bg-brand-500 text-white"
                : "bg-white/5 border border-white/10 text-gray-400 hover:border-brand-500/40"
            }`}
          >
            🎯 Veranstalter
          </button>
          <button
            type="button"
            onClick={() => setRole("participant")}
            className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-colors ${
              role === "participant"
                ? "bg-brand-500 text-white"
                : "bg-white/5 border border-white/10 text-gray-400 hover:border-brand-500/40"
            }`}
          >
            🎬 Teilnehmer
          </button>
        </div>
      </div>

      {/* Error */}
      {status === "error" && (
        <p className="mb-4 text-red-400 text-sm">{errorMessage}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-white font-semibold text-sm glow"
      >
        {status === "loading" ? "Wird eingetragen…" : "Auf die Warteliste →"}
      </button>

      <p className="mt-3 text-center text-xs text-gray-700">
        Kein Spam. Kein Abo. Jederzeit abmeldbar.
      </p>
    </form>
  );
}
