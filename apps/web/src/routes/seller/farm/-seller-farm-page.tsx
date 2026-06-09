import { useState, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button, Input, Label } from '@farm-market/ui'
import { getFieldError, ApiValidationError } from '@/lib/api/errors'
import {
  useSellerFarm,
  useCreateFarm,
  useUpdateFarm,
  useUploadCover,
  useAddPhoto,
  useDeletePhoto,
} from './use-seller-farm'
import type { SellerFarm, FarmInput } from './api'

const MAX_PHOTOS = 10

const PRESET_ACTIVITIES = [
  'Рибалка',
  'Полювання',
  'Екскурсії',
  'Дегустація',
  'Майстер-класи',
  'Збір урожаю',
  'Верхова їзда',
  'Кемпінг',
  'Страусина ферма',
  'Сироварня',
]

function FarmInfoForm({
  farm,
  onCreate,
  onUpdate,
  isSaving,
  error,
}: {
  farm?: SellerFarm
  onCreate: (data: FarmInput) => void
  onUpdate: (data: Partial<FarmInput>) => void
  isSaving: boolean
  error?: unknown
}) {
  const fieldError = (field: string) => getFieldError(error, field)
  const [name, setName] = useState(farm?.name ?? '')
  const [description, setDescription] = useState(farm?.description ?? '')
  const [location, setLocation] = useState(farm?.location ?? '')
  const [instagram, setInstagram] = useState(farm?.instagram ?? '')
  const [activities, setActivities] = useState<string[]>(farm?.activities ?? [])

  const toggleActivity = (activity: string) => {
    setActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name,
      description: description || null,
      location: location || null,
      instagram: instagram || null,
      activities,
    }
    if (farm) {
      onUpdate(data)
    } else {
      onCreate(data)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="farm-name">Назва ферми *</Label>
        <Input id="farm-name" value={name} onChange={(e) => setName(e.target.value)} required />
        {fieldError('name') && <p className="text-xs text-red-500 mt-0.5">{fieldError('name')}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="farm-location">Місцезнаходження</Label>
        <Input
          id="farm-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Наприклад: Полтавська обл., Миргород"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="farm-description">Опис</Label>
        <textarea
          id="farm-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600"
          placeholder="Розкажіть про вашу ферму..."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="farm-instagram">Instagram</Label>
        <Input
          id="farm-instagram"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          placeholder="https://instagram.com/yourfarm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Активності</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_ACTIVITIES.map((activity) => (
            <button
              key={activity}
              type="button"
              onClick={() => toggleActivity(activity)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                activities.includes(activity)
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
              }`}
            >
              {activity}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Збереження...' : farm ? 'Зберегти' : 'Створити ферму'}
      </Button>

      {error instanceof Error && !(error instanceof ApiValidationError) && (
        <p className="text-sm text-red-600">{error.message}</p>
      )}
    </form>
  )
}

export function SellerFarmPage() {
  const navigate = useNavigate()
  const { data: farm, isLoading } = useSellerFarm()
  const createFarm = useCreateFarm()
  const updateFarm = useUpdateFarm()
  const uploadCover = useUploadCover()
  const addPhoto = useAddPhoto()
  const deletePhoto = useDeletePhoto()

  const coverRef = useRef<HTMLInputElement>(null)
  const photoRef = useRef<HTMLInputElement>(null)

  if (isLoading) return <div className="p-8 text-sm text-gray-500">Завантаження...</div>

  const isSaving = createFarm.isPending || updateFarm.isPending
  const saveError = createFarm.error ?? updateFarm.error

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
      <h1 className="text-2xl font-bold text-gray-900">
        {farm ? 'Моя ферма' : 'Створити ферму'}
      </h1>

      <FarmInfoForm
        key={farm?.id ?? 'create'}
        farm={farm}
        onCreate={(data) =>
          void createFarm.mutate(data, {
            onSuccess: (f) => navigate({ to: '/farms/$id', params: { id: String(f.id) } }),
          })
        }
        onUpdate={(data) =>
          void updateFarm.mutate(data, {
            onSuccess: (f) => navigate({ to: '/farms/$id', params: { id: String(f.id) } }),
          })
        }
        isSaving={isSaving}
        error={saveError}
      />

      {farm && (
        <div className="flex flex-col gap-4">
          <div className="border-t pt-6">
            <h2 className="text-base font-semibold text-gray-800 mb-3">Обкладинка</h2>
            {farm.coverImagePath && (
              <img
                src={farm.coverImagePath}
                alt="Обкладинка"
                className="w-full h-40 object-cover rounded-lg mb-3"
              />
            )}
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  void uploadCover.mutate(file)
                  e.target.value = ''
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => coverRef.current?.click()}
              disabled={uploadCover.isPending}
            >
              {uploadCover.isPending ? 'Завантаження...' : 'Змінити фото обкладинки'}
            </Button>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-base font-semibold text-gray-800 mb-3">
              Галерея ({farm.photos.length}/{MAX_PHOTOS})
            </h2>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {farm.photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.imagePath}
                    alt=""
                    className="w-full h-28 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => void deletePhoto.mutate(photo.id)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {farm.photos.length < MAX_PHOTOS && (
              <>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      void addPhoto.mutate(file)
                      e.target.value = ''
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => photoRef.current?.click()}
                  disabled={addPhoto.isPending}
                >
                  {addPhoto.isPending ? 'Завантаження...' : '+ Додати фото'}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
