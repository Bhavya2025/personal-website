import { useSyncExternalStore } from 'react'

const QUERY = '(pointer: fine)'

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

/** True on mouse/trackpad devices — gates cursor & magnetic effects. */
export function usePointerFine(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
  )
}
