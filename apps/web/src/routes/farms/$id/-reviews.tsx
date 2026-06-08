// apps/web/src/routes/farms/$id/-reviews.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { reviewsApi } from './api'
import { useCurrentUser } from '@/shared/auth/use-current-user'

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`text-2xl leading-none ${n <= value ? 'text-amber-400' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export function FarmReviews({
  farmId,
  reviewCount,
  avgRating,
}: {
  farmId: number
  reviewCount: number
  avgRating: number | null
}) {
  const { data: user } = useCurrentUser()
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const qc = useQueryClient()

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['farm-reviews', farmId],
    queryFn: () => reviewsApi.getReviews(farmId),
  })

  const addReview = useMutation({
    mutationFn: () => reviewsApi.createReview(farmId, { rating, text }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['farm-reviews', farmId] })
      qc.invalidateQueries({ queryKey: ['farm', farmId] })
      setRating(0)
      setText('')
    },
  })

  const reviews = reviewsData?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-800">Відгуки ({reviewCount})</h2>
        {avgRating && (
          <div className="flex items-center gap-1">
            <span className="text-amber-400 text-sm">★</span>
            <span className="font-bold text-gray-900 text-sm">{avgRating}</span>
          </div>
        )}
      </div>

      {user ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold text-green-800">Ваш відгук</p>
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-600"
            placeholder="Напишіть відгук..."
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => addReview.mutate()}
              disabled={rating === 0 || !text.trim() || addReview.isPending}
              className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50 hover:bg-green-800"
            >
              {addReview.isPending ? 'Надсилання...' : 'Надіслати'}
            </button>
            {addReview.isError && (
              <p className="text-xs text-red-600">{addReview.error.message}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          <Link to="/login" className="text-green-700 hover:underline">
            Увійдіть
          </Link>
          , щоб залишити відгук
        </p>
      )}

      {isLoading && <p className="text-sm text-gray-500">Завантаження відгуків...</p>}

      <div className="flex flex-col gap-3">
        {reviews.map((review) => (
          <div key={review.id} className="border border-gray-200 rounded-lg p-3">
            <div className="flex justify-between items-start">
              <span className="text-sm font-semibold text-gray-900">
                {review.user.fullName ?? 'Користувач'}
              </span>
              <span className="text-amber-400 text-sm">
                {'★'.repeat(review.rating)}
                <span className="text-gray-300">{'★'.repeat(5 - review.rating)}</span>
              </span>
            </div>
            <p className="text-sm text-gray-700 mt-1">{review.text}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(review.createdAt).toLocaleDateString('uk-UA')}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
