const plans = [
  {
    name: "Starter",
    price: "149",
    unit: "pro Contest",
    description: "Perfekt für den ersten Contest",
    features: [
      "1 Plattform (TikTok)",
      "Bis zu 50 Einreichungen",
      "Live-Leaderboard",
      "1 Gewinner",
      "Auszahlung über uns",
      "Anti-Botting inklusive",
    ],
    highlighted: false,
  },
  {
    name: "Growth",
    price: "349",
    unit: "pro Contest",
    description: "Für größere Kampagnen",
    features: [
      "1 Plattform (TikTok)",
      "Unbegrenzte Einreichungen",
      "Live-Leaderboard",
      "Bis zu 3 Gewinner",
      "Auszahlung über uns",
      "Anti-Botting + Review-Queue",
      "Eigene Contest-URL",
      "E-Mail Support",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Auf Anfrage",
    unit: "",
    description: "Für Agencies und große Brands",
    features: [
      "Mehrere Plattformen",
      "White-Label Contest-Seite",
      "Dedicated Support",
      "Custom Anti-Botting",
      "API-Zugang",
      "Individuelle Auszahlung",
    ],
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section className="py-28 px-6" id="pricing">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-brand-400 font-semibold text-[13px] uppercase tracking-[0.15em] mb-3">
            Preise
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Einfach. Transparent. Fixpreis.
          </h2>
          <p className="mt-4 text-gray-400 text-[15px] max-w-md mx-auto">
            Kein Abo, keine versteckten Gebühren. Du zahlst pro Contest.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 ${
                plan.highlighted
                  ? "border-brand-500/40 bg-brand-500/[0.06] glow-subtle"
                  : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-brand-500 text-white text-[11px] font-semibold">
                  Empfohlen
                </div>
              )}

              <div className="mb-6">
                <p className="text-gray-400 text-[13px] font-medium">{plan.name}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  {plan.unit ? (
                    <>
                      <span className="text-3xl font-bold text-white">€{plan.price}</span>
                      <span className="text-gray-500 text-[13px]">/{plan.unit}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-white">{plan.price}</span>
                  )}
                </div>
                <p className="mt-2 text-gray-500 text-[13px]">{plan.description}</p>
              </div>

              <div className="flex-1 space-y-3 mb-6">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-[13px] text-gray-300">
                    <svg className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </div>
                ))}
              </div>

              <a
                href="#waitlist"
                className={`w-full text-center py-2.5 rounded-lg font-semibold text-[13px] transition-all duration-200 ${
                  plan.highlighted
                    ? "bg-brand-500 hover:bg-brand-400 text-white"
                    : "bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.06]"
                }`}
              >
                {plan.highlighted ? "Warteliste" : plan.name === "Enterprise" ? "Kontakt" : "Warteliste"}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-gray-600 text-[12px]">
          * Beta-Preise. Wartelistenmitglieder erhalten garantiert den Beta-Preis.
        </p>
      </div>
    </section>
  );
}
