import { useEffect, useState, type RefObject } from 'react'

/** IntersectionObserver → boolean. Used to pause sims/canvases off-screen. */
export function useOnScreen(
  ref: RefObject<Element | null>,
  threshold = 0.15,
): boolean {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) setVisible(entry.isIntersecting)
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, threshold])

  return visible
}
