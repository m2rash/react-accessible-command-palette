import { useEffect, useMemo, useState } from 'react'
import { CommandPalette } from './CommandPalette'
import { ActionsContext, OpenContext } from './paletteContext'

/** Default opening shortcut: Ctrl+K, or ⌘K on macOS. */
function isModK(event) {
  return (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
}

/**
 * Optional convenience wrapper: owns the open/closed state, registers the global
 * shortcut and renders the palette once at the root. Any component below can then
 * open it through `useCommandPaletteActions()` – no prop drilling.
 *
 * `CommandPalette` itself stays fully controlled and can be used without this.
 *
 * @param {object} props
 * @param {Array}  props.items  see the item model in `demo-commands.jsx`
 * @param {object} [props.labels]
 * @param {(event: KeyboardEvent) => boolean} [props.shortcut] decides which key
 *   combination opens the palette. Pass a stable function.
 */
export function CommandPaletteProvider({ items, labels, shortcut = isModK, children }) {
  const [open, setOpen] = useState(false)

  // Stable identity – consumers of ActionsContext don't re-render when the palette opens or closes.
  const actions = useMemo(
    () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
      toggle: () => setOpen((current) => !current),
    }),
    [],
  )

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Respect a handler that already claimed this key combination.
      if (event.defaultPrevented) return
      if (!shortcut(event)) return
      event.preventDefault()
      // Toggles: the same combination closes the palette again. The listener sits on
      // `window`, so it also fires while focus is inside the palette's input.
      setOpen((current) => !current)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [shortcut])

  return (
    <ActionsContext.Provider value={actions}>
      <OpenContext.Provider value={open}>
        {children}
        {/* Rendered as a sibling of the app, not inside it: the native <dialog>
            lives in the top layer anyway, and this keeps it out of any transformed
            or overflow-clipped ancestor. */}
        <CommandPalette open={open} onClose={actions.close} items={items} labels={labels} />
      </OpenContext.Provider>
    </ActionsContext.Provider>
  )
}
