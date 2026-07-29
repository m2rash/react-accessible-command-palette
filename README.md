# CommandPalette

An accessible command palette for React. Built because most existing components fall
down on exactly the parts that matter to screen reader users — above all: **when the
highlighted entry changes because you typed, the screen reader must read it out
again.**

Zero dependencies beyond React. 11 files, ~1450 lines.

## Running the demo

```bash
npm install
npm run dev
```

Open the palette with `Ctrl`/`Cmd`+`K`. The demo page also has toggles for a live
changing list and for German labels, so the localisation and the announcements can be
tested with a real screen reader.

## Installing into another project

Copy `src/command-palette/` — that's it.

```
CommandPalette.jsx           CommandOption.jsx   command-palette.css
useCommandPalette.js         useAnnouncer.js     fuzzy.js
shortcuts.js                 labels.js           index.js
CommandPaletteProvider.jsx   paletteContext.js
```

**Requirements:** React 18+ (uses `useId`) and a bundler that handles CSS imports
(Vite, webpack, Next). On the Next.js App Router add `'use client'` at the top of
`CommandPalette.jsx`.

The demo files (`demo-commands.jsx`, `demo-icons.jsx`, `demo-labels.js`) are examples
and not needed. `demo-commands.jsx` documents the item model most thoroughly, so it
is worth keeping around as a reference while you build your own items.

## Usage

Wrap your app once. The provider owns the open state, registers the global shortcut
and renders the palette at the root.

```jsx
import { useMemo } from 'react'
import { CommandPaletteProvider } from './command-palette'

function App() {
  const items = useMemo(
    () => [
      { id: 'save', label: 'Save', shortcut: ['Mod', 'S'], perform: () => save() },
      {
        id: 'file',
        label: 'File',
        children: [
          { id: 'file.open', label: 'Open File', keywords: ['load'], perform: () => openFile() },
        ],
      },
    ],
    [],
  )

  return (
    <CommandPaletteProvider items={items}>
      <YourApp />
    </CommandPaletteProvider>
  )
}
```

### Opening it from anywhere

Any component below the provider can open the palette — no props, no drilling:

```jsx
import { useCommandPaletteActions } from './command-palette'

function Toolbar() {
  const { open, close, toggle } = useCommandPaletteActions()
  return <button onClick={open}>Commands</button>
}
```

`useCommandPaletteOpen()` returns the boolean if you need it, but prefer the actions
hook: its value never changes identity, so components that only *open* the palette do
not re-render every time it opens or closes.

The default shortcut is `Ctrl`/`Cmd`+`K` and it **toggles** — the same combination
closes the palette again. Override it with a predicate:

```jsx
<CommandPaletteProvider items={items} shortcut={(e) => e.key === 'F1'}>
```

### Using it controlled instead

If you already manage the state yourself — in Redux, Zustand, a router, whatever —
skip the provider and use the component directly. It holds no open/closed state of
its own.

```jsx
<CommandPalette open={paletteOpen} onClose={closePalette} items={items} />
```

Name that state after the palette rather than a generic `open`; a real app has modals
and drawers too.

### Props

**`<CommandPaletteProvider>`**

