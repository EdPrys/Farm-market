import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { requestsApi } from './api'
import type { CreateBuyerRequestPayload } from './types'

export function useRequests(params: { category?: string; page?: number; enabled?: boolean }) {
  const { enabled = true, ...fetchParams } = params
  return useQuery({
    queryKey: ['requests', fetchParams],
    queryFn: () => requestsApi.getRequests(fetchParams),
    enabled,
  })
}

export function useCreateRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBuyerRequestPayload) => requestsApi.createRequest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests'] })
      void queryClient.invalidateQueries({ queryKey: ['my-requests'] })
    },
  })
}

export function useMyRequests(userId: number | undefined) {
  return useQuery({
    queryKey: ['my-requests', userId],
    queryFn: () =>
      requestsApi.getRequests({ page: 1 }).then((r) => ({
        ...r,
        data: r.data.filter((req) => req.user?.id === userId),
      })),
    enabled: userId !== undefined,
  })
}

export function useCloseRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => requestsApi.closeRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests'] })
      void queryClient.invalidateQueries({ queryKey: ['my-requests'] })
    },
  })
}

export function useDeleteRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => requestsApi.deleteRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['requests'] })
      void queryClient.invalidateQueries({ queryKey: ['my-requests'] })
    },
  })
}
