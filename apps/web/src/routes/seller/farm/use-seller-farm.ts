import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sellerFarmApi } from './api'
import type { FarmInput, SellerFarm } from './api'

const QUERY_KEY = ['seller-farm']

export function useSellerFarm() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => sellerFarmApi.getFarm(),
    retry: false,
  })
}

export function useCreateFarm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: FarmInput) => sellerFarmApi.createFarm(data),
    onSuccess: (farm) => qc.setQueryData(QUERY_KEY, farm),
  })
}

export function useUpdateFarm() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<FarmInput>) => sellerFarmApi.updateFarm(data),
    onSuccess: (farm) => qc.setQueryData(QUERY_KEY, farm),
  })
}

export function useUploadCover() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => sellerFarmApi.uploadCover(file),
    onSuccess: (farm) => qc.setQueryData(QUERY_KEY, farm),
  })
}

export function useAddPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => sellerFarmApi.addPhoto(file),
    onSuccess: (farm) => qc.setQueryData(QUERY_KEY, farm),
  })
}

export function useDeletePhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (photoId: number) => sellerFarmApi.deletePhoto(photoId),
    onSuccess: (_, photoId) =>
      qc.setQueryData<SellerFarm>(QUERY_KEY, (prev) =>
        prev ? { ...prev, photos: prev.photos.filter((p) => p.id !== photoId) } : prev
      ),
  })
}
