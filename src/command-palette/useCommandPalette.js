import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { filterItems } from './fuzzy'
import { defaultLabels } from './labels'
import { shortcutSpeech } from './shortcuts'
import { useAnnouncer } from './useAnnouncer'

const PAGE_SIZE = 10

// How long to wait before an announcement goes out.
const ANNOUNCE_DELAY = {
  query: 180, // typing: otherwise one announcement queues up per keystroke
  items: 500, // external changes: more generous, they arrive unrequested
}

export function hasChildren(item) {
  return Array.isArray(item?.children) && item.children.length > 0
}

export function childCount(item) {
  return Array.isArray(item?.children) ? item.children.length : 0
}

/**
 * Flattens the tree below `items`.
 *
 * The `key` is the composed path, **not** the item id: the same command ("Save")
 * can live in several submenus, and the entire re-announcement mechanism via
 * `aria-activedescendant` depends on unique, stable keys. Item ids must therefore
 * not contain a `/`.
 *
 * `trail` holds the ancestors' labels – the user needs those to place a match.
 */
function flatten(items, path = [], trail = [], depth = 0, out = []) {
  for (const item of items) {
    const itemPath = [...path, item.id]
    out.push({ key: itemPath.join('/'), item, path: itemPath, trail, depth })
    if (hasChildren(item)) {
      flatten(item.children, itemPath, [...trail, item.label], depth + 1, out)
    }
  }
  return out
}

/** Builds the spoken text for an entry – same order as in the DOM. */
function describeEntry(entry, labels) {
  if (!entry) return ''

  const { item, trail } = entry
  const parts = [item.label]
  if (trail.length > 0) parts.push(labels.inTrail(trail))
  if (item.shortcut) {
    parts.push(labels.shortcut(shortcutSpeech(item.shortcut, labels.keys, labels.keyJoiner)))
  }
  if (hasChildren(item)) parts.push(labels.submenu(childCount(item)))
  if (item.hint) parts.push(item.hint)

  return parts.join(', ')
}

/**
 * Walks a path of item ids from the root downwards.
 *
 * @returns {{items: Array, label: string}|null} `null` when the path no longer
 *   exists – for instance because the submenu has meanwhile vanished from the data.
 */
function resolveLevel(rootItems, path, rootLabel) {
  let items = rootItems
  let label = rootLabel

  for (const id of path) {
    const parent = items.find((item) => item.id === id)
    if (!parent || !hasChildren(parent)) return null
    items = parent.children
    label = parent.label
  }

  return { items, label }
}

/**
 * The palette's entire state: level stack, filtering, active element and the screen
 * reader announcements derived from them.
 *
 * Four details carry the accessibility:
 *
 * 1. The active element is tracked by a **stable path key**, not by an index. That
 *    way filtering changes the value of `aria-activedescendant` – which is exactly
 *    how a screen reader knows it must read again. With index-based ids the top
 *    match stays `option-0` forever, the value never changes and the announcement
 *    never happens. That is the bug present in almost every implementation.
 *
 * 2. Every state change remembers its **cause**. Arrow key navigation is announced
 *    reliably by `aria-activedescendant` – feeding a live region on top of that only
 *    produces double announcements. Typing, level and data changes on the other hand
 *    are announced unreliably and do get the live region.
 *
 * 3. Levels hold only their **path**, not the items themselves. That way the whole
 *    palette follows a changing `items` prop without any stale snapshot anywhere.
 *
 * 4. Search is **cross-level**: typing searches the entire subtree below the current
 *    level, keywords included. Every match carries its ancestors' path in the
 *    accessible name – without it, "Save" from two submenus would be
 *    indistinguishable to a screen reader user.
 */
