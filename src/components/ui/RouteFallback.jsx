import logoB from '@/assets/logo/logo-blue.png'

/**
 * Suspense fallback for a lazily loaded page. `fill` makes it take the whole
 * viewport (used when nothing else is on screen yet); by default it fills the
 * content column inside AdminLayout.
 */
export default function RouteFallback({ fill = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${
        fill ? 'min-h-screen' : 'min-h-[60vh]'
      }`}
    >
      <img src={logoB} alt="" className="h-10 w-auto animate-pulse" />
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-beige-line border-t-royal" />
      <p className="font-display text-[13px] font-semibold tracking-wide text-ink-mute">
        Loading…
      </p>
    </div>
  )
}
