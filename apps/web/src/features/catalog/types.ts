export interface Category {
  id: number
  name: string
  slug: string
}

export interface ProductSeller {
  id: number
  fullName: string | null
  farmName: string | null
}

export interface Product {
  id: number
  name: string
  price: string
  unit: string
  quantity: string
  imagePath: string | null
  status: 'active' | 'inactive' | 'archived'
  category: Category
  seller: ProductSeller
}
