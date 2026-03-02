export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="py-12 px-6 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8">
          {/* Brand */}
          <div>
            <span className="text-xl font-black">
              <span className="text-gradient">Clip</span>
              <span className="text-white">Contest</span>
            </span>
            <p className="mt-2 text-gray-600 text-sm max-w-xs">
              Dein Contest-Tool für Creator. Live Leaderboards, faires
              Tracking, automatische Auszahlung.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
            <div className="flex flex-col gap-2">
              <p className="text-gray-600 font-semibold uppercase tracking-wider text-xs">
                Produkt
              </p>
              <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors">
                So funktionierts
              </a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">
                Preise
              </a>
              <a href="#faq" className="text-gray-400 hover:text-white transition-colors">
                FAQ
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-gray-600 font-semibold uppercase tracking-wider text-xs">
                Rechtliches
              </p>
              {/* TODO: Create these pages before launch */}
              <a href="/impressum" className="text-gray-400 hover:text-white transition-colors">
                Impressum
              </a>
              <a href="/datenschutz" className="text-gray-400 hover:text-white transition-colors">
                Datenschutz
              </a>
              <a href="/agb" className="text-gray-400 hover:text-white transition-colors">
                AGB
              </a>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-gray-600 font-semibold uppercase tracking-wider text-xs">
                Kontakt
              </p>
              {/* TODO: Replace with your actual email */}
              <a
                href="mailto:hallo@clipcontest.io"
                className="text-gray-400 hover:text-white transition-colors"
              >
                hallo@clipcontest.io
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-700">
          <p>© {year} ClipContest. Alle Rechte vorbehalten.</p>
          <p>
            ClipContest ist nicht mit TikTok, Meta oder anderen Plattformen
            verbunden.
          </p>
        </div>
      </div>
    </footer>
  );
}
