import { useParams, Link } from '@tanstack/react-router'
import { useFarm } from './use-farm'
import { ProductCard } from '../../catalog/-product-card'
import { FarmReviews } from './-reviews'


const ACTIVITY_ICONS: Record<string, string> = {
  'Рибалка': '🎣',
  'Полювання': '🏹',
  'Екскурсії': '🚶',
  'Дегустація': '🍷',
  'Майстер-класи': '🎨',
  'Збір урожаю': '🌾',
  'Верхова їзда': '🐎',
  'Кемпінг': '⛺',
  'Страусина ферма': '🦜',
  'Сироварня': '🧀',
}

export function FarmPage() {
  const { id } = useParams({ from: '/farms/$id' })
  const { data: farm, isLoading, isError } = useFarm(Number(id))
  if (isLoading) return <div className="p-8 text-sm text-gray-500">Завантаження...</div>
  if (isError || !farm) return <div className="p-8 text-sm text-red-500">Ферму не знайдено</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Cover */}
      <div className="rounded-xl overflow-hidden bg-green-800 h-48 relative">
        {farm.coverImagePath ? (
          <img src={farm.coverImagePath} alt={farm.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-700 to-green-900" />
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4 -mt-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{farm.name}</h1>
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
            {farm.location && <span>📍 {farm.location}</span>}
            {farm.instagram && (
              <a
                href={farm.instagram.startsWith('http') ? farm.instagram : `https://instagram.com/${farm.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-600 hover:underline"
              >
                Instagram
              </a>
            )}
          </div>
        </div>
        {farm.farmer && (
          <Link
            to="/farmers/$id"
            params={{ id: String(farm.farmer.id) }}
            className="shrink-0 bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800"
          >
            Написати фермеру
          </Link>
        )}
      </div>

      {/* Description */}
      {farm.description && (
        <p className="text-gray-700 leading-relaxed">{farm.description}</p>
      )}

      {/* Activities */}
      {farm.activities.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-gray-800">Активності</h2>
          <div className="flex flex-wrap gap-2">
            {farm.activities.map((activity) => (
              <span
                key={activity}
                className="bg-green-50 text-green-800 border border-green-200 px-3 py-1 rounded-full text-sm"
              >
                {ACTIVITY_ICONS[activity] ?? '🌿'} {activity}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Gallery */}
      {farm.photos.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-gray-800">Фотогалерея</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {farm.photos.map((photo) => (
              <img
                key={photo.id}
                src={photo.imagePath}
                alt=""
                className="h-40 w-60 object-cover rounded-lg shrink-0"
              />
            ))}
          </div>
        </div>
      )}

      {/* Products */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-gray-800">
          Продукція ({farm.products.length})
        </h2>
        {farm.products.length === 0 ? (
          <p className="text-sm text-gray-500">Немає активних товарів</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {farm.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Reviews */}
      <FarmReviews
        farmId={farm.id}
        reviewCount={farm.reviewCount}
        avgRating={farm.avgRating}
      />
    </div>
  )
}
