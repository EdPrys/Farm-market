import { useParams } from '@tanstack/react-router'
import { useFarmer } from './use-farmer'
import { useCurrentUser } from '@/shared/auth/use-current-user'
import { ProductCard } from '../../catalog/-product-card'
import { ContactBlock } from './-contact-block'

export function FarmerProfilePage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const { data: farmer, isLoading, isError } = useFarmer(Number(id))
  const { data: user } = useCurrentUser()

  if (isLoading) return <div className="p-8 text-sm text-gray-500">Завантаження...</div>
  if (isError || !farmer) return <div className="p-8 text-sm text-red-500">Фермера не знайдено</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-white border rounded-xl p-6 mb-8 flex flex-col sm:flex-row gap-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {farmer.farmName ?? farmer.fullName ?? 'Ферма'}
          </h1>
          {farmer.farmName && farmer.fullName && (
            <p className="text-sm text-gray-500 mt-1">{farmer.fullName}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">
            Учасник з{' '}
            {new Date(farmer.memberSince).toLocaleDateString('uk-UA', {
              year: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        <div className="sm:w-64">
          <ContactBlock contacts={farmer.contacts} isAuthenticated={!!user} />
        </div>
      </div>

      <h2 className="text-base font-semibold text-gray-800 mb-4">
        Товари ({farmer.products.length})
      </h2>

      {farmer.products.length === 0 ? (
        <p className="text-sm text-gray-500">Немає активних товарів</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {farmer.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
