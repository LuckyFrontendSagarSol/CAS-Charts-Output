import { useEffect, useState } from 'react'

/**
 * The rendered width of an element, kept current as it resizes — for charts,
 * which draw in pixels and so need to know how many they have.
 *
 * Returns `[ref, width, node]`. `ref` is a callback ref, so the measurement
 * follows the element when it is unmounted and mounted again (a chart swapped
 * for its table and back). `width` is 0 until the first measurement.
 */
export default function useElementWidth() {
  const [node, setNode] = useState(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry.contentRect.width))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [node])

  return [setNode, width, node]
}