export function useCommandPalette({ items, onClose, labels }) {
  const [stack, setStack] = useState([{ path: [], query: '', activeKey: null }])
  const [cause, setCause] = useState('level')
  const { messages, announce, cancel: cancelAnnouncement } = useAnnouncer()

  // Defensive merge so the hook also works standalone with a partial object.
  const l = useMemo(() => ({ ...defaultLabels, ...labels }), [labels])

  // Nothing is announced before the first real interaction: on open the screen
  // reader reads dialog, input and active option by itself anyway.
  // A ref rather than state so StrictMode double-mounts don't lift the block.
  const interactedRef = useRef(false)
  const prevItemsRef = useRef(items)
  const signatureRef = useRef(null)

  // Resolve every level freshly from the current items. If a path breaks the chain
  // ends there – the cleanup happens right below.
  const levels = useMemo(() => {
    const resolved = []
    for (const entry of stack) {
      const level = resolveLevel(items, entry.path, l.root)
      if (!level) break
      resolved.push({ ...entry, ...level })
    }
    return resolved
  }, [items, stack, l])

  const level = levels[levels.length - 1]
  const canGoBack = levels.length > 1

  // Submenu vanished from the data while the user was standing in it.
  // Deliberately during render rather than in an effect: React discards the render
  // and runs again immediately instead of first committing a frame with an invalid
  // stack. Converges because the condition is false afterwards.
  if (levels.length < stack.length) {
    setStack((prev) => prev.slice(0, levels.length))
    setCause('pruned')
  }

  // Without a search only the current level – otherwise the hierarchy would be gone
  // the moment the palette opens.
  const browseEntries = useMemo(
    () => level.items.map((item) => ({ key: item.id, item, path: [item.id], trail: [], depth: 0 })),
    [level.items],
  )

  // With a search, the whole subtree from here down.
  const searchEntries = useMemo(() => flatten(level.items), [level.items])

  const searching = level.query.trim() !== ''
  const results = useMemo(
    () => filterItems(searching ? searchEntries : browseEntries, level.query),
    [searching, searchEntries, browseEntries, level.query],
  )

  // Falls back to the first match when `activeKey` is empty or filtered out. That is
  // exactly why `setQuery` sets the key to `null`: typing jumps to the best match.
  const activeIndex = useMemo(() => {
    if (results.length === 0) return -1
    const found = results.findIndex((result) => result.entry.key === level.activeKey)
    return found >= 0 ? found : 0
  }, [results, level.activeKey])

  const activeEntry = activeIndex >= 0 ? results[activeIndex].entry : null

  const patchLevel = useCallback((patch) => {
    setStack((prev) => {
      const next = prev.slice()
      next[next.length - 1] = { ...next[next.length - 1], ...patch }
      return next
    })
  }, [])

  const setQuery = useCallback(
    (query) => {
      interactedRef.current = true
      setCause('query')
      patchLevel({ query, activeKey: null })
    },
    [patchLevel],
  )

  /** @param {number|'first'|'last'} target step width or jump target. */
  const move = useCallback(
    (target) => {
      if (results.length === 0) return

      let next
      if (target === 'first') {
        next = 0
      } else if (target === 'last') {
        next = results.length - 1
      } else if (Math.abs(target) === 1) {
        // Single steps wrap around at the ends.
        next = (activeIndex + target + results.length) % results.length
      } else {
        next = Math.min(results.length - 1, Math.max(0, activeIndex + target))
      }

      interactedRef.current = true
      setCause('nav')
      patchLevel({ activeKey: results[next].entry.key })
    },
    [results, activeIndex, patchLevel],
  )

  // `entry.path` is relative to the current level – for a search match from deeper
  // down the palette therefore descends several levels at once.
  const openSubmenu = useCallback((entry) => {
    interactedRef.current = true
    setCause('level')
    setStack((prev) => [
      ...prev,
      {
        path: [...prev[prev.length - 1].path, ...entry.path],
        query: '',
        activeKey: null,
      },
    ])
  }, [])

  // Query and active element live per level in the stack – going back restores both
  // instead of dropping the user at the top with no bearings.
  const back = useCallback(() => {
    interactedRef.current = true
    setCause('level')
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev))
  }, [])

  const select = useCallback(
    (entry) => {
      if (!entry || entry.item.disabled) return
      if (hasChildren(entry.item)) {
        openSubmenu(entry)
        return
      }
      // Do nothing without an action – otherwise a submenu that has become empty
      // would silently close the whole palette on Enter.
      if (!entry.item.perform) return

      onClose()
      // Close first, then run: `dialog.close()` returns focus to the opener. If the
      // action ran synchronously before that, closing could take away a focus the
      // action had just set.
      setTimeout(() => entry.item.perform(entry.item), 0)
    },
    [onClose, openSubmenu],
  )

  const setActiveByPointer = useCallback(
    (key) => {
      if (key === activeEntry?.key) return
      setCause('pointer')
      patchLevel({ activeKey: key })
    },
    [activeEntry, patchLevel],
  )

  useEffect(() => {
    if (prevItemsRef.current === items) return
    prevItemsRef.current = items
    setCause('items')
  }, [items])

  const announcement = useMemo(() => {
    // Arrow keys and mouse carry themselves – see point 2 in the hook docs.
    if (cause === 'nav' || cause === 'pointer') return null
    // The empty state is announced by the empty-state option via
    // `aria-activedescendant`. Speaking here as well produces a double announcement.
    if (results.length === 0) return null

    const count = l.itemCount(results.length)
    let head
    if (cause === 'pruned') head = l.submenuGone(level.label, count)
    else if (cause === 'items') head = l.listUpdated(count)
    else if (cause === 'level') head = l.levelEntered(level.label, count)
    else head = l.resultCount(results.length)

    return `${head}. ${describeEntry(activeEntry, l)}`
  }, [cause, results.length, activeEntry, level.label, l])

  // What the user currently perceives: how many matches, and what Enter would run.
  const signature = `${results.length}|${activeEntry?.key ?? ''}`

  useEffect(() => {
    const remember = () => {
      signatureRef.current = signature
    }

    if (!announcement) {
      // Arrow key/mouse: discard a pending typing announcement so it doesn't arrive
      // late and out of date.
      cancelAnnouncement()
      remember()
      return
    }

    // Stay silent on open – the dialog handles that itself.
    if (!interactedRef.current && cause !== 'items' && cause !== 'pruned') {
      remember()
      return
    }

    // Only announce external changes when something actually changed for the user.
    // Otherwise a list refreshing every second talks non-stop.
    if (cause === 'items' && signature === signatureRef.current) return

    remember()
    announce(announcement, { delay: ANNOUNCE_DELAY[cause] ?? 0 })
  }, [announcement, cause, signature, announce, cancelAnnouncement])

  return {
    level,
    results,
    activeEntry,
    activeIndex,
    cause,
    canGoBack,
    searching,
    query: level.query,
    breadcrumb: levels.map((entry) => entry.label),
    messages,
    pageSize: PAGE_SIZE,
    setQuery,
    move,
    select,
    back,
    setActiveByPointer,
  }
}
