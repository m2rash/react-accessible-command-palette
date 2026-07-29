// Controlled component – use this if you already manage the open state yourself.
export { CommandPalette } from './CommandPalette'

// Convenience wrapper: owns the state, registers the global shortcut, lets any
// component below open the palette without prop drilling.
export { CommandPaletteProvider } from './CommandPaletteProvider'
export { useCommandPaletteActions, useCommandPaletteOpen } from './paletteContext'

// Spread this to build a translation, or read it to see every overridable string.
export { defaultLabels } from './labels'

// For headless use, import directly from './command-palette/useCommandPalette'.
