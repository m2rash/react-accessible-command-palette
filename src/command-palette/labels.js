/**
 * Every user-facing string of the palette. Pass a partial object as the `labels`
 * prop; it is shallow-merged over these defaults.
 *
 * Anything that depends on a value or a count is a **function, not a string**. That
 * is deliberate: English and German have two plural forms, Polish and Arabic have
 * more, and a fixed `{one, many}` shape would wall you in. It also lets you call
 * `t()` from i18next or react-intl directly inside, instead of maintaining a second
 * translation layer.
 *
 * Pass a stable object (module constant or `useMemo`) – a fresh object on every
 * render invalidates the memoisation downstream.
 *
 * Note what is **not** in here: `shortcutAria` produces `"Control+N"` for
 * `aria-keyshortcuts`. Those are specification tokens, not display text —
 * translating them would break the attribute.
 */
export const defaultLabels = {
  // Dialog and input
  dialog: 'Command palette',
  placeholder: 'Search commands…',
  /** Name of the root level, shown in the breadcrumb and announcements. */
  root: 'All commands',
  searchAll: 'Search commands',
  searchIn: (level) => `Search in ${level}`,

  // Accessible name of the listbox
  commands: 'Commands',
  commandsIn: (level) => `Commands in ${level}`,
  searchResults: 'Search results',
  searchResultsIn: (level) => `Search results in ${level}`,

  empty: (query) => `No results for “${query}”`,

  footerRoot:
    'Type anytime to search all commands including submenus. Arrow keys navigate, Enter runs or opens a submenu. Escape closes.',
  footerSubmenu:
    'Type anytime to search this submenu and everything below it. Arrow keys navigate, Enter runs. Backspace in an empty search field goes back one level, Escape closes.',

  // Parts of an entry's accessible name. The separating ", " is added by the caller,
  // so these stay readable on their own.
  inTrail: (trail) => `in ${trail.join(', ')}`,
  shortcut: (speech) => `keyboard shortcut ${speech}`,
  submenu: (count) => `submenu, ${count} ${count === 1 ? 'item' : 'items'}`,

  // Announcements
  itemCount: (count) => `${count} ${count === 1 ? 'item' : 'items'}`,
  resultCount: (count) => `${count} ${count === 1 ? 'result' : 'results'}`,
  levelEntered: (level, count) => `${level}, ${count}`,
  listUpdated: (count) => `List updated, ${count}`,
  submenuGone: (level, count) => `Submenu no longer available. ${level}, ${count}`,

  /**
   * Spoken names of shortcut tokens, merged over the built-in table in shortcuts.js.
   * Example: `{ Mod: 'Strg', Shift: 'Umschalt' }`.
   *
   * Flat, so it cannot distinguish platforms – on macOS `Mod` should usually speak
   * as "Command". If you need both, branch on the platform when you build the object.
   */
  keys: {},
  /** Visible glyphs, same merge. Example: `{ Escape: 'Esc', Delete: 'Entf' }`. */
  keyGlyphs: {},
  /** Joins the tokens when spoken – language dependent. */
  keyJoiner: ' plus ',
}