| Prop | Type | |
|---|---|---|
| `items` | `Item[]` | required |
| `labels` | `object` | optional, see [Localisation](#localisation) |
| `shortcut` | `(event) => boolean` | optional, defaults to Ctrl/⌘+K. Pass a stable function |
| `children` | `ReactNode` | |

**`<CommandPalette>`**

| Prop | Type | |
|---|---|---|
| `open` | `boolean` | required |
| `onClose` | `() => void` | required |
| `items` | `Item[]` | required |
| `labels` | `object` | optional |

## Item model

```js
{
  id:       'file.new',        // required. Unique per level, must not contain "/"
  label:    'New File',
  icon:     <FileIcon />,      // optional, left of the label, always hidden from AT
  keywords: ['create'],        // optional, searched alongside the label
  shortcut: ['Mod', 'N'],      // optional, display + announcement only
  hint:     'Creates a file',  // optional
  disabled: false,             // optional
  children: [ /* items */ ],   // optional → opens a sublist
  perform:  (item) => {},      // optional → leaf action
}
```

Shortcut tokens: `Mod` (⌘ on macOS, Ctrl elsewhere), `Ctrl`, `Alt`, `Shift`, `Meta`,
plus key names (`Enter`, `Escape`, `ArrowUp`, …) and single characters.

The list may change at any time — just pass a new array. The palette resolves every
level freshly on each render, even while it is open. If a submenu disappears while the
user is inside it, the palette pops up one level and announces that.

## Keyboard

| Key | |
|---|---|
| any character | searches immediately; the input is always focused |
| ↑ / ↓ | move, wrapping at both ends |
| Page Up / Page Down | ± 10 |
| Home / End | first / last — **only while the field is empty**, otherwise they belong to the caret |
| Enter | runs the command, or enters a submenu |
| Backspace | back one level — **only while the field is empty**, otherwise normal deletion |
| Escape | closes, from any level |

Search is cross-level: it covers the whole subtree below the current level, keywords
included. Matches from deeper levels carry their origin ("Open File, in File").

## Theming

Ten `--cp-*` custom properties, each with a literal fallback. The palette looks right
with no configuration; to adopt your theme, map your tokens once:

```css
:root {
  --cp-bg: var(--my-surface);
  --cp-text: var(--my-text-muted);
  --cp-text-strong: var(--my-text);
  --cp-border: var(--my-border);
  --cp-surface: var(--my-subtle);
  --cp-accent: var(--my-brand);
  --cp-accent-bg: var(--my-brand-subtle);
  --cp-accent-border: var(--my-brand-muted);
  --cp-shadow: var(--my-shadow);
  --cp-mono: var(--my-mono);
}
```

Deliberately not reading generic names like `--bg` directly: in a host project those
usually mean something else.

The backdrop is a blurred scrim, light in light themes and dark in dark ones, driven
by `prefers-color-scheme`. Override it with `--cp-backdrop`. It carries literal
fallbacks because browsers disagree on whether `::backdrop` inherits custom
properties from the dialog.

### Motion

Opening and closing fade and lift the dialog by a few pixels; entering or leaving a
submenu fades the rows in. All of it is decoration and all of it is skipped under
`prefers-reduced-motion: reduce` — the palette then simply appears at once.

The dialog animation uses `@starting-style` with `transition-behavior: allow-discrete`,
which is how a top-layer element can be animated in CSS at all. Browsers without
support show it instantly; nothing breaks.

Blur is dropped in favour of an opaque scrim under
`prefers-reduced-transparency: reduce`.

## Localisation

Every user-facing string lives in `labels.js` — 23 keys. Anything that depends on a
value or a count is a **function**, so plural rules stay yours (English and German
have two forms, Polish and Arabic more) and you can call `t()` from i18next or
react-intl directly inside.

```jsx
import { defaultLabels } from './command-palette'

// A module constant, not built during render: a fresh object every render
// invalidates the memoisation inside the palette.
const labels = {
  ...defaultLabels,
  dialog: 'Befehlspalette',
  placeholder: 'Befehl suchen…',
  empty: (query) => `Keine Ergebnisse für „${query}“`,
  resultCount: (n) => `${n} ${n === 1 ? 'Ergebnis' : 'Ergebnisse'}`,
  keys: { Mod: 'Strg', Shift: 'Umschalt' },
}

<CommandPalette labels={labels} /* … */ />
```

See `src/demo-labels.js` for a complete German translation.

`aria-keyshortcuts` is never localised — `"Control+N"` are ARIA specification tokens,
not display text.

## How the accessibility works

Worth knowing before you modify anything.

**Combobox + listbox, not menu.** Focus stays in the input at all times, so
`aria-activedescendant` is the only correct mechanism — a roving tabindex is out, and
the `menu` pattern would fight the text field with its own typeahead.

**Option ids come from a stable path key, never from an index.** This is the bug in
almost every implementation: with `option-0`, `option-1` the top match keeps the same
id while filtering, the value of `aria-activedescendant` never changes, and the screen
reader stays silent. Ids here are `file/file.open`, so filtering changes the reference
and the announcement happens.

**Two announcement channels, split by cause.** Arrow key navigation is announced
reliably by `aria-activedescendant`; adding a live region there only produces double
speech. Typing, level changes and external data changes are announced unreliably and
do get the live region.

| Cause | `aria-activedescendant` | live region |
|---|---|---|
| arrow keys, Home/End, Page Up/Down | carries it | silent |
| typing | unreliable | yes, with result count |
| level change | yes | yes, with context |
| external `items` change | yes | only if count or active entry changed |
| mouse hover | yes | silent |

**Live region details.** Two alternately written nodes, because identical text in the
same node is not detected as a change. Both sit in the DOM empty from the start, since
a region mounted together with its content gets swallowed. Typing announcements are
debounced 180 ms and discarded if the user navigates away first.

**Shortcuts are marked up three ways.** Visible `⌘K` as `aria-hidden`, spelled out
"keyboard shortcut Control plus N" in the accessible name, and `aria-keyshortcuts` for
correctness. Support for the last one is patchy, which is why it supplements rather
than carries the information.

**Native `<dialog>` + `showModal()`** provides the top layer, focus trap, inert
background and backdrop. The `cancel` event is intercepted so Escape runs through the
same close path as everything else.

## Gotchas

**Item ids must not contain `/`.** The path key is built from them, and the
re-announcement depends on it being unique.

**Keep `items` and `labels` stable** (`useMemo` or a module constant). A fresh object
every render triggers unnecessary announcements.

**Icon names like `File`, `Text`, `Image`, `Option` are DOM globals.** Forget the
import and JSX silently falls back to the global constructor — ESLint will not warn,
because they are legitimately defined browser globals.

## Known limitations

- **No diacritic folding.** `einfugen` does not match `Einfügen`. Fixable inside
  `fuzzyScore` in `fuzzy.js` with NFD normalisation.
- **Shortcuts are display-only.** The palette shows and announces them; registering
  real global hotkeys is your app's job.
- **No virtualisation.** `aria-activedescendant` requires the referenced option to be
  in the DOM, so long lists render in full.
- **No groups or sections** inside a level.
- **The `keys` label map is platform-flat.** On macOS `Mod` should speak as "Command";
  branch on the platform when building the object if you need both.
- **Search is scoped to the current subtree**, not always the whole tree. Entering a
  submenu therefore acts as a filter.
