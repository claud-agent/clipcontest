"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Wie verhindert ihr Botting und View-Manipulation?",
    a: "Wir tracken Views als Zeitreihe und flaggen automatisch unplausible Sprünge (z. B. 0 → 50.000 in 2 Minuten) oder ungewöhnliche Engagement-Ratios. Auffällige Entries landen in einer Review-Queue. Du als Veranstalter hast das letzte Wort — kein Autoban ohne dein OK.",
  },
  {
    q: "Wie läuft die Auszahlung ab?",
    a: "Nach Contest-Ende bestätigst du die Gewinner. Wir kümmern uns um die Auszahlung direkt an die Gewinner — aktuell per Banküberweisung oder PayPal. Die Gewinner müssen nur einmalig ihre Zahlungsdaten angeben.",
  },
  {
    q: "Welche Plattformen unterstützt ihr?",
    a: "Aktuell TikTok — das ist unser MVP-Fokus. Instagram Reels und YouTube Shorts kommen in Phase 2. Auf der Warteliste kannst du angeben, welche Plattformen für dich wichtig sind.",
  },
  {
    q: "Ist ClipContest mit TikTok verbunden oder von TikTok autorisiert?",
    a: "Nein. ClipContest ist ein unabhängiges Tool und hat keine offizielle Partnerschaft mit TikTok, Meta oder anderen Plattformen. Wir nutzen öffentlich zugängliche Daten und APIs.",
  },
  {
    q: "Was passiert, wenn ein Teilnehmer sein Video löscht?",
    a: "Gelöschte Videos werden sofort aus dem Leaderboard entfernt und der Entry als ungültig markiert. Wir speichern keine Kopien — Teilnehmer sind selbst für ihre Inhalte verantwortlich.",
  },
  {
    q: "Kann ich eigene Teilnahmebedingungen festlegen?",
    a: "Ja. Unser Wizard generiert dir eine Vorlage basierend auf deinen Einstellungen — du kannst diese anpassen und erweitern. Die finale Version ist öffentlich auf deiner Contest-Seite sichtbar.",
  },
  {
    q: "Was kostet der Preispool extra?",
    a: "Der Preispool ist nicht im Paketpreis enthalten — du legst ihn selbst fest und überweist ihn vorab an uns. Wir halten ihn treuhänderisch und zahlen nach Contest-Ende an die Gewinner aus.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/8">
      <button
        className="w-full flex items-center justify-between py-5 text-left gap-4"
        onClick={() => setOpen(!open)}
      >
        <span className="text-white font-medium">{q}</span>
        <span
          className={`flex-shrink-0 w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-gray-400 transition-transform ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      {open && (
        <p className="pb-5 text-gray-400 text-sm leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <section className="py-24 px-6 bg-white/[0.02]" id="faq">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-brand-400 font-semibold text-sm uppercase tracking-widest mb-3">
            FAQ
          </p>
          <h2 className="text-4xl sm:text-5xl font-black text-white">
            Häufige Fragen
          </h2>
        </div>
        <div>
          {faqs.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
