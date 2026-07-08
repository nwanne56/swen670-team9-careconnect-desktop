# Accessibility Screenshots

These images were captured from the real Electron application on 2026-07-08. The screens
were driven by keyboard, and the axe scan ran inside Electron's Chromium (version 126), so
the color-contrast rule was evaluated against the real layout engine.

| File | What it shows |
|------|---------------|
| `01-login.png` | The login screen as first seen, with the high-contrast switch. |
| `02-dashboard.png` | The signed-in dashboard, with the toolbar, sidebar, and info panel. |
| `03-notifications.png` | The notifications screen, with icon-and-text status badges. |
| `04-profile.png` | The profile view, with the summary card and detail rows. |
| `05-settings-accessibility.png` | The Accessibility settings tab, with the switches and text-scale control. |
| `06-settings-keyboard.png` | The Keyboard settings tab, with the shortcut table. |
| `07-help-modal.png` | The keyboard-shortcuts dialog, which traps focus and closes on Esc. |
| `08-high-contrast.png` | The dashboard in the high-contrast (AAA) theme. |
| `09-search-results.png` | The search results screen, reached from the keyboard. |
| `10-axe-report.png` | The axe-core audit summary: zero violations on both states. |
| `11-coverage.png` | The Istanbul coverage report from `npm test`. |
| `12-keyboard-focus.png` | The focus ring on the Sign In button after five Tab presses. |
| `13-screenreader-tree.png` | The role, name, and state a screen reader announces for each element. |

The raw axe results are in `axe-results.json`, and `axe-report.html` is the source page for
`10-axe-report.png`. The screen-reader announcement data is in `accessibility-tree.json`, and
`accessibility-tree.html` is the source page for `13-screenreader-tree.png`; both are read from
the live accessibility tree that Chromium hands to assistive technology, not a recording of
speech. The coverage HTML report lives at `../../coverage/lcov-report/index.html` with the
machine-readable data in `../../coverage/lcov.info`.

## What still needs a person

The 3–5 minute screen-reader video and the 10–15 minute build-and-test video require a person
to record the screen and, for the screen-reader video, to narrate a live VoiceOver or NVDA
session. Follow `../SCREEN_READER_SCRIPT.md` for the walkthrough. NVDA runs on Windows only;
on macOS use VoiceOver (Cmd+F5), which is its equivalent.
