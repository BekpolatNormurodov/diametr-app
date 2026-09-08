import { useEffect, useRef } from 'react'

export function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.06, rootMargin: '0px 0px -20px 0px' }
    )

    // Observe all current + future .reveal elements
    const observeAll = () => {
      el.querySelectorAll<HTMLElement>('.reveal:not(.visible)').forEach(t => observer.observe(t))
    }

    // Initial pass after short delay (ensures CSS applied)
    const timer = setTimeout(observeAll, 60)

    // MutationObserver picks up elements added after data loads
    const mutObs = new MutationObserver(observeAll)
    mutObs.observe(el, { childList: true, subtree: true })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
      mutObs.disconnect()
    }
  }, [])

  return ref
}
