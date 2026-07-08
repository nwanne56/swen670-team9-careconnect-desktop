# Accessibility Testing Checklist

This checklist records the Week 9 accessibility pass over CareConnect Desktop 0.1.0. Team 9
ran it on 2026-07-07 with the mouse disconnected, using the keyboard and a screen reader
alone. The automated baseline comes from `npm run test:a11y`, which runs axe-core over the
login screen and the app shell and reports zero violations. Every check below passed, so
the notes describe what was verified rather than a pass or fail mark.

## Automated (axe-core)

The automated baseline runs axe-core in jsdom over both the login screen and the app shell,
and both come back with no violations. The app-shell audit confirms that the banner, the
navigation, the main, and the complementary landmarks are all present. Running the axe
DevTools extension against the live app by hand produces the zero-violations screenshot for
submission.

## Keyboard-only navigation

With the mouse disconnected, Tab reaches every interactive control in an order that runs
through Login, Dashboard, Notifications, Profile, and Settings, and Shift+Tab reverses
through the same order without skipping a control or landing on a dead stop. The skip link
is the first Tab stop; it becomes visible on focus and jumps to the main content. The
toolbar and the sidebar rove with the arrow keys, Home and End jump to their ends, and
`aria-current` follows the active item, while the settings tabs move with Left and Right and
activate on focus. Enter and Space activate the buttons, links, and toggles, and Esc closes
a modal or cancels a profile edit and returns focus to whatever opened it. The only focus
trap is the intended one inside a modal, which Esc leaves. The focus indicator stays visible
throughout, showing a 2px blue ring, or a 3px yellow ring in high contrast. The text fields
edit correctly, and in the allergy tag input Enter adds a tag and Backspace removes the last
one.

## Keyboard shortcuts

Every shortcut was exercised and behaves as documented.

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` / `2` / `3` | Go to Dashboard, Notifications, or Profile |
| `Ctrl+,` | Open Settings |
| `Ctrl+F` | Focus the search bar |
| `Ctrl+N` | Open the new-record dialog |
| `Ctrl+S` | Save the profile edit, or do nothing elsewhere |
| `Ctrl+\` | Toggle the right panel |
| `Ctrl+ +` / `-` / `0` | Increase, decrease, or reset the text scale |
| `Ctrl+Alt+H` | Toggle high contrast |
| `Ctrl+Alt+L` | Toggle the left-handed layout |
| `F1` | Open the keyboard shortcuts help |
| `Esc` | Close a dialog or cancel |

## Screen reader (VoiceOver)

VoiceOver announces the landmarks, and the rotor lists the banner, the navigation, the main,
and the complementary regions. The form fields announce a label, a type, and a state, which
covers the email, the password, and the remember-me checkbox, and the buttons announce a
name together with a pressed or expanded state, so the password reveal reads "Show password"
and then "Hide password, pressed". The switches announce a role and an on or off state across
high contrast, reduce motion, and the other toggles. A screen change moves focus to the `h1`
and the polite live region confirms the screen, and the status messages, which are the saves,
the setting changes, and the result counts, are announced through the `role="status"` region.
A modal announces its title on open through `role="dialog"` with `aria-labelledby`, and the
notification count is announced from the badge `aria-label`. The step-by-step walkthrough that
the video follows is in `docs/SCREEN_READER_SCRIPT.md`.

## Visual and low-vision

The text scale from 0.8× to 2.0× reflows without clipping, the high-contrast theme stays
legible with its black background and yellow accent, and the increase-text-spacing setting
applies the 1.4.12 metrics cleanly. The color contrast meets 4.5:1 for text and 3:1 for
non-text, with the values recorded in the VPAT and in `docs/ACCESSIBILITY.md`.

Every check passed, and the pass found no blocking accessibility defect.
