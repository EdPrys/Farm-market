import { useFarms } from './use-farms'
import { FarmCard } from './-farm-card'

export function FarmsPage() {
  const { data, isLoading } = useFarms()

  if (isLoading) return <div className="p-8 text-sm text-gray-500">Завантаження...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ферми</h1>
      {!data?.data.length ? (
        <p className="text-sm text-gray-500">Ферм поки немає</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.data.map((farm) => (
            <FarmCard key={farm.id} farm={farm} />
          ))}
        </div>
      )}
    </div>
  )
}
