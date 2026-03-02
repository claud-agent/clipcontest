const steps = [
  {
    number: "01",
    title: "Contest erstellen",
    description:
      "Du gibst Plattform, Zeitraum, Hashtag und Preispool ein. Unser Wizard führt dich durch alles in unter 5 Minuten.",
    icon: "🎯",
  },
  {
    number: "02",
    title: "Creator reichen ein",
    description:
      "Teilnehmer teilen ihren Video-Link direkt über deine Contest-Seite. Wir validieren automatisch und starten das Tracking.",
    icon: "📲",
  },
  {
    number: "03",
    title: "Live-Leaderboard",
    description:
      "Views und Engagement werden alle 15 Minuten aktualisiert. Dein Leaderboard läuft öffentlich — Creator und Fans sehen den Rang in Echtzeit.",
    icon: "📊",
  },
  {
    number: "04",
    title: "Gewinner + Auszahlung",
    description:
      "Nach Contest-Ende frieren wir die Ergebnisse ein, du bestätigst die Gewinner (oder wir tun es automatisch), und wir zahlen direkt aus.",
    icon: "🏆",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 px-6" id="how-it-works">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-brand-400 font-semibold text-sm uppercase tracking-widest mb-3">
            So funktioniert&apos;s
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Von 0 zum Contest in 4 Schritten
          </h2>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 gap-6">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative p-6 rounded-2xl border border-white/8 bg-white/3 hover:border-brand-500/30 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-brand-500/15 flex items-center justify-center text-2xl">
                  {step.icon}
                </div>
                <div>
                  <p className="text-brand-500 text-xs font-bold uppercase tracking-wider mb-1">
                    Schritt {step.number}
                  </p>
                  <h3 className="text-white font-bold text-lg mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
