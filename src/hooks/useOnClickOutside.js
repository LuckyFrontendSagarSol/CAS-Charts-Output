import { useEffect } from 'react'

/**
 * Calls `handler` when a pointer goes down outside `ref`. Used to dismiss the
 * things that hang off the header — the profile menu, the search results.
 *
 * Listens on mousedown rather than click so the panel closes on press instead
 * of waiting for the release, which is what every other menu on the web does.
 *
 * @param {import('react').RefObject<HTMLElement>} ref  element treated as "inside"
 * @param {() => void} handler                          run on an outside press
 * @param {boolean} enabled                             skip while false (e.g. closed)
 */
export default function useOnClickOutside(ref, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const onPointerDown = event => {
      if (ref.current && !ref.current.contains(event.target)) handler()
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [ref, handler, enabled])
}
