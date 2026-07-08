# Voluntary Product Accessibility Template (VPAT®) 2.5

## CareConnect Desktop

**Name of Product/Version:** CareConnect Desktop 0.1.0 (Electron with a React renderer)
**Report Date:** 2026-07-07
**Product Description:** CareConnect is a desktop-first, keyboard-first health portal. It
has a native menu bar with accelerators, a contextual toolbar, a sidebar, and a right-hand
info panel. The screens are Login, Dashboard, Notifications, a Profile with a view and an
edit mode, and a tabbed Settings page that covers General, Accessibility, Keyboard, and
About.
**Contact Information:** SWEN 661 — Team 9
**Notes:** The application runs in a single window and has no backend. Preferences persist
to `localStorage`.
**Evaluation Methods Used:** The evaluation combined three methods. Automated checks ran
axe-core 4.10 through `jest-axe` in the Jest suite (`test/accessibility.test.js`) and the
axe DevTools browser extension against the running renderer. A manual keyboard-only pass
covered the whole application with the mouse disconnected, and is recorded in
`docs/TESTING_CHECKLIST.md`. A screen-reader pass used VoiceOver on macOS, following
`docs/SCREEN_READER_SCRIPT.md`.

### Applicable Standards/Guidelines

| Standard/Guideline | Included In Report |
|---|---|
| WCAG 2.1 Level A | Yes |
| WCAG 2.1 Level AA | Yes |

### Terms

- **Supports:** The functionality meets the criterion without known defects.
- **Partially Supports:** Some of the functionality meets the criterion.
- **Does Not Support:** The majority of the functionality does not meet the criterion.
- **Not Applicable:** The criterion is not relevant to the product.

---

## WCAG 2.1 Report

### Table 1: Success Criteria, Level A

| Criteria | Conformance Level | Remarks and Explanations |
|---|---|---|
| 1.1.1 Non-text Content | Supports | The decorative SVG icons carry `aria-hidden="true"` and `focusable="false"`, and the icon-only buttons, such as the password reveal, the tag remove, and the modal close, each have an `aria-label`. Status badges pair an icon with a text label. |
| 1.2.1–1.2.3 (Prerecorded Audio and Video) | Not Applicable | The product has no audio or video content. |
| 1.3.1 Info and Relationships | Supports | The markup uses semantic landmarks (a banner header, a navigation, a main, and a complementary aside), form labels tied to inputs through `for` and `id`, the `tablist`, `tab`, and `tabpanel` roles in Settings, `role="dialog"` on modals, and a native table for the shortcut sheet. |
| 1.3.2 Meaningful Sequence | Supports | The DOM order matches the reading order, and no element uses a positive `tabindex`. |
| 1.3.3 Sensory Characteristics | Supports | No instruction relies on shape, position, or color alone, and every control is labelled in text. |
| 1.4.1 Use of Color | Supports | No status depends on color alone. Every badge pairs an icon and a text label, and each progress bar carries `aria-valuenow` with the percentage printed alongside it. |
| 1.4.2 Audio Control | Not Applicable | The product plays no audio automatically. |
| 2.1.1 Keyboard | Supports | Every action is reachable from the keyboard through the menu accelerators, the global shortcuts, the roving-tabindex toolbar, sidebar, and tab lists, and Enter or Space activation. |
| 2.1.2 No Keyboard Trap | Supports | The one focus trap sits inside a modal dialog, which is the expected behavior, and Esc closes the dialog and returns focus to whatever opened it. |
| 2.1.4 Character Key Shortcuts | Supports | Every shortcut requires a modifier such as Ctrl, Cmd, or Alt, or is a function key, so no single character acts as a shortcut. |
| 2.2.1 Timing Adjustable | Not Applicable | The product sets no time limits, and toasts are advisory rather than blocking. |
| 2.2.2 Pause, Stop, Hide | Supports | No content updates on its own, and a Reduce Motion setting, along with the operating system `prefers-reduced-motion` preference, neutralizes the animations. |
| 2.3.1 Three Flashes or Below Threshold | Supports | The product has no flashing content. |
| 2.4.1 Bypass Blocks | Supports | A "Skip to main content" link is the first focusable element and targets the main region. |
| 2.4.2 Page Titled | Supports | The window and document title is "CareConnect". |
| 2.4.3 Focus Order | Supports | Focus order follows the reading order, and on navigation focus moves to the new screen heading. |
| 2.4.4 Link Purpose (In Context) | Supports | The links, "Forgot password?" and "Skip to main content", describe their purpose. |
| 3.1.1 Language of Page | Supports | The root element sets `lang="en"`. |
| 3.2.1 On Focus | Supports | Focus alone triggers no change of context. |
| 3.2.2 On Input | Supports | Changing a field value does not submit a form or navigate. |
| 3.3.1 Error Identification | Supports | The login and profile validation errors appear in text through `role="alert"`, and focus moves to the field that needs fixing. |
| 3.3.2 Labels or Instructions | Supports | Every input has a visible label or an `aria-label`, and the allergy tag input carries a hint. |
| 4.1.1 Parsing | Supports | The markup is well formed, which axe-core confirms with zero violations. |
| 4.1.2 Name, Role, Value | Supports | The custom switches use `role="switch"` with `aria-checked`, the toggles and tabs expose their state, and `aria-current="page"` marks the active screen. |

