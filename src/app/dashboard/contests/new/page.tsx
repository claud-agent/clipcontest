import ContestWizard from '@/components/wizard/ContestWizard'

export default function NewContestPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Neuen Contest erstellen</h1>
        <p className="text-gray-400 text-sm mt-1">Beantworte 5 kurze Fragen — dauert unter 2 Minuten.</p>
      </div>
      <ContestWizard />
    </div>
  )
}
