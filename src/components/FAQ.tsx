"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Wie verhindert ihr Botting und View-Manipulation?",
    a: "Wir tracken Views als Zeitreihe und flaggen automatisch unplausible Sprünge oder ungewöhnliche Engagement-Ratios. Auffällige Entries landen in einer Review-Queue. Du als Veranstalter hast das letzte Wort.",
  },
  {
    q: "Wie läuft die Auszahlung ab?",
    a: "Nach Contest-Ende bestätigst du die Gewinner. Wir kümmern uns um die Auszahlung direkt an die Gewinner — per Banküberweisung oder PayPal.",
  },
  {
    q: "Welche Plattformen unterstützt ihr?",
    a: "Aktuell TikTok. Instagram Reels und YouTube Shorts kommen in Phase 2. Auf der Warteliste kannst du angeben, welche Plattformen für dich wichtig sind.",
  },
  {
    q: "Was kostet der Preispool extra?",
    a: "Der Preispool ist nicht im Paketpreis enthalten. Du legst ihn selbst fest und überweist ihn vorab an uns. Wir halten ihn treuhänderisch und zahlen nach Contest-Ende an die Gewinner aus.",
  },
  {
    q: "Kann ich eigene Teilnahmebedingungen festlegen?",
    a: "Ja. Unser Wizard generiert eine Vorlage basierend auf deinen Einstellungen — du kannst sie anpassen. Die finale Version ist öffentlich auf deiner Contest-Seite sichtbar.",
  },
  {
    q: "Was passiert, wenn ein Teilnehmer sein Video löscht?",
    a: "Gelöschte Videos werden sofort aus dem Leaderboard entfernt und der Entry als ungültig markiert. Wir speichern keine Kopien.",
  },
];

function FAQItem({ q, a, isOpen, toggle }: { q: string; a: string; isOpen: boolean; toggle: () => void }) {
  return (
    <div className="border-b border-white/[0.06]">
      <button
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
        onClick={toggle}
      >
        <span className="text-[15px] text-white font-medium group-hover:text-brand-300 transition-colors duration-200">{q}</span>
        <span
          className={`flex-shrink-0 w-6 h-6 rounded-md border border-white/[0.1] bg-white/[0.03] flex items-center justify-center text-gray-500 text-[13px] transition-all duration-300 ${
            isOpen ? "rotate-45 border-brand-500/30 text-brand-400" : ""
          }`}
        >
          +
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ${
          isOpen ? "grid-rows-[1fr] opacity-100 pb-5" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-gray-400 text-[13px] leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-28 px-6 border-t border-white/[0.04]" id="faq">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-brand-400 font-semibold text-[13px] uppercase tracking-[0.15em] mb-3">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Häufige Fragen
          </h2>
        </div>
        <div>
          {faqs.map((faq, i) => (
            <FAQItem
              key={faq.q}
              q={faq.q}
              a={faq.a}
              isOpen={openIndex === i}
              toggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