### Table 2: Success Criteria, Level AA

| Criteria | Conformance Level | Remarks and Explanations |
|---|---|---|
| 1.2.4 Captions (Live) | Not Applicable | The product has no live audio or video. |
| 1.2.5 Audio Description (Prerecorded) | Not Applicable | The product has no video content. |
| 1.3.4 Orientation | Supports | The content runs in a desktop window, reflows, and is not locked to an orientation. |
| 1.3.5 Identify Input Purpose | Supports | The email and password inputs use `autocomplete="username"` and `current-password` and the `email` input type. |
| 1.4.3 Contrast (Minimum) | Supports | The body text measures 14.8:1, the muted text 5.1:1, and white on the primary blue 7.2:1, all above the 4.5:1 floor. The full contrast table is in `docs/ACCESSIBILITY.md`. |
| 1.4.4 Resize Text | Supports | A built-in text scale runs from 0.8× to 2.0× and reflows without clipping, independent of the operating system zoom. |
| 1.4.5 Images of Text | Supports | All text is real text, and the icons are SVG rather than images of text. |
| 1.4.10 Reflow | Supports | The layout reflows at 2.0× text scale and at the 1024px minimum window width without a loss of content. |
| 1.4.11 Non-text Contrast | Supports | The focus ring measures 7.2:1 in the light theme and 19.6:1 in high contrast, and the control borders and badge icons meet 3:1. |
| 1.4.12 Text Spacing | Supports | An "Increase text spacing" setting applies the 1.4.12 metrics for line, letter, and word spacing without clipping. |
| 1.4.13 Content on Hover or Focus | Supports | No content appears on hover alone, and the search icon is decorative and non-interactive. |
| 2.4.5 Multiple Ways | Supports | The content is reachable through the menu bar, the toolbar, the sidebar, the global shortcuts, and the in-app search. |
| 2.4.6 Headings and Labels | Supports | Each screen has a single descriptive `h1`, and the sections and controls are labelled. |
| 2.4.7 Focus Visible | Supports | A 2px `#0052CC` focus ring, which becomes a 3px `#FFFF00` ring in high contrast, is always shown on the focused interactive element. |
| 3.1.2 Language of Parts | Not Applicable | All content is in a single language, English. |
| 3.2.3 Consistent Navigation | Supports | The menu bar, the toolbar, and the sidebar keep the same order and location on every screen. |
| 3.2.4 Consistent Identification | Supports | The icons, badges, and controls are used consistently across the screens. |
| 3.3.3 Error Suggestion | Supports | The validation messages state how to fix the error, for example "Enter a valid email address." |
| 3.3.4 Error Prevention (Legal, Financial, Data) | Not Applicable | The product has no legal, financial, or irreversible-data transactions, and destructive actions use a confirmation dialog. |
| 4.1.3 Status Messages | Supports | A polite `role="status"` live region announces the setting changes, the saves, the search result counts, and the screen changes, and a failed login uses an assertive alert. |

---

## Known Limitations and Workarounds

The operating system pointer handedness and the mouse-button swap are out of scope, since
they belong to the operating system rather than the application. As a workaround, the
application provides a Left-Handed Layout toggle on `Ctrl+Alt+L` that mirrors the shell,
and the keyboard-first design needs no mouse at all.

The automated contrast checking runs through the axe DevTools extension on the live
application. The headless jsdom run disables the axe `color-contrast` rule because jsdom
has no layout engine to measure the rendered boxes. As a workaround, the contrast values
are documented above and were verified by hand and with axe DevTools, which reports no
violations.
