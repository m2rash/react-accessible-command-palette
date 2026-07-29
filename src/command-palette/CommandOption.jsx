import { Fragment } from 'react'
import { shortcutAria, shortcutGlyphs, shortcutSpeech } from './shortcuts'
import { childCount, hasChildren } from './useCommandPalette'

/**
 * Highlights the fuzzy matches.
 *
 * Deliberately `<span>` rather than `<mark>`: VoiceOver announces highlights with
 * "highlight start/end" – on every other letter of a search match that renders the
 * announcement unusable.
 */
function Highlighted({ text, ranges }) {
  if (ranges.length === 0) return text

  const parts = []
  let cursor = 0

  ranges.forEach(([start, end], index) => {
    if (start > cursor) {
      parts.push(<Fragment key={`gap-${index}`}>{text.slice(cursor, start)}</Fragment>)
    }
    parts.push(
      <span className="cp-match" key={`hit-${index}`}>
        {text.slice(start, end)}
      </span>,
    )
    cursor = end
  })

  if (cursor < text.length) parts.push(<Fragment key="tail">{text.slice(cursor)}</Fragment>)
  return parts
}

/**
 * A single option in the list.
 *
 * The accessible name of a `role="option"` is computed from its content – so
 * **DOM order is speaking order**. Label, shortcut text and submenu hint therefore
 * appear here in the order they should be read; the visual arrangement (shortcut
 * right-aligned) is left entirely to CSS.
 */
export function CommandOption({
  entry,
  ranges,
  isActive,
  id,
  labels,
  reserveIcon,
  animateIn,
  enterIndex,
  onActivate,
  onPointerMove,
  registerRef,
}) {
  const { item, trail } = entry
  const submenu = hasChildren(item)
  const count = childCount(item)

  return (
    <div
      ref={(node) => {
        registerRef(entry.key, node)
      }}
      id={id}
      role="option"
      aria-selected={isActive}
      aria-disabled={item.disabled || undefined}
      // Semantically correct, but screen reader support is patchy – the actual
      // announcement is carried by the sr-only text below.
      aria-keyshortcuts={item.shortcut ? shortcutAria(item.shortcut) : undefined}
      className={`cp-option${isActive ? ' cp-option--active' : ''}${item.disabled ? ' cp-option--disabled' : ''}${animateIn ? ' cp-option--enter' : ''}`}
      // Capped at 8 rows: beyond that the cascade would outlast the animation itself
      // and the list would feel slower, not smoother.
      style={animateIn ? { animationDelay: `${Math.min(enterIndex, 8) * 10}ms` } : undefined}
      // `pointermove` rather than `mouseenter`: fires only on real pointer movement.
      // Otherwise a re-render under a stationary pointer hijacks the selection.
      onPointerMove={() => onPointerMove(entry.key)}
      onClick={() => onActivate(entry)}
    >
      {/* Always `aria-hidden`: the label already carries the meaning, so an icon
          contributing to the accessible name would only duplicate or muddy the
          announcement. The empty span keeps labels aligned when only some entries
          in the list have an icon. */}
      {(item.icon || reserveIcon) && (
        <span className="cp-option__icon" aria-hidden="true">
          {item.icon}
        </span>
      )}

      <span className="cp-option__text">
        <span className="cp-option__label">
          <Highlighted text={item.label} ranges={ranges} />
        </span>

        {/* Origin of a cross-level match. Without it, two commands with the same
            label from different submenus would be indistinguishable – visually as
            well as to a screen reader. */}
        {trail.length > 0 && (
          <>
            <span className="cp-sr-only">, {labels.inTrail(trail)}</span>
            <span className="cp-trail" aria-hidden="true">
              {trail.join(' › ')}
            </span>
          </>
        )}

        {item.shortcut && (
          <span className="cp-sr-only">
            , {labels.shortcut(shortcutSpeech(item.shortcut, labels.keys, labels.keyJoiner))}
          </span>
        )}

        {submenu && <span className="cp-sr-only">, {labels.submenu(count)}</span>}

        {item.hint && <span className="cp-option__hint">{item.hint}</span>}
      </span>

      {item.shortcut && (
        <kbd className="cp-kbd" aria-hidden="true">
          {shortcutGlyphs(item.shortcut, labels.keyGlyphs)}
        </kbd>
      )}

      {submenu && (
        <span className="cp-chevron" aria-hidden="true">
          ›
        </span>
      )}
    </div>
  )
}
