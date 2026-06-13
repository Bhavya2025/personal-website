import { createContext, useContext } from 'react'

export type TransitionEffect = 'swipe' | 'launch' | 'tear' | 'fade'

export interface TransitionNav {
  navigateTo: (path: string, effect?: TransitionEffect) => void
}

export const TransitionContext = createContext<TransitionNav | null>(null)

export function useTransitionNav(): TransitionNav {
  const ctx = useContext(TransitionContext)
  if (!ctx) throw new Error('useTransitionNav must be used inside TransitionProvider')
  return ctx
}
