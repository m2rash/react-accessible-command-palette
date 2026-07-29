/**
 * A shortcut is modelled as a token array (`['Mod', 'K']`) and translated into three
 * separate representations:
 *
 *  - `shortcutGlyphs`  – visible, compact, symbolic (`⌘K`). Useless to a screen
 *                        reader, so it is always `aria-hidden` in the markup.
 *  - `shortcutSpeech`  – spelled out ("Ctrl plus K"). This is the version that
 *                        actually gets announced.
 *  - `shortcutAria`    – canonical ARIA tokens ("Control+K") for `aria-keyshortcuts`.
 *                        Semantically correct, but screen reader support is patchy –
 *                        so it supplements the information rather than carrying it.
 *
 * `Mod` stands for the platform's command key (⌘ on macOS, Ctrl elsewhere).
 */

function detectMac() {
  if (typeof navigator === 'undefined') return false
  const platform = navigator.userAgentData?.platform ?? navigator.platform ?? ''
  return /mac|iphone|ipad|ipod/i.test(platform)
}

const IS_MAC = detectMac()

const GLYPHS = {
  Mod: IS_MAC ? '⌘' : 'Ctrl',
  Meta: IS_MAC ? '⌘' : 'Win',
  Ctrl: IS_MAC ? '⌃' : 'Ctrl',
  Alt: IS_MAC ? '⌥' : 'Alt',
  Shift: '⇧',
  Enter: '↵',
  Escape: 'Esc',
  Backspace: '⌫',
  Delete: 'Del',
  Tab: '⇥',
  Space: 'Space',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
}

const SPEECH = {
  Mod: IS_MAC ? 'Command' : 'Control',
  Meta: IS_MAC ? 'Command' : 'Windows key',
  Ctrl: 'Control',
  Alt: IS_MAC ? 'Option' : 'Alt',
  Shift: 'Shift',
  Enter: 'Enter',
  Escape: 'Escape',
  Backspace: 'Backspace',
  Delete: 'Delete',
  Tab: 'Tab',
  Space: 'Spacebar',
  ArrowUp: 'Up arrow',
  ArrowDown: 'Down arrow',
  ArrowLeft: 'Left arrow',
  ArrowRight: 'Right arrow',
}

// Modifier tokens permitted by the ARIA specification.
const ARIA_TOKENS = {
  Mod: IS_MAC ? 'Meta' : 'Control',
  Meta: 'Meta',
  Ctrl: 'Control',
  Alt: 'Alt',
  Shift: 'Shift',
  Space: 'Space',
}

/**
 * @param {string[]} tokens
 * @param {Record<string, string>} [overrides] from `labels.keyGlyphs`
 * @returns {string} e.g. `⌘K` or `Ctrl+K`
 */
export function shortcutGlyphs(tokens, overrides = {}) {
  return tokens.map((token) => overrides[token] ?? GLYPHS[token] ?? token).join(IS_MAC ? '' : '+')
}

/**
 * @param {string[]} tokens
 * @param {Record<string, string>} [overrides] from `labels.keys`
 * @param {string} [joiner] from `labels.keyJoiner`
 * @returns {string} e.g. `Control plus K` – spelled out so nothing gets swallowed.
 */
export function shortcutSpeech(tokens, overrides = {}, joiner = ' plus ') {
  return tokens.map((token) => overrides[token] ?? SPEECH[token] ?? token).join(joiner)
}

/**
 * Never localized – these are ARIA specification tokens, not display text.
 *
 * @returns {string} e.g. `Control+K` for `aria-keyshortcuts`
 */
export function shortcutAria(tokens) {
  return tokens.map((token) => ARIA_TOKENS[token] ?? token).join('+')
}
