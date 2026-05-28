import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Logo } from './logo'

const slides = [
  {
    title: 'Свіжі продукти\nвід місцевих\nфермерів',
    subtitle: 'Приєднуйтесь до спільноти\nздорового харчування',
  },
  {
    title: 'Підтримуй\nмісцевих\nфермерів',
    subtitle: 'Купуй напряму\nбез посередників',
  },
  {
    title: 'Сезонні продукти\nщотижня',
    subtitle: 'Доставка прямо\nдо вашого столу',
  },
]

export function AuthLayout({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const slide = slides[current]

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-[480px] flex-col justify-between bg-gradient-to-br from-[#14532d] via-[#15803d] to-[#16a34a] p-12">
        <Logo />
        <div>
          <p className="text-white text-3xl font-bold leading-snug mb-3">
            {slide.title.split('\n').map((line, i) => (
              <span key={i}>{line}{i < slide.title.split('\n').length - 1 && <br />}</span>
            ))}
          </p>
          <p className="text-green-300 text-sm leading-relaxed">
            {slide.subtitle.split('\n').map((line, i) => (
              <span key={i}>{line}{i < slide.subtitle.split('\n').length - 1 && <br />}</span>
            ))}
          </p>
        </div>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-white/80' : 'bg-white/25'}`}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        {children}
      </div>
    </div>
  )
}
