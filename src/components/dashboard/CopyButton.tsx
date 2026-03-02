'use client'

export default function CopyButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => navigator.clipboard?.writeText(text)}
      className="px-3 py-2 bg-brand-500/20 hover:bg-brand-500/30 text-brand-500 rounded-lg text-xs font-medium transition-colors flex-shrink-0"
    >
      Kopieren
    </button>
  )
}
