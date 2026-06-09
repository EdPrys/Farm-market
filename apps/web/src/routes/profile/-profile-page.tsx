import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button, Input, Label } from '@farm-market/ui'
import { getFieldError, ApiValidationError } from '@/lib/api/errors'
import { useCurrentUser } from '@/shared/auth/use-current-user'
import { useUpdateProfile } from './use-update-profile'
import { useBecomeSeller } from './use-become-seller'
import { useMyRequests, useCloseRequest, useDeleteRequest } from '../catalog/requests/use-requests'
import { RequestCard } from '../catalog/requests/-request-card'

export function ProfilePage() {
  const navigate = useNavigate()
  const { data: user } = useCurrentUser()
  const updateProfile = useUpdateProfile()
  const becomeSeller = useBecomeSeller()
  const [fullName, setFullName] = useState('')
  const [farmName, setFarmName] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user?.fullName != null) setFullName(user.fullName)
  }, [user?.fullName])

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile.mutate({ fullName: fullName.trim() || null })
  }

  const handleBecomeSeller = (e: React.FormEvent) => {
    e.preventDefault()
    becomeSeller.mutate(
      { isSeller: true, farmName: farmName.trim() },
      { onSuccess: () => void navigate({ to: '/seller/profile' }) }
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-10">
      <section className="flex flex-col gap-5">
        <h1 className="text-xl font-bold text-gray-900">Особиста інформація</h1>
        <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fullName">Імʼя та прізвище</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Іван Петренко"
            />
            {getFieldError(updateProfile.error, 'fullName') && (
              <p className="text-xs text-red-500 mt-0.5">{getFieldError(updateProfile.error, 'fullName')}</p>
            )}
          </div>
          {updateProfile.isError && !(updateProfile.error instanceof ApiValidationError) && (
            <p className="text-sm text-red-500">
              {updateProfile.error instanceof Error
                ? updateProfile.error.message
                : 'Помилка збереження'}
            </p>
          )}
          {updateProfile.isSuccess && (
            <p className="text-sm text-green-600">Збережено</p>
          )}
          <Button type="submit" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Збереження...' : 'Зберегти'}
          </Button>
        </form>
      </section>

      {!user?.isSeller && (
        <section className="flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Стати продавцем</h2>
            <p className="text-sm text-gray-500 mt-1">
              Вкажіть назву господарства — після цього зможете додавати товари.
            </p>
          </div>
          <form onSubmit={handleBecomeSeller} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="farmName">Назва господарства</Label>
              <Input
                id="farmName"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder="Ферма Петренко"
                required
              />
              {getFieldError(becomeSeller.error, 'farmName') && (
                <p className="text-xs text-red-500 mt-0.5">{getFieldError(becomeSeller.error, 'farmName')}</p>
              )}
            </div>
            {becomeSeller.isError && !(becomeSeller.error instanceof ApiValidationError) && (
              <p className="text-sm text-red-500">
                {becomeSeller.error instanceof Error
                  ? becomeSeller.error.message
                  : 'Помилка реєстрації'}
              </p>
            )}
            {becomeSeller.isSuccess && (
              <p className="text-sm text-green-600">
                Вітаємо! Тепер ви можете додавати товари.
              </p>
            )}
            <Button
              type="submit"
              disabled={becomeSeller.isPending || !farmName.trim()}
            >
              {becomeSeller.isPending ? 'Реєстрація...' : 'Зареєструватись як продавець'}
            </Button>
          </form>
        </section>
      )}

      {user && <MyRequestsSection userId={user.id} />}
    </div>
  )
}

function MyRequestsSection({ userId }: { userId: number }) {
  const { data, isLoading } = useMyRequests(userId)
  const closeRequest = useCloseRequest()
  const deleteRequest = useDeleteRequest()

  const requests = data?.data ?? []

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-gray-900">Мої запити</h2>
      {isLoading ? (
        <p className="text-sm text-gray-500">Завантаження...</p>
      ) : requests.length === 0 ? (
        <p className="text-sm text-gray-500">
          У вас ще немає запитів.{' '}
          <a href="/catalog?tab=requests" className="text-green-700 underline">
            Перейти до каталогу
          </a>
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              isOwn
              onClose={(id) => closeRequest.mutate(id)}
              onDelete={(id) => deleteRequest.mutate(id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
