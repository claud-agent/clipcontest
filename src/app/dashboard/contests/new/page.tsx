import ContestWizard from '@/components/wizard/ContestWizard'

export default function NewContestPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">Neuen Contest erstellen</h1>
        <p className="text-gray-500 text-[13px] mt-0.5">Beantworte ein paar Fragen — dauert unter 2 Minuten.</p>
      </div>
      <ContestWizard />
    </div>
  )
}
