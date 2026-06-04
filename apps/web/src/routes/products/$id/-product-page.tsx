import { useParams, Link } from '@tanstack/react-router'
import { useProduct } from './use-product'
import { useCurrentUser } from '@/shared/auth/use-current-user'
import { ContactBlock } from '../../farmers/$id/-contact-block'
import { useCartStore } from '@/shared/cart/use-cart'

export function ProductPage() {
  const { id } = useParams({ strict: false }) as { id: string }
  const { data: product, isLoading, isError } = useProduct(Number(id))
  const { data: user } = useCurrentUser()
  const items = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const cartItem = product ? items.find((i) => i.productId === product.id) : undefined

  if (isLoading) return <div className="p-8 text-sm text-gray-500">Завантаження...</div>
  if (isError || !product) return <div className="p-8 text-sm text-red-500">Товар не знайдено</div>

  const handleAdd = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      imagePath: product.imagePath,
      sellerName: product.seller.farmName ?? product.seller.fullName ?? '',
      sellerId: product.seller.id,
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 flex gap-8">
      <div className="w-80 shrink-0">
        <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
          {product.imagePath ? (
            <img src={product.imagePath} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-8xl">🥦</span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div>
          <span className="text-xs font-semibold bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
            {product.category.name}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
        <p className="text-3xl font-bold text-green-700">
          {product.price} ₴{' '}
          <span className="text-base font-normal text-gray-500">/ {product.unit}</span>
        </p>
        <p className="text-sm text-gray-600">
          Доступно:{' '}
          <span className="font-medium">
            {product.quantity} {product.unit}
          </span>
        </p>
        <div className="text-sm text-gray-600">
          <Link
            to="/farmers/$id"
            params={{ id: String(product.seller.id) }}
            className="font-medium hover:text-green-700 hover:underline"
          >
            {product.seller.farmName ?? product.seller.fullName ?? 'Продавець'}
          </Link>
        </div>
        {product.description && (
          <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
        )}
        {user && (
          cartItem ? (
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                className="w-9 h-9 border rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg"
              >
                −
              </button>
              <span className="text-base font-semibold w-16 text-center">
                {cartItem.quantity} {product.unit}
              </span>
              <button
                onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                className="w-9 h-9 border rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50 text-lg"
              >
                +
              </button>
              <Link
                to="/cart"
                className="ml-2 text-sm text-green-700 hover:underline"
              >
                В кошику →
              </Link>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="mt-2 w-full bg-green-700 text-white rounded-lg py-3 text-sm font-semibold hover:bg-green-800 transition-colors"
            >
              До кошика
            </button>
          )
        )}
        <ContactBlock contacts={product.seller?.contacts ?? null} isAuthenticated={!!user} />
      </div>
    </div>
  )
}
