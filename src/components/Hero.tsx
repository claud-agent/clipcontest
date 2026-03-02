import WaitlistForm from "./WaitlistForm";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-20 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-brand-500/[0.06] blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-brand-500/[0.03] blur-[80px]" />
      </div>

      {/* Badge */}
      <div className="relative mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.03] text-[13px] text-gray-300">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        Beta — jetzt auf die Warteliste
      </div>

      {/* Headline */}
      <h1 className="relative max-w-3xl text-center text-[clamp(2.5rem,6vw,4.5rem)] font-black tracking-tight leading-[1.05]">
        <span className="text-white">Dein Clip-Contest.</span>
        <br />
        <span className="text-gradient">Live. Fair. Automatisch.</span>
      </h1>

      {/* Subheadline */}
      <p className="relative mt-6 max-w-lg text-center text-[15px] sm:text-base text-gray-400 leading-relaxed">
        Starte einen Contest auf TikTok, tracke Views in Echtzeit, zeige ein
        Live-Leaderboard und zahle automatisch an 1–3 Gewinner aus.
        <span className="block mt-2 text-white font-medium">Kein Aufwand für dich.</span>
      </p>

      {/* Feature pills */}
      <div className="relative mt-8 flex flex-wrap justify-center gap-3">
        {["Anti-Botting", "Auszahlung über uns", "Setup in 5 Min"].map((f) => (
          <span
            key={f}
            className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[13px] text-gray-300"
          >
            {f}
          </span>
        ))}
      </div>

      {/* Waitlist Form */}
      <div id="waitlist" className="relative mt-14 w-full max-w-md">
        <WaitlistForm />
      </div>

      {/* Social proof */}
      <p className="relative mt-6 text-[13px] text-gray-600">
        Bereits <span className="text-gray-400 font-medium">247 Creator & Brands</span> auf der Warteliste
      </p>
    </section>
  );
}
