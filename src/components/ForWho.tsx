const audiences = [
  {
    label: "Veranstalter",
    cards: [
      {
        title: "Brands & Unternehmen",
        description: "User Generated Content für deine Kampagne? Starte einen Contest, leg den Preispool fest und lehn dich zurück.",
        features: ["Kein manuelles Tracking", "Seriöse Teilnahmebedingungen", "Rechtskonforme Auszahlung"],
      },
      {
        title: "Creator & Influencer",
        description: "Community aktivieren? Lass deine Follower gegeneinander antreten — mit echten Preisen.",
        features: ["Einfaches Setup", "Dein Branding, dein Contest", "Mehr Engagement & Reichweite"],
      },
    ],
  },
];

const participant = {
  title: "Teilnehmer",
  description: "Finde offene Contests, reich dein Video ein und tracke deinen Rang live.",
  features: ["Faire, öffentliche Regeln", "Echter Preispool", "Live-Ranking"],
};

export default function ForWho() {
  return (
    <section className="py-28 px-6 border-t border-white/[0.04]" id="for-who">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-brand-400 font-semibold text-[13px] uppercase tracking-[0.15em] mb-3">
            Für wen?
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Für jeden, der Creator-Energie nutzen will
          </h2>
        </div>

        {/* Veranstalter cards */}
        <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-gray-500 mb-4">
          Als Veranstalter
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {audiences[0].cards.map((card) => (
            <div
              key={card.title}
              className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-all duration-300"
            >
              <h3 className="text-white font-semibold text-[15px] mb-2">{card.title}</h3>
              <p className="text-gray-400 text-[13px] leading-relaxed mb-4">{card.description}</p>
              <div className="flex flex-col gap-2">
                {card.features.map((f) => (
                  <span key={f} className="flex items-center gap-2 text-[13px] text-gray-400">
                    <span className="w-4 h-4 rounded-full bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-2.5 h-2.5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Teilnehmer card */}
        <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-gray-500 mb-4">
          Als Teilnehmer
        </p>
        <div className="p-6 rounded-2xl border border-brand-500/15 bg-brand-500/[0.03]">
          <h3 className="text-white font-semibold text-[15px] mb-2">{participant.title}</h3>
          <p className="text-gray-400 text-[13px] mb-4">{participant.description}</p>
          <div className="flex flex-wrap gap-3">
            {participant.features.map((f) => (
              <span
                key={f}
                className="px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-[13px] text-brand-300"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
