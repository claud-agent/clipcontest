import WaitlistForm from "./WaitlistForm";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/10 blur-3xl" />
      </div>

      {/* Badge */}
      <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-sm font-medium">
        <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
        Jetzt in der Beta — trag dich ein
      </div>

      {/* Headline */}
      <h1 className="max-w-4xl text-center text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight">
        <span className="text-white">Dein Clip-Contest.</span>
        <br />
        <span className="text-gradient">Live. Fair. Automatisch.</span>
      </h1>

      {/* Subheadline */}
      <p className="mt-6 max-w-2xl text-center text-lg sm:text-xl text-gray-400 leading-relaxed">
        Starte einen Contest auf TikTok, tracke Views in Echtzeit, zeige ein
        Live-Leaderboard und zahle automatisch an 1–3 Gewinner aus.
        <br />
        <strong className="text-white">Alles über uns — kein Aufwand für dich.</strong>
      </p>

      {/* CTA Stats */}
      <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="text-brand-400">✓</span> Anti-Botting inklusive
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-brand-400">✓</span> Auszahlung über uns
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-brand-400">✓</span> Setup in unter 5 Minuten
        </span>
      </div>

      {/* Waitlist Form */}
      <div id="waitlist" className="mt-12 w-full max-w-md">
        <WaitlistForm />
      </div>

      {/* Social proof placeholder */}
      <p className="mt-6 text-sm text-gray-600">
        Bereits{" "}
        <span className="text-gray-400 font-semibold">247 Creator & Brands</span> auf
        der Warteliste
      </p>
    </section>
  );
}
