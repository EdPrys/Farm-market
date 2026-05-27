import { useRef } from 'react'
import { useParams, useRouter } from '@tanstack/react-router'
import { ProductForm } from './product-form'
import { useSellerProducts } from './use-seller-products'
import { useUpdateProduct } from './use-update-product'
import { useUploadImage } from './use-upload-image'
import type { ProductUpdateInput } from './api'

export function EditProductPage() {
  const { id } = useParams({ from: '/seller/products/$id/edit' })
  const router = useRouter()
  const { data: products = [] } = useSellerProducts()
  const product = products.find((p) => p.id === Number(id))
  const updateProduct = useUpdateProduct()
  const uploadImage = useUploadImage()
  const imageFileRef = useRef<File | null>(null)

  if (!product) return <div className="p-8 text-sm text-gray-500">Завантаження...</div>

  const handleSubmit = async (data: ProductUpdateInput) => {
    await updateProduct.mutateAsync({ id: Number(id), data })
    if (imageFileRef.current) {
      await uploadImage.mutateAsync({ id: Number(id), file: imageFileRef.current })
    }
    await router.navigate({ to: '/seller/products' })
  }

  const isPending = updateProduct.isPending || uploadImage.isPending
  const error = updateProduct.isError
    ? updateProduct.error instanceof Error
      ? updateProduct.error.message
      : 'Помилка'
    : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Редагувати товар</h1>
      <ProductForm
        initial={product}
        onSubmit={(data) => void handleSubmit(data)}
        onImageChange={(file) => {
          imageFileRef.current = file
        }}
        isPending={isPending}
        error={error}
      />
    </div>
  )
}
