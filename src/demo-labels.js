/**
 * German labels for the demo – a complete example of what a translation looks like.
 *
 * A module constant, not built inside the component: the object must be stable
 * across renders, otherwise it invalidates the memoisation inside the palette.
 *
 * Only the palette's own chrome is translated here. The command labels themselves
 * ("Open File") are application content and come from `items`.
 *
 * `keys` is written for Windows. On macOS `Mod` should speak as "Befehlstaste" –
 * branch on the platform when you build the object if you need both.
 */
export const germanLabels = {
  dialog: 'Befehlspalette',
  dialogDescription: 'Suchfeld fokussiert. Tippen filtert die Liste.',
  placeholder: 'Befehl suchen…',
  root: 'Alle Befehle',
  searchAll: 'Befehl suchen',
  searchIn: (level) => `Suchen in ${level}`,

  commands: 'Befehle',
  commandsIn: (level) => `Befehle in ${level}`,
  searchResults: 'Suchergebnisse',
  searchResultsIn: (level) => `Suchergebnisse in ${level}`,

  empty: (query) => `Keine Ergebnisse für „${query}“`,

  footerRoot:
    'Jederzeit tippen, um alle Befehle samt Untermenüs zu durchsuchen. Pfeiltasten navigieren, Eingabetaste führt aus oder öffnet ein Untermenü. Escape schließt.',
  footerSubmenu:
    'Jederzeit tippen, um dieses Untermenü samt aller Unterebenen zu durchsuchen. Pfeiltasten navigieren, Eingabetaste führt aus. Rücktaste im leeren Suchfeld geht eine Ebene zurück, Escape schließt.',

  inTrail: (trail) => `in ${trail.join(', ')}`,
  shortcut: (speech) => `Tastenkürzel ${speech}`,
  submenu: (count) => `Untermenü, ${count} ${count === 1 ? 'Eintrag' : 'Einträge'}`,

  itemCount: (count) => `${count} ${count === 1 ? 'Eintrag' : 'Einträge'}`,
  resultCount: (count) => `${count} ${count === 1 ? 'Ergebnis' : 'Ergebnisse'}`,
  levelEntered: (level, count) => `${level}, ${count}`,
  listUpdated: (count) => `Liste aktualisiert, ${count}`,
  submenuGone: (level, count) => `Untermenü nicht mehr verfügbar. ${level}, ${count}`,

  keys: {
    Mod: 'Strg',
    Ctrl: 'Strg',
    Shift: 'Umschalt',
    Enter: 'Eingabetaste',
    Backspace: 'Rücktaste',
    Delete: 'Entfernen',
    Tab: 'Tabulator',
    Space: 'Leertaste',
    ArrowUp: 'Pfeil nach oben',
    ArrowDown: 'Pfeil nach unten',
    ArrowLeft: 'Pfeil nach links',
    ArrowRight: 'Pfeil nach rechts',
  },
  keyGlyphs: {
    Delete: 'Entf',
    Space: 'Leer',
  },
  // Happens to match the default, but spelled out so this stays a complete example.
  keyJoiner: ' plus ',
}
