import { Link } from '@tanstack/react-router'
import type { FarmSummary } from './api'

export function FarmCard({ farm }: { farm: FarmSummary }) {
  return (
    <Link
      to="/farms/$id"
      params={{ id: String(farm.id) }}
      className="block rounded-xl overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className="h-36 bg-gradient-to-br from-green-700 to-green-900 relative">
        {farm.coverImagePath && (
          <img src={farm.coverImagePath} alt={farm.name} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="p-3">
        <div className="font-bold text-gray-900 text-sm truncate">{farm.name}</div>
        {farm.location && (
          <div className="text-gray-500 text-xs mt-0.5 truncate">📍 {farm.location}</div>
        )}
        {farm.activities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {farm.activities.slice(0, 3).map((a) => (
              <span
                key={a}
                className="bg-green-50 text-green-800 border border-green-200 rounded-full px-2 py-0.5 text-xs"
              >
                {a}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
