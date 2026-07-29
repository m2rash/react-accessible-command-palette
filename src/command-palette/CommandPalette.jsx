import { useCallback, useEffect, useId, useMemo, useRef } from 'react'
import { CommandOption } from './CommandOption'
import { defaultLabels } from './labels'
import { useCommandPalette } from './useCommandPalette'
import './command-palette.css'

/**
 * Accessible command palette.
 *
 * Built on the ARIA **combobox + listbox** pattern: focus stays in the input at all
 * times (you must be able to start typing at any moment) and `aria-activedescendant`
 * points at the active option. That rules out a roving tabindex, and the
 * `role="menu"` pattern would be wrong – menus bring their own typeahead, which
 * collides with a real text field.
 *
 * @param {object}   props
 * @param {boolean}  props.open
 * @param {() => void} props.onClose
 * @param {Array}    props.items  see the item model in `demo-commands.js`
 * @param {object}   [props.labels]  partial override, see `labels.js`. Pass a stable
 *   object – a fresh one per render churns the memoisation.
 */
export function CommandPalette({ open, onClose, items, labels }) {
  const dialogRef = useRef(null)
  const openerRef = useRef(null)

  // Merged once here so both the dialog's own name and everything below share it.
  const l = useMemo(() => ({ ...defaultLabels, ...labels }), [labels])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    // The `dialog.open` check makes the effect idempotent: StrictMode invokes it
    // twice, and a second showModal() would throw.
    if (open && !dialog.open) {
      openerRef.current = document.activeElement
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
      openerRef.current?.focus?.()
      openerRef.current = null
    }
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    // Escape fires `cancel` on the <dialog> and would close it behind React's back.
    // Intercept it and route it through our path so cleanup and focus restoration
    // run exactly once.
    const handleCancel = (event) => {
      event.preventDefault()
      onClose()
    }

    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  return (
    // Native <dialog> + showModal(): provides top layer, focus trap, inert
    // background and backdrop – more robust than any hand-built focus trap.
    // `aria-modal` is implicit.
    <dialog
      ref={dialogRef}
      className="cp-dialog"
      aria-label={l.dialog}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
    >
      {/* Content only while open: that way every session starts with fresh state
          (query, level, active element). */}
      {open && <PaletteBody items={items} onClose={onClose} labels={l} />}
    </dialog>
  )
}

function PaletteBody({ items, onClose, labels }) {
  const baseId = useId()
  const listboxId = `${baseId}-listbox`
  const emptyOptionId = `${baseId}-empty`
  // Ids from the stable path key, never from the index – see useCommandPalette.
  const optionId = (key) => `${baseId}-opt-${key}`

  const inputRef = useRef(null)
  const optionNodes = useRef(new Map())

  const {
    level,
    results,
    activeEntry,
    cause,
    canGoBack,
    searching,
    query,
    breadcrumb,
    messages,
    pageSize,
    setQuery,
    move,
    select,
    back,
    setActiveByPointer,
  } = useCommandPalette({ items, onClose, labels })

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const registerRef = useCallback((key, node) => {
    if (node) optionNodes.current.set(key, node)
    else optionNodes.current.delete(key)
  }, [])

  useEffect(() => {
    // Don't scroll on pointer-driven changes, otherwise the list jitters under the
    // cursor.
    if (cause === 'pointer' || !activeEntry) return
    optionNodes.current.get(activeEntry.key)?.scrollIntoView({ block: 'nearest' })
  }, [activeEntry, cause])

  // Reserve the icon column for the whole list as soon as one visible entry has an
  // icon, otherwise the labels of the others jag out of alignment.
  const reserveIcon = results.some(({ entry }) => entry.item.icon)

  // While searching, matches come from the whole subtree rather than just this
  // level – the list's name has to convey that.
  let listLabel = labels.commands
  if (searching) {
    listLabel = canGoBack ? labels.searchResultsIn(level.label) : labels.searchResults
  } else if (canGoBack) {
    listLabel = labels.commandsIn(level.label)
  }

  function handleKeyDown(event) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        move(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        move(-1)
        break
      case 'PageDown':
        event.preventDefault()
        move(pageSize)
        break
      case 'PageUp':
        event.preventDefault()
        move(-pageSize)
        break
      case 'Home':
      case 'End':
        // Only navigate while the field is empty. With text typed these keys belong
        // to the caret – screen reader users review their input with them, and that
        // must not be taken away.
        if (query === '') {
          event.preventDefault()
          move(event.key === 'Home' ? 'first' : 'last')
        }
        break
      case 'Enter':
        // During an IME composition Enter belongs to the input method.
        if (event.nativeEvent.isComposing) return
        event.preventDefault()
        select(activeEntry)
        break
      case 'Backspace':
        // Only go back a level while the field is empty – otherwise normal deletion.
        if (query === '' && canGoBack) {
          event.preventDefault()
          back()
        }
        break
      case 'Escape':
        event.preventDefault()
        onClose()
        break
      default:
        break
    }
  }

  return (
    <div className="cp-panel">
      {canGoBack && <p className="cp-breadcrumb">{breadcrumb.join(' › ')}</p>}

      <input
        ref={inputRef}
        type="text"
        className="cp-input"
        role="combobox"
        aria-expanded="true"
        aria-controls={listboxId}
        // Always points at something – at the empty-state option when there are no
        // matches. Removing the attribute instead makes the screen reader fall back
        // to the focused element and read the whole combobox again.
        aria-activedescendant={activeEntry ? optionId(activeEntry.key) : emptyOptionId}
        aria-autocomplete="list"
        aria-label={canGoBack ? labels.searchIn(level.label) : labels.searchAll}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        placeholder={labels.placeholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div id={listboxId} role="listbox" className="cp-list" aria-label={listLabel}>
        {results.map(({ entry, ranges }, index) => (
          <CommandOption
            key={entry.key}
            id={optionId(entry.key)}
            entry={entry}
            ranges={ranges}
            isActive={activeEntry?.key === entry.key}
            labels={labels}
            reserveIcon={reserveIcon}
            animateIn={cause === 'level'}
            enterIndex={index}
            registerRef={registerRef}
            onActivate={select}
            onPointerMove={setActiveByPointer}
          />
        ))}

        {/* A disabled option inside the listbox so `aria-activedescendant` still has
            a target. `aria-disabled` keeps it from being announced as selectable.
            Here the reference carries the announcement, not the live region –
            otherwise the empty state would be heard twice. */}
        {results.length === 0 && (
          <div
            id={emptyOptionId}
            role="option"
            aria-disabled="true"
            aria-selected="false"
            className="cp-empty"
          >
            {labels.empty(query)}
          </div>
        )}
      </div>

      {/* Context dependent: inside a submenu the way back is the most important
          information, at the root it is that submenus exist at all. Full sentences
          rather than separators like "·" – those get spoken depending on the
          punctuation settings. */}
      <p className="cp-footer">{canGoBack ? labels.footerSubmenu : labels.footerRoot}</p>

      {/* Two alternately written regions – see useAnnouncer. Both sit in the DOM
          empty from the start. */}
      <div className="cp-sr-only" aria-live="polite" aria-atomic="true">
        {messages[0]}
      </div>
      <div className="cp-sr-only" aria-live="polite" aria-atomic="true">
        {messages[1]}
      </div>
    </div>
  )
}
