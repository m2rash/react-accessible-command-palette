import { useCallback, useEffect, useMemo, useState } from 'react'
import { CommandPaletteProvider, useCommandPaletteActions } from './command-palette'
import { createDemoCommands } from './demo-commands'
import { germanLabels } from './demo-labels'
import './App.css'

/**
 * Deliberately a separate component and not a prop from App: this is the point of
 * the provider – anything anywhere below it can open the palette without the state
 * or a setter being threaded through the tree.
 */
function OpenPaletteButton() {
  const { open } = useCommandPaletteActions()

  return (
    <button type="button" className="demo-trigger" onClick={open}>
      Open command palette
    </button>
  )
}

function App() {
  const [log, setLog] = useState([])
  const [auto, setAuto] = useState(false)
  const [german, setGerman] = useState(false)
  const [feed, setFeed] = useState([
    { id: 'msg-1', label: 'Message 1' },
    { id: 'msg-2', label: 'Message 2' },
    { id: 'msg-3', label: 'Message 3' },
  ])

  const run = useCallback((message) => {
    setLog((prev) => [{ id: (prev[0]?.id ?? 0) + 1, message }, ...prev].slice(0, 8))
  }, [])

  const addEntry = useCallback(() => {
    setFeed((prev) => {
      const next = prev.reduce((max, entry) => Math.max(max, Number(entry.id.slice(4))), 0) + 1
      return [...prev, { id: `msg-${next}`, label: `Message ${next}` }].slice(-6)
    })
  }, [])

  const removeEntry = useCallback(() => setFeed((prev) => prev.slice(0, -1)), [])

  const items = useMemo(() => createDemoCommands(run, feed), [run, feed])

  useEffect(() => {
    if (!auto) return
    const id = setInterval(addEntry, 3000)
    return () => clearInterval(id)
  }, [auto, addEntry])

  return (
    <CommandPaletteProvider items={items} labels={german ? germanLabels : undefined}>
      <main className="demo">
        <h1>CommandPalette</h1>

        <p>
          Toggle with <kbd>Ctrl</kbd> + <kbd>K</kbd> (or <kbd>⌘</kbd> + <kbd>K</kbd>) — the same
          combination closes it again — or use the button.
        </p>

        <OpenPaletteButton />

        <ul className="demo-keys">
          <li>
            The search field is always focused – just start typing, the highlight jumps to the
            best match.
          </li>
          <li>Arrow keys navigate, Page Up/Down jumps in steps of ten.</li>
          <li>Home/End jump to the first and last entry while the field is empty.</li>
          <li>Enter runs the command or opens a submenu.</li>
          <li>
            Search spans all levels: “load” finds “Open File” from the <em>File</em> submenu,
            including its origin. Keywords count too.
          </li>
          <li>
            Inside a submenu the search is limited to that subtree; Backspace in an empty
            search field goes back one level.
          </li>
          <li>Escape closes – from any level.</li>
        </ul>

        <fieldset className="demo-feed">
          <legend>Palette language</legend>
          <p>
            Swaps only the palette's own chrome — labels, footer and every screen reader
            announcement. The command names come from <code>items</code> and stay English.
          </p>
          <div className="demo-feed__controls">
            <label>
              <input
                type="checkbox"
                checked={german}
                onChange={(event) => setGerman(event.target.checked)}
              />
              German
            </label>
          </div>
        </fieldset>

        <fieldset className="demo-feed">
          <legend>Dynamic list – “Inbox” ({feed.length})</legend>
          <p>
            Leave the palette open and change things here: the submenu follows live. Empty the
            list entirely and “Inbox” disappears from the root – if you are standing inside it,
            the palette pops up one level and says so.
          </p>
          <div className="demo-feed__controls">
            <button type="button" onClick={addEntry}>
              Add entry
            </button>
            <button type="button" onClick={removeEntry} disabled={feed.length === 0}>
              Remove last
            </button>
            <label>
              <input
                type="checkbox"
                checked={auto}
                onChange={(e) => setAuto(e.target.checked)}
              />
              Every 3 s automatically
            </label>
          </div>
        </fieldset>

        {/* Always mounted so the first message does not get swallowed. */}
        <p className="demo-status" role="status">
          {log.length > 0 ? `Last run: ${log[0].message}` : ''}
        </p>

        {log.length > 0 && (
          <section className="demo-log" aria-label="Commands run">
            <h2>Log</h2>
            <ol>
              {log.map((entry) => (
                <li key={entry.id}>{entry.message}</li>
              ))}
            </ol>
          </section>
        )}
      </main>
    </CommandPaletteProvider>
  )
}

export default App
