const plans = [
  {
    name: "Starter",
    price: "149",
    unit: "pro Contest",
    description: "Perfekt für deinen ersten Contest",
    features: [
      "1 Plattform (TikTok)",
      "Bis zu 50 Einreichungen",
      "Live-Leaderboard",
      "1 Gewinner",
      "Auszahlung über uns",
      "Anti-Botting inklusive",
    ],
    cta: "Warteliste",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "349",
    unit: "pro Contest",
    description: "Für größere Kampagnen mit mehr Impact",
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
    cta: "Warteliste",
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
      "Custom Anti-Botting Regeln",
      "API-Zugang",
      "Individuelle Auszahlungslogik",
    ],
    cta: "Kontakt",
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section className="py-24 px-6" id="pricing">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-brand-400 font-semibold text-sm uppercase tracking-widest mb-3">
            Preise
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Einfach. Transparent. Fixpreis.
          </h2>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            Kein Abo, keine versteckten Gebühren. Du zahlst pro Contest —
            und weißt vorher genau, was du kriegst.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col p-6 rounded-2xl border transition-colors ${
                plan.highlighted
                  ? "border-brand-500 bg-brand-500/10 glow"
                  : "border-white/8 bg-white/3"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-brand-500 text-white text-xs font-bold">
                  Empfohlen
                </div>
              )}

              <div className="mb-4">
                <p className="text-gray-400 text-sm font-medium">{plan.name}</p>
                <div className="mt-1 flex items-end gap-1">
                  {plan.unit ? (
                    <>
                      <span className="text-4xl font-black text-white">
                        €{plan.price}
                      </span>
                      <span className="text-gray-500 text-sm mb-1">{plan.unit}</span>
                    </>
                  ) : (
                    <span className="text-3xl font-black text-white">
                      {plan.price}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-gray-400 text-sm">{plan.description}</p>
              </div>

              <ul className="flex-1 space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-brand-500 font-bold mt-0.5 flex-shrink-0">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#waitlist"
                className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
                  plan.highlighted
                    ? "bg-brand-500 hover:bg-brand-600 text-white"
                    : "bg-white/8 hover:bg-white/12 text-white"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-gray-600 text-sm">
          * Preise sind Beta-Preise und können sich vor dem Launch noch ändern.
          Wartelistenmitglieder erhalten garantiert den Beta-Preis.
        </p>
      </div>
    </section>
  );
}
