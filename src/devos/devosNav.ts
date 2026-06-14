import { createContext, useContext } from 'react'

/** Lets the hero pfp summon the Dev OS (which lives at the App root). */
export interface DevOSNav {
  summon: (img: HTMLImageElement | null) => void
}

export const DevOSNavCtx = createContext<DevOSNav | null>(null)

export function useDevOSNav(): DevOSNav {
  const ctx = useContext(DevOSNavCtx)
  if (!ctx) throw new Error('useDevOSNav must be used inside the App provider')
  return ctx
}
