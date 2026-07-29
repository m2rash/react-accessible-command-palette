import { createContext, useContext } from 'react'

/**
 * Two contexts on purpose, not one.
 *
 * Almost every consumer only wants to *open* the palette. `ActionsContext` holds a
 * value that never changes, so those components do not re-render when the palette
 * opens or closes. Only the few that actually need to know the state subscribe to
 * `OpenContext` and pay for it.
 *
 * Merging both into one object would re-render every button in the app on each open.
 */
export const ActionsContext = createContext(null)
export const OpenContext = createContext(false)

/**
 * `{ open, close, toggle }` – stable across renders, safe to use in dependency
 * arrays and event handlers.
 */
export function useCommandPaletteActions() {
  const actions = useContext(ActionsContext)
  if (!actions) {
    throw new Error('useCommandPaletteActions must be used inside <CommandPaletteProvider>')
  }
  return actions
}

/** Whether the palette is currently open. Re-renders the caller on every change. */
export function useCommandPaletteOpen() {
  return useContext(OpenContext)
}
