const creators = [
  {
    emoji: "🏢",
    title: "Brands & Unternehmen",
    description:
      "Du willst User Generated Content für deine Kampagne? Starte einen Contest, leg den Preispool fest und lehn dich zurück.",
    bullets: [
      "Kein manuelles Tracking",
      "Seriöse Teilnahmebedingungen",
      "Rechtskonforme Auszahlung",
    ],
  },
  {
    emoji: "🎤",
    title: "Creator & Influencer",
    description:
      "Du hast eine Community und willst sie aktivieren? Lass deine Follower gegeneinander antreten — mit echten Preisen.",
    bullets: [
      "Einfaches Setup",
      "Dein Branding, dein Contest",
      "Mehr Engagement, mehr Reichweite",
    ],
  },
];

const participants = {
  emoji: "🎬",
  title: "Teilnehmer (Creator)",
  description:
    "Du willst an einem Contest teilnehmen? Finde offene Contests, reich dein Video ein und tracke deinen Rang live.",
  bullets: [
    "Faire, öffentliche Regeln",
    "Echter Preispool, echte Auszahlung",
    "Live-Ranking während des Contests",
  ],
};

export default function ForWho() {
  return (
    <section className="py-24 px-6 bg-white/[0.02]" id="for-who">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-brand-400 font-semibold text-sm uppercase tracking-widest mb-3">
            Für wen?
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Für jeden, der Creator-Energie nutzen will
          </h2>
        </div>

        {/* Veranstalter */}
        <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-4">
          Als Veranstalter
        </p>
        <div className="grid sm:grid-cols-2 gap-6 mb-10">
          {creators.map((card) => (
            <div
              key={card.title}
              className="p-6 rounded-2xl border border-white/8 bg-white/3"
            >
              <div className="text-3xl mb-4">{card.emoji}</div>
              <h3 className="text-white font-bold text-lg mb-2">{card.title}</h3>
              <p className="text-gray-400 text-sm mb-4">{card.description}</p>
              <ul className="space-y-1.5">
                {card.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-brand-500 font-bold">✓</span> {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Teilnehmer */}
        <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-4">
          Als Teilnehmer
        </p>
        <div className="p-6 rounded-2xl border border-brand-500/20 bg-brand-500/5">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="text-3xl">{participants.emoji}</div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-2">
                {participants.title}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {participants.description}
              </p>
              <ul className="flex flex-wrap gap-3">
                {participants.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-center gap-2 text-sm text-gray-400"
                  >
                    <span className="text-brand-500 font-bold">✓</span> {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
