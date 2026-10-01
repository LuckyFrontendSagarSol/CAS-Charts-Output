import { useEffect } from 'react'

/**
 * Stops the page behind a modal from scrolling while it is open.
 *
 * The previous value is captured and restored rather than cleared, so nesting
 * two locked overlays cannot leave the page unscrollable when only the inner
 * one closes.
 *
 * @param {boolean} locked
 */
export default function useBodyScrollLock(locked = true) {
  useEffect(() => {
    if (!locked) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [locked])
}
