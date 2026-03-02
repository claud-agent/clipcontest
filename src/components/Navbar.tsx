"use client";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5">
      <a href="/" className="flex items-center gap-2">
        {/* Logo — replace with your actual logo */}
        <span className="text-xl font-black tracking-tight">
          <span className="text-gradient">Clip</span>
          <span className="text-white">Contest</span>
        </span>
      </a>
      <div className="flex items-center gap-4">
        <a
          href="#waitlist"
          className="px-5 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 transition-colors text-sm font-semibold text-white glow"
        >
          Warteliste
        </a>
      </div>
    </nav>
  );
}
