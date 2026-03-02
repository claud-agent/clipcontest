"use client";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0c0d0f]/80 backdrop-blur-xl border-b border-white/[0.04]">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-tight text-white">ClipContest</span>
        </a>

        <div className="hidden sm:flex items-center gap-8 text-[13px] text-gray-400">
          <a href="#how-it-works" className="hover:text-white transition-colors duration-200">So funktionierts</a>
          <a href="#pricing" className="hover:text-white transition-colors duration-200">Preise</a>
          <a href="#faq" className="hover:text-white transition-colors duration-200">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          <a href="/auth/login" className="hidden sm:block text-[13px] text-gray-400 hover:text-white transition-colors duration-200">
            Login
          </a>
          <a
            href="#waitlist"
            className="h-9 px-4 rounded-lg bg-brand-500 hover:bg-brand-400 transition-all duration-200 text-[13px] font-semibold text-white inline-flex items-center"
          >
            Warteliste
          </a>
        </div>
      </div>
    </nav>
  );
}
