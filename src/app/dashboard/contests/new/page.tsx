import CreateContestForm from '@/components/dashboard/CreateContestForm'

export default function NewContestPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Neuen Contest erstellen</h1>
        <p className="text-gray-400 text-sm mt-1">Fülle die Details aus und teile den Link mit deiner Community.</p>
      </div>
      <CreateContestForm />
    </div>
  )
}
