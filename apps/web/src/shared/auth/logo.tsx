interface LogoProps {
  variant?: 'light' | 'dark'
}

export function Logo({ variant = 'light' }: LogoProps) {
  const isDark = variant === 'dark'

  return (
    <div className="flex items-center gap-3">
      <svg width="36" height="36" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path
          d="M20 4C20 4 8 10 8 22C8 28.627 13.373 34 20 34C26.627 34 32 28.627 32 22C32 10 20 4 20 4Z"
          fill={isDark ? '#dcfce7' : 'white'}
          opacity="0.9"
        />
        <path d="M20 14L20 34" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 20C14 20 17 19 20 21" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div>
        <div className={`${isDark ? 'text-green-900' : 'text-white'} text-xl font-extrabold tracking-tight leading-none`}>
          Farm
        </div>
        <div className={`${isDark ? 'text-green-600' : 'text-green-300'} text-[11px] font-semibold tracking-[3px] uppercase`}>
          Market
        </div>
      </div>
    </div>
  )
}
