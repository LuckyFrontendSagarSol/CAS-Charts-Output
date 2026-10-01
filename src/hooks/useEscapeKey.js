import { useEffect } from 'react'

/**
 * Runs `handler` on Escape. Anything that covers or overlays the page needs
 * this — a dialog or menu that can only be closed by finding its close button
 * is a trap for keyboard users (WCAG 2.1.2).
 *
 * @param {() => void} handler
 * @param {boolean} enabled  skip while false (e.g. the overlay is closed)
 */
export default function useEscapeKey(handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = event => {
      if (event.key === 'Escape') handler()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [handler, enabled])
}
