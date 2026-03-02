export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="py-14 px-6 border-t border-white/[0.04]">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              </div>
              <span className="text-[15px] font-bold text-white">ClipContest</span>
            </div>
            <p className="text-gray-600 text-[13px] max-w-xs leading-relaxed">
              Dein Contest-Tool für Creator. Live Leaderboards, faires Tracking, automatische Auszahlung.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-12 gap-y-6 text-[13px]">
            <div className="flex flex-col gap-2.5">
              <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-gray-600 mb-1">Produkt</p>
              <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors duration-200">So funktionierts</a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors duration-200">Preise</a>
              <a href="#faq" className="text-gray-400 hover:text-white transition-colors duration-200">FAQ</a>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-gray-600 mb-1">Rechtliches</p>
              <a href="/impressum" className="text-gray-400 hover:text-white transition-colors duration-200">Impressum</a>
              <a href="/datenschutz" className="text-gray-400 hover:text-white transition-colors duration-200">Datenschutz</a>
              <a href="/agb" className="text-gray-400 hover:text-white transition-colors duration-200">AGB</a>
            </div>
            <div className="flex flex-col gap-2.5">
              <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-gray-600 mb-1">Kontakt</p>
              <a href="mailto:hallo@clipcontest.io" className="text-gray-400 hover:text-white transition-colors duration-200">
                hallo@clipcontest.io
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-gray-700">
          <p>&copy; {year} ClipContest. Alle Rechte vorbehalten.</p>
          <p>Nicht mit TikTok, Meta oder anderen Plattformen verbunden.</p>
        </div>
      </div>
    </footer>
  );
}
