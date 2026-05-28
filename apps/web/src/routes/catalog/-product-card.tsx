import { Link } from '@tanstack/react-router'
import type { Product } from './types'

interface Props {
  product: Product
}

export function ProductCard({ product }: Props) {
  return (
    <Link
      to="/products/$id"
      params={{ id: String(product.id) }}
      className="block border rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white"
    >
      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
        {product.imagePath ? (
          <img src={product.imagePath} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">🥦</span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <p className="font-semibold text-gray-900 leading-tight">{product.name}</p>
        <p className="text-xs text-muted-foreground">
          {product.seller.farmName ?? product.seller.fullName ?? ''}
        </p>
        <p className="text-sm font-bold text-green-700 mt-1">
          {product.price} ₴ / {product.unit}
        </p>
        <button
          disabled
          className="mt-2 w-full text-xs border border-gray-200 rounded py-1 text-gray-400 cursor-not-allowed"
        >
          До кошика
        </button>
      </div>
    </Link>
  )
}
