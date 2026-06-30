# Accessibility notes

CareConnect aims for WCAG 2.2 AA in the default theme and AAA in high contrast. These
notes cover the focus order, the focus styling, the status semantics, and the success
criteria that the main decisions map to.

## Focus order

The tab order follows the reading order, left to right and top to bottom, and it never
relies on a positive `tabindex`.

On the login screen the order runs through these elements.

| # | Element | Role | Note |
|---|---------|------|------|
| 1 | Email field | `textbox` | Takes focus on load |
| 2 | Password field | `textbox` | |
| 3 | Show or hide password | `button` | Has `aria-pressed` and a label that flips |
| 4 | Remember me | `checkbox` | |
| 5 | Forgot password | `link` | |
| 6 | Sign in | `button` | Submits the form |
| 7 | High contrast | `switch` | Has `aria-checked` |

If a submit fails, the error block becomes an assertive `role="alert"` and focus jumps
to the first field that needs fixing.

The app shell keeps the same order on every screen.

| # | Region | Role | Note |
|---|--------|------|------|
| 0 | Skip link | `link` | Jumps to the main content |
| 1 | Menu bar | `menubar` | Arrow keys move within a menu |
| 2–5 | Toolbar | `toolbar` | Arrow-key roving, with the active item marked by `aria-current` |
| 6 | Search | `searchbox` | `Ctrl+F` lands here |
| 7 | Panel toggle | `button` | Has `aria-pressed` |
| 8–11 | Sidebar links | `navigation` | Arrow-key roving, with the active item marked by `aria-current` |
| 12+ | Main content | `main` | Carries `tabindex="-1"` as the skip-link target |
| last | Right panel | `complementary` | Can be turned off |

When the screen changes, focus moves to the new heading so a screen reader announces
where the user landed. A short message goes out on the live region at the same time.

## Focus styling (2.4.7, 2.4.11)

Every interactive element gets a 2px `#0052CC` outline through `:focus-visible`, offset
by 2px. High contrast raises that to a 3px `#FFFF00` outline. The ring measures 7.2:1
against the light background and 19.6:1 in high contrast, both above the 3:1 floor for
non-text contrast. The only outline that is suppressed belongs to the screen heading
that takes focus on navigation. That heading is not a tab stop, so a ring there would
only be noise.

## Keyboard (2.1.1, 2.1.2)

Anything the mouse can do, the keyboard can do as well, and the bindings live in
[KEYBOARD_SHORTCUTS.md](./KEYBOARD_SHORTCUTS.md). The one focus trap is inside a dialog,
which is the behavior people expect. Esc closes the dialog and focus returns to whatever
opened it. The toolbar, the sidebar, and the settings tabs all use roving tabindex with
arrow keys.

Search is fully reachable from the keyboard. `Ctrl+F` focuses it, Enter runs it, and Esc
clears it. The results come back as plain buttons grouped by section, so Tab and Enter
behave the way you would expect.

The allergies field in the profile editor is a tag input. You type an allergy and press
Enter to add it, press Backspace on the empty field to drop the last one, and use the
small remove button on each tag to take it off. Common allergens come through a
`<datalist>`. Those remove buttons are 24px square, which meets the AA target size.

## Status without color (1.4.1)

No status depends on color alone. Every badge pairs an icon and a text label with its
color, so the meaning survives in grayscale or high contrast. Success shows a check and
reads "success" or "Active", a warning shows a triangle, an error shows a crossed circle,
and an info badge shows a circled i. Progress bars carry `role="progressbar"` with
`aria-valuenow`, and the percentage is printed as text next to the bar.

## Announcements (4.1.3)

A single `role="status"` element with `aria-live="polite"` carries most of the spoken
feedback. A failed login is the exception and uses an assertive alert. Saving, changing a
setting, and toggling a switch all announce the result, and a switch reads the full
action, such as "High contrast mode, on". The notification count sits in an `aria-label`
on the badge. Opening a dialog announces its title through `role="dialog"` and
`aria-labelledby`. Moving the text-scale slider reads its value, a screen change reads the
new heading, and a search reads the number of results.

The main content area is not a live region, and that is on purpose. Making it one would
re-read the whole screen every time it re-renders, so the navigation feedback comes from
moving focus to the heading instead.

## Contrast (1.4.3, 1.4.6, 1.4.11)

| Element | Light | High contrast | Target |
|---------|-------|---------------|--------|
| Body text on background | 14.8:1 | 21:1 | 4.5:1 |
| Muted text on background | 5.1:1 | n/a | 4.5:1 |
| White on the primary blue | 7.2:1 | n/a | 4.5:1 |
| White on black | n/a | 21:1 | 7:1 |
| Yellow accent on black | n/a | 19.6:1 | 7:1 |
| Focus ring | 7.2:1 | 19.6:1 | 3:1 |

The body text is dark gray on warm off-white rather than black on white. It is easier on
the eyes, which helps dyslexic readers in particular, and it still clears AA.

## Type (1.4.8, 1.4.12, 3.1.5)

The interface uses Atkinson Hyperlegible and falls back to Verdana. Text is left aligned
with a line height of 1.5 and no justified paragraphs. The text-scale control runs from
0.8x to 2.0x and the layout reflows without anything clipping. An optional text-spacing
setting applies the 1.4.12 metrics, widening the line height, the letter spacing, and the
word spacing. The copy throughout is kept short and plain.

## Consistent layout (3.2.3, 2.4.6)

The menu bar and the toolbar stay in the same place and the same order on every screen.
Each screen has a single heading and a few short, labeled sections.

## Target size (2.5.5, 2.5.8)

Buttons, inputs, toggles, and navigation items are all at least 44px square, which is well
over the 24px AA minimum. The remove buttons on allergy tags are the one exception at
24px, and they still meet AA.

## Handedness

Two things cover this. The keyboard-first design is already neutral, since nothing forces
a right-handed mouse reach. On top of that, a left-handed layout toggle in Settings (also
`Ctrl+Alt+L` or the View menu) mirrors the shell. The sidebar navigation moves to the
left, the info panel moves to the right, the toolbar tabs shift to the dominant side, and
the dialog buttons and toasts anchor to the left so they do not sit under a left hand on a
touch or pen screen. The input affixes, like the password reveal button, move to the
leading edge as well. The setting takes effect right away and is remembered. Swapping the
mouse buttons and the operating system pointer-handedness setting are out of scope, since
those belong to the system rather than the app.

## Known gaps

A few things are not done yet. The screen reader coverage is incomplete, and the search
results area still needs more ARIA work. There is no automated axe-core run, only manual
passes with NVDA and the keyboard. Forms validate when you submit rather than as you type,
which is something planned for Week 8.
