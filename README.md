# CareConnect - Desktop (Electron), SWEN 661 - Week 7

A desktop-first and keyboard-first, WCAG 2.2 AA rebuild of the CareConnect
health portal. This is the Electron starter app deliverable: it runs
locally and wires up the full set of CareConnect screens.

![CareConnect dashboard](./figma-screens/dashboard.png)

The app opens on a login screen. Once you are in, it gives you a native menu bar with
real accelerators (File, Edit, View, Help), a contextual toolbar, a sidebar, and a
right-hand info panel. The screens are Login, Dashboard, Notifications, a Profile that
has a view and an edit mode, and a tabbed Settings page covering General, Accessibility,
Keyboard, and About.

Everything is built keyboard-first. Every primary action has a key binding, the toolbar
and sidebar and settings tabs all move with the arrow keys, and a dialog traps focus and
closes on Esc. The accessibility work includes a high-contrast AAA theme, text scaling
from 0.8x to 2.0x, a reduce-motion setting, wider text spacing, a left-handed layout,
live-region announcements, 44px hit targets, and visible focus rings. Preferences are
saved in localStorage, so they survive a restart.

## Run it

```bash
cd careconnect-desktop
npm install
npm start
```

You need Node 18 or newer (it was built and tested on Node 22). The install step pulls
Electron down with it.

There is no backend, so any reasonable-looking email and any non-empty password will
sign you in. Try `you@example.com` with `password`.

## Project layout

```
careconnect-desktop/
├─ src/
│  ├─ main.js            # Electron main process and the native menu bar
│  ├─ preload.js         # contextBridge: menu channel and auth state (no Node in the renderer)
│  └─ renderer/
│     ├─ index.html      # App shell, SVG icon sprite, login and shell markup
│     ├─ styles.css      # Design system: tokens, light and high-contrast themes, components
│     └─ app.js          # Routing, screen rendering, keyboard, focus, accessibility settings
└─ docs/
   ├─ KEYBOARD_SHORTCUTS.md   # The full shortcut sheet
   └─ ACCESSIBILITY.md        # Focus order, focus states, WCAG mapping
```

## Keyboard quickstart

| Shortcut | Action |
|----------|--------|
| `Ctrl+1` / `Ctrl+2` / `Ctrl+3` | Dashboard, Notifications, Profile |
| `Ctrl+F` | Focus search |
| `Ctrl+,` | Open Settings |
| `Ctrl+N` | New record |
| `Ctrl+S` | Save |
| `Ctrl+Alt+H` | Toggle high contrast |
| `Ctrl+Alt+L` | Toggle left-handed layout |
| `F1` | Shortcut help |
| `Esc` | Close a dialog |

The full reference is in [docs/KEYBOARD_SHORTCUTS.md](docs/KEYBOARD_SHORTCUTS.md), and the
accessibility write-up is in [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md).

## Security

The renderer runs with `contextIsolation` on, `nodeIntegration` off, a strict CSP, and a
narrow preload bridge. External links open in the operating system browser rather than in
the app.
