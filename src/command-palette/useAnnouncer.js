import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Drives two alternately written `aria-live` regions.
 *
 * Why two? Writing the same text into the same node again is not detected as a
 * change, and screen readers stay silent. That happens in practice – two entries
 * with the same label, or re-entering the same submenu. Alternating between nodes
 * forces the announcement reliably.
 *
 * Both nodes must sit in the DOM empty from the start. A live region mounted
 * together with its content gets swallowed.
 */
export function useAnnouncer() {
  const [messages, setMessages] = useState(['', ''])
  const slotRef = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  /**
   * @param {string} text
   * @param {{delay?: number}} [options] `delay` debounces rapid successive calls –
   *   without it, typing queues up one announcement per keystroke and trails the
   *   user by seconds.
   */
  const announce = useCallback((text, { delay = 0 } = {}) => {
    clearTimeout(timerRef.current)
    if (!text) return

    const write = () => {
      const slot = slotRef.current
      slotRef.current = slot === 0 ? 1 : 0
      // Clear the other node so no stale text lingers. Clearing does not itself
      // trigger an announcement.
      setMessages(slot === 0 ? [text, ''] : ['', text])
    }

    if (delay > 0) timerRef.current = setTimeout(write, delay)
    else write()
  }, [])

  /**
   * Discards an announcement that has not been spoken yet.
   *
   * Needed when the user types and immediately presses an arrow key: otherwise the
   * debounced timer still speaks the outdated message while the user has long
   * moved on.
   */
  const cancel = useCallback(() => {
    clearTimeout(timerRef.current)
  }, [])

  return { messages, announce, cancel }
}
