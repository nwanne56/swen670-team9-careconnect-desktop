'use strict';

/* ============================================================================
   CareConnect renderer
   - Hash-free in-memory router (single window SPA)
   - Keyboard-first: every action reachable from menu bar, toolbar, OR keys
   - Focus management: restore focus on screen/modal return, focus trap in modals
   - Accessibility settings apply immediately (no save), persisted to localStorage
   ============================================================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const keyboardUtils = window.CareConnectKeyboardUtils || {};
const rovingKeys = keyboardUtils.rovingKeys || function fallbackRovingKeys(e, items, currentIndex, orientation = 'horizontal') {
  const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
  const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
  let idx = currentIndex;
  if (e.key === nextKey) idx = (currentIndex + 1) % items.length;
  else if (e.key === prevKey) idx = (currentIndex - 1 + items.length) % items.length;
  else if (e.key === 'Home') idx = 0;
  else if (e.key === 'End') idx = items.length - 1;
  else return false;
  e.preventDefault();
  items[idx].focus();
  return true;
};
const el = (tag, props = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') node.className = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(node.dataset, v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v === true ? '' : v);
  }
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
};
const icon = (id, size = 16) =>
  `<svg width="${size}" height="${size}" aria-hidden="true"><use href="#i-${id}"/></svg>`;

/* ---- App state --------------------------------------------------------- */
const PREF_KEY = 'careconnect.prefs';
const state = {
  screen: 'dashboard',
  signedIn: false,
  textScale: 1,
  highContrast: false,
  reduceMotion: false,
  textSpacing: false,
  leftHanded: false,
  panelVisible: true,
  lastFocus: null
};

const SETTINGS_TABS = ['general', 'accessibility', 'keyboard', 'about'];
let settingsTab = 'general';

/* ---- User store (persisted; no backend) -------------------------------- */
const USER_KEY = 'careconnect.user';
const BLOOD_GROUPS = ['O+', 'O−', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−'];
const ALLERGEN_OPTIONS = ['Penicillin', 'Latex', 'Peanuts', 'Aspirin', 'Sulfa drugs', 'Iodine', 'Shellfish'];
const TIME_ZONES = [
  { id: 'UTC', label: 'UTC', tz: 'UTC' },
  { id: 'US/Eastern', label: 'US / Eastern', tz: 'America/New_York' },
  { id: 'US/Central', label: 'US / Central', tz: 'America/Chicago' },
  { id: 'US/Pacific', label: 'US / Pacific', tz: 'America/Los_Angeles' }
];
const user = {
  name: 'Alex Rivera',
  email: 'alex.rivera@example.com',
  role: 'Administrator',
  dept: 'Engineering',
  bloodGroup: 'O+',
  allergies: ['Penicillin', 'Latex'],
  memberSince: '2023-01-15',     // ISO date
  lastLogin: null,               // ISO timestamp, set at sign-in
  emailNotifications: true,
  timeZone: 'UTC'
};
function loadUser() {
  try { Object.assign(user, JSON.parse(localStorage.getItem(USER_KEY) || '{}')); }
  catch { /* ignore corrupt user */ }
}
function saveUser() { localStorage.setItem(USER_KEY, JSON.stringify(user)); }

/* ---- Date / identity helpers ------------------------------------------- */
function activeTz() { return (TIME_ZONES.find((z) => z.id === user.timeZone) || TIME_ZONES[0]).tz; }
function dayKey(d, tz) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
function fmtLastLogin() {
  if (!user.lastLogin) return '—';
  const d = new Date(user.lastLogin);
  if (isNaN(d)) return '—';
  const tz = activeTz();
  const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz, timeZoneName: 'short' }).format(d);
  if (dayKey(d, tz) === dayKey(new Date(), tz)) return `Today ${time}`;
  const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: tz }).format(d);
  return `${date}, ${time}`;
}
function fmtMemberSince() {
  const d = new Date(user.memberSince);
  if (isNaN(d)) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d);
}
function firstName() { return (user.name.trim().split(/\s+/)[0]) || user.name; }
function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}
function greeting() {
  const h = parseInt(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: activeTz() }).format(new Date()), 10);
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}
function todayLong() {
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: activeTz() }).format(new Date());
}
/** Refresh the sidebar user card in place (no full re-render). */
function updateUserCard() {
  const nm = $('#uc-name'); if (nm) nm.textContent = user.name;
  const rl = $('#uc-role'); if (rl) rl.textContent = user.role;
  const av = $('#uc-avatar'); if (av) av.textContent = initials(user.name);
}

/* ---- Mock data --------------------------------------------------------- */
const activity = [
  { time: '09:41', status: 'info', text: 'High contrast mode enabled', actor: 'Alex Rivera' },
  { time: '09:22', status: 'success', text: 'Keyboard shortcut Ctrl+N added', actor: 'System' },
  { time: '08:55', status: 'info', text: 'Text scale set to 1.2×', actor: 'Alex Rivera' },
  { time: '08:30', status: 'success', text: 'Login from 192.168.1.44', actor: 'Alex Rivera' }
];

const notifications = [
  { status: 'success', title: 'Deployment complete', body: 'v2.4.1 deployed to production', time: '2 min ago' },
  { status: 'warning', title: 'High CPU usage', body: 'Server cpu-01 at 87% capacity', time: '14 min ago' },
  { status: 'info', title: 'Maintenance window', body: 'Scheduled: Sat 02:00–04:00 UTC', time: '1 hr ago' },
  { status: 'error', title: 'Payment failed', body: 'Invoice #4821 could not be processed', time: '3 hr ago' }
];

const SHORTCUTS = [
  { keys: 'Ctrl+N', action: 'Create new record / appointment', screen: 'Dashboard' },
  { keys: 'Ctrl+S', action: 'Save / submit form', screen: 'Profile, Settings' },
  { keys: 'Ctrl+F', action: 'Focus search bar', screen: 'Dashboard' },
  { keys: 'Ctrl+,', action: 'Open Settings', screen: 'Global' },
  { keys: 'Ctrl+1…3', action: 'Jump to Dashboard / Notifications / Profile', screen: 'Global' },
  { keys: 'Ctrl+Alt+H', action: 'Toggle high contrast mode', screen: 'Global' },
  { keys: 'Ctrl+Alt+L', action: 'Toggle left-handed layout', screen: 'Global' },
  { keys: 'Ctrl+ + / − / 0', action: 'Increase / decrease / reset text scale', screen: 'Global' },
  { keys: 'Ctrl+\\', action: 'Toggle the right info panel', screen: 'Global' },
  { keys: 'Tab / Shift+Tab', action: 'Move between panels and controls', screen: 'Global' },
  { keys: 'Esc', action: 'Close dialog / cancel', screen: 'All modals' },
  { keys: 'F1', action: 'Open keyboard shortcuts help', screen: 'Global' }
];

const BADGE = {
  success: { icon: 'check', label: 'success' },
  warning: { icon: 'warn', label: 'warning' },
  error: { icon: 'error', label: 'error' },
  info: { icon: 'info', label: 'info' }
};
const badge = (status) => {
  const b = BADGE[status] || BADGE.info;
  return `<span class="badge badge-${status}">${icon(b.icon, 14)}${b.label}</span>`;
};

/* ---- Live region ------------------------------------------------------- */
function announce(msg) {
  const region = $('#live-status');
  region.textContent = '';
  // Force re-announcement even for identical text.
  requestAnimationFrame(() => { region.textContent = msg; });
}

/* ---- Toast ------------------------------------------------------------- */
function toast(msg, kind = 'success') {
  const root = $('#toast-root');
  root.innerHTML = '';
  const ico = kind === 'success' ? 'check' : kind === 'error' ? 'error' : 'warn';
  const node = el('div', { class: `toast ${kind === 'success' ? '' : kind}`, role: 'status' }, [
    el('span', { html: icon(ico, 18) }),
    el('span', { text: msg })
  ]);
  root.appendChild(node);
  announce(msg);
  setTimeout(() => { if (node.isConnected) node.remove(); }, 4000);
}

/* ---- Preferences ------------------------------------------------------- */
function loadPrefs() {
  try {
    const saved = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
    Object.assign(state, {
      textScale: saved.textScale ?? 1,
      highContrast: saved.highContrast ?? false,
      reduceMotion: saved.reduceMotion ?? false,
      textSpacing: saved.textSpacing ?? false,
      leftHanded: saved.leftHanded ?? false,
      panelVisible: saved.panelVisible ?? true
    });
  } catch { /* ignore corrupt prefs */ }
}
function savePrefs() {
  const { textScale, highContrast, reduceMotion, textSpacing, leftHanded, panelVisible } = state;
  localStorage.setItem(PREF_KEY, JSON.stringify({ textScale, highContrast, reduceMotion, textSpacing, leftHanded, panelVisible }));
}
function applyPrefs() {
  document.documentElement.dataset.theme = state.highContrast ? 'hc' : 'light';
  document.documentElement.dataset.reduceMotion = String(state.reduceMotion);
  document.documentElement.dataset.hand = state.leftHanded ? 'left' : 'right';
  document.documentElement.style.setProperty('--text-scale', String(state.textScale));
  document.body.classList.toggle('text-spacing', state.textSpacing);
  // Keep both high-contrast switches in sync.
  const hcLogin = $('#hc-login');
  if (hcLogin) { hcLogin.checked = state.highContrast; hcLogin.setAttribute('aria-checked', String(state.highContrast)); }
  const panelBtn = $('#toggle-panel-btn');
  if (panelBtn) {
    panelBtn.setAttribute('aria-pressed', String(!state.panelVisible));
    panelBtn.textContent = state.panelVisible ? 'Hide Panel' : 'Show Panel';
  }
  $('#app-body')?.classList.toggle('no-panel', !state.panelVisible);
  $('#right-panel')?.classList.toggle('hidden', !state.panelVisible);
}

function setTextScale(value, { announceChange = true } = {}) {
  state.textScale = Math.min(2, Math.max(0.8, Math.round(value * 10) / 10));
  applyPrefs();
  savePrefs();
  if (state.screen === 'settings' && settingsTab === 'accessibility') renderScreen();
  if (announceChange) announce(`Text scale ${state.textScale.toFixed(1)} times`);
}
function setHighContrast(on) {
  state.highContrast = on;
  applyPrefs();
  savePrefs();
  announce(`High contrast mode ${on ? 'on' : 'off'}`);
  if (state.screen === 'settings' && settingsTab === 'accessibility') renderScreen();
}
function togglePanel() {
  state.panelVisible = !state.panelVisible;
  applyPrefs();
  savePrefs();
  announce(state.panelVisible ? 'Info panel shown' : 'Info panel hidden');
}
function toggleHand() {
  state.leftHanded = !state.leftHanded;
  applyPrefs();
  savePrefs();
  announce(`Left-handed layout ${state.leftHanded ? 'on' : 'off'}`);
  if (state.screen === 'settings' && settingsTab === 'accessibility') renderScreen();
}

/* ============================================================================
   SCREENS
   ============================================================================ */
const screens = {
  dashboard() {
    return el('div', {}, [
      el('header', {}, [
        el('h1', { text: `${greeting()}, ${firstName()}` }),
        el('p', { text: `${todayLong()} — Here's your accessibility overview.` })
      ]),
      el('div', { class: 'stat-grid' }, [
        statCard('Accessibility Score', '94/100', '+3 this week', 'up'),
        statCard('Open Issues', '7', '−2 this week', 'down'),
        statCard('Features Complete', '3 / 5', null)
      ]),
      el('h2', { text: 'Recent Activity', class: 'mt-2' }),
      el('div', { class: 'mt-2' }, activity.map((a) =>
        el('div', { class: 'activity-row' }, [
          el('span', { class: 'time', text: a.time }),
          el('span', { html: badge(a.status) }),
          el('span', { text: a.text }),
          el('span', { class: 'actor', text: a.actor })
        ])
      ))
    ]);
  },

  notifications() {
    return el('div', {}, [
      el('header', {}, [
        el('h1', { text: 'Notifications' }),
        el('p', { text: `${notifications.length} unread notifications.` })
      ]),
      el('div', {}, notifications.map((n) =>
        el('div', { class: 'card notif-card' }, [
          el('span', { html: badge(n.status) }),
          el('div', {}, [
            el('div', { class: 'notif-title', text: n.title }),
            el('div', { class: 'notif-body', text: n.body })
          ]),
          el('span', { class: 'notif-time', text: n.time })
        ])
      ))
    ]);
  },

  profile() {
    const editing = state.profileEditing;
    return editing ? profileEdit() : el('div', {}, [
      el('div', { class: 'profile-grid' }, [
        el('div', { class: 'profile-summary' }, [
          el('div', { class: 'avatar-lg', text: initials(user.name) }),
          el('div', { class: 'name' }, el('strong', { text: user.name })),
          el('div', { class: 'role', text: user.role }),
          el('span', { html: `<span class="badge badge-success">${icon('check', 14)}Active</span>` }),
          el('div', { class: 'profile-meta' }, [
            metaRow('Member since', fmtMemberSince()),
            metaRow('Last login', fmtLastLogin()),
            metaRow('Blood group', user.bloodGroup),
            metaRow('Dept', user.dept)
          ])
        ]),
        el('div', {}, [
          el('div', { class: 'profile-header' }, [
            el('h1', { text: 'Profile Details' }),
            el('button', {
              class: 'btn btn-secondary btn-sm',
              onclick: () => { state.profileEditing = true; renderScreen(); }
            }, [el('span', { html: icon('edit', 16) }), el('span', { text: 'Edit' })])
          ]),
          detailRow('Full name', user.name),
          detailRow('Email address', user.email),
          detailRow('Blood group', user.bloodGroup),
          detailRow('Known allergies', user.allergies.length ? user.allergies.join(', ') : 'None recorded')
        ])
      ])
    ]);
  },

  settings() {
    const tablist = el('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Settings' },
      SETTINGS_TABS.map((t) =>
        el('button', {
          class: 'tab', role: 'tab', id: `tab-${t}`,
          'aria-selected': String(t === settingsTab),
          'aria-controls': `panel-${t}`,
          tabindex: t === settingsTab ? '0' : '-1',
          text: t.charAt(0).toUpperCase() + t.slice(1),
          onclick: () => { settingsTab = t; renderScreen(); $(`#tab-${t}`)?.focus(); },
          onkeydown: (e) => handleTablistKeys(e, t)
        })
      )
    );
    return el('div', {}, [
      el('header', {}, [el('h1', { text: 'Settings' })]),
      tablist,
      settingsPanel(settingsTab)
    ]);
  }
};

function settingsPanel(tab) {
  const wrap = (content) => el('div', {
    class: 'tabpanel', id: `panel-${tab}`, role: 'tabpanel',
    'aria-labelledby': `tab-${tab}`, tabindex: '0'
  }, content);

  if (tab === 'general') {
    const nameInput = el('input', { class: 'input', value: user.name, 'aria-label': 'Display name', maxlength: '60' });
    nameInput.addEventListener('input', () => { user.name = nameInput.value; saveUser(); updateUserCard(); });
    nameInput.addEventListener('change', () => {
      if (!user.name.trim()) { user.name = 'User'; nameInput.value = user.name; saveUser(); updateUserCard(); }
      announce('Display name updated');
    });

    const emailInput = el('input', { class: 'input', type: 'email', value: user.email, 'aria-label': 'Email address' });
    emailInput.addEventListener('change', () => {
      const v = emailInput.value.trim();
      if (v && !/.+@.+\..+/.test(v)) { emailInput.classList.add('error'); announce('Enter a valid email address'); return; }
      emailInput.classList.remove('error');
      user.email = v || user.email; emailInput.value = user.email; saveUser(); announce('Email updated');
    });

    const tzSelect = el('select', { class: 'select', 'aria-label': 'Time zone' },
      TIME_ZONES.map((z) => el('option', { value: z.id, text: z.label })));
    tzSelect.value = user.timeZone;
    tzSelect.addEventListener('change', () => {
      user.timeZone = tzSelect.value; saveUser();
      announce(`Time zone set to ${tzSelect.options[tzSelect.selectedIndex].text}`);
    });

    return wrap([
      settingBlock('Display name', 'Shown in the sidebar, greeting, and profile.', nameInput),
      settingBlock('Email address', 'Used for sign-in and the notification digest.', emailInput),
      settingBlock('Email notifications', 'Receive a daily digest by email.',
        toggle('opt-email', user.emailNotifications, 'Email notifications', (on) => {
          user.emailNotifications = on; saveUser(); announce(`Email notifications ${on ? 'on' : 'off'}`);
        })),
      settingBlock('Time zone', 'Controls how your last-login time is shown on the profile.', tzSelect)
    ]);
  }

  if (tab === 'accessibility') {
    return wrap([
      el('p', { class: 'muted', text: 'These settings apply immediately — there is no Save button.' }),
      settingBlock('High contrast mode', 'WCAG AAA palette: black background, yellow accent.',
        toggle('opt-hc', state.highContrast, 'High contrast mode', (on) => setHighContrast(on))),
      settingBlock('Reduce motion', 'Minimize animations and transitions.',
        toggle('opt-rm', state.reduceMotion, 'Reduce motion', (on) => {
          state.reduceMotion = on; applyPrefs(); savePrefs();
          announce(`Reduce motion ${on ? 'on' : 'off'}`);
        })),
      settingBlock('Increase text spacing', 'WCAG 1.4.12: wider letter, word, and line spacing.',
        toggle('opt-tsp', state.textSpacing, 'Increase text spacing', (on) => {
          state.textSpacing = on; applyPrefs(); savePrefs();
          announce(`Text spacing ${on ? 'on' : 'off'}`);
        })),
      settingBlock('Left-handed layout', 'Mirror the interface so navigation and primary actions sit on the left.',
        toggle('opt-lh', state.leftHanded, 'Left-handed layout', (on) => {
          state.leftHanded = on; applyPrefs(); savePrefs();
          announce(`Left-handed layout ${on ? 'on' : 'off'}`);
        })),
      el('div', { class: 'setting-block' }, [
        el('div', { class: 'label', text: 'Text scale' }),
        el('div', { class: 'setting-desc', text: 'Scale type from 0.8× to 2.0×.' }),
        el('div', { class: 'slider-row mt-2' }, [
          el('button', { class: 'btn-icon', 'aria-label': 'Decrease text scale',
            onclick: () => setTextScale(state.textScale - 0.1) }, '−'),
          el('input', {
            class: 'slider', type: 'range', min: '0.8', max: '2', step: '0.1',
            value: String(state.textScale), 'aria-label': 'Text scale',
            'aria-valuetext': `${state.textScale.toFixed(1)} times`,
            oninput: (e) => setTextScale(parseFloat(e.target.value), { announceChange: false }),
            onchange: (e) => announce(`Text scale ${parseFloat(e.target.value).toFixed(1)} times`)
          }),
          el('button', { class: 'btn-icon', 'aria-label': 'Increase text scale',
            onclick: () => setTextScale(state.textScale + 0.1) }, '+'),
          el('span', { class: 'slider-value', text: `${state.textScale.toFixed(1)}×` })
        ]),
        el('p', { class: 'setting-desc mt-2', html: `Preview at ${state.textScale.toFixed(1)}×: <strong>Accessibility</strong>` })
      ])
    ]);
  }

  if (tab === 'keyboard') {
    const tableHost = el('div', { id: 'keyboard-shortcuts-react' });
    const reactWidgets = window.CareConnectReactWidgets || {};
    const renderShortcutTable = reactWidgets.renderKeyboardShortcutTable;
    if (typeof renderShortcutTable === 'function') {
      renderShortcutTable(tableHost, SHORTCUTS);
    } else {
      const rows = SHORTCUTS.map((s) =>
        el('tr', {}, [
          el('td', { html: `<span class="kbd">${s.keys.replace(/ \/ /g, '</span> / <span class="kbd">')}</span>` }),
          el('td', { text: s.action }),
          el('td', { class: 'muted', text: s.screen })
        ])
      );
      tableHost.appendChild(el('table', { class: 'shortcut-table mt-2' }, [
        el('thead', {}, el('tr', {}, [
          el('th', { text: 'Shortcut' }), el('th', { text: 'Action' }), el('th', { text: 'Screen' })
        ])),
        el('tbody', {}, rows)
      ]));
    }

    return wrap([
      el('p', { class: 'muted', text: 'All shortcuts use standard desktop conventions.' }),
      tableHost
    ]);
  }

  // about
  return wrap([
    el('h2', { text: 'CareConnect Desktop' }),
    el('p', { class: 'muted mt-2', text: 'Version 0.1.0 · SWEN 661 Week 7 · Electron starter.' }),
    el('h3', { class: 'mt-3', text: 'Accessibility statement' }),
    el('p', { class: 'mt-2', text: 'CareConnect targets WCAG 2.2 AA in light mode and AAA in high-contrast mode. Every primary action is operable by keyboard alone, status is never conveyed by color alone, and all interactive targets meet a 44×44px minimum hit area.' }),
    el('button', { class: 'btn btn-secondary mt-3', onclick: openHelp }, 'View keyboard shortcuts')
  ]);
}

/* ---- Small builders ---------------------------------------------------- */
function statCard(label, value, delta, dir) {
  return el('div', { class: 'card stat-card' }, [
    el('div', { class: 'stat-label', text: label }),
    el('div', { class: 'stat-value', text: value }),
    delta ? el('div', { class: `stat-delta ${dir}`, text: delta }) : null
  ]);
}
function progressBar(pct) {
  return el('div', {
    class: `progress ${pct === 100 ? 'is-complete' : ''}`,
    role: 'progressbar', 'aria-valuenow': String(pct),
    'aria-valuemin': '0', 'aria-valuemax': '100',
    'aria-label': `Progress ${pct}%`
  }, el('span', { style: `width:${pct}%` }));
}
function metaRow(k, v) {
  return el('div', { class: 'meta-row' }, [el('span', { class: 'k', text: k }), el('span', { class: 'v', text: v })]);
}
function detailRow(k, v) {
  return el('div', { class: 'detail-row' }, [el('div', { class: 'k', text: k }), el('div', { class: 'v', text: v })]);
}
function settingBlock(title, desc, control) {
  return el('div', { class: 'setting-block flex between' }, [
    el('div', {}, [el('div', { class: 'label', text: title }), el('div', { class: 'setting-desc', text: desc })]),
    control
  ]);
}
function toggle(id, checked, label, onChange) {
  const input = el('input', {
    type: 'checkbox', id, role: 'switch',
    'aria-checked': String(checked), 'aria-label': label
  });
  input.checked = checked;
  input.addEventListener('change', (e) => {
    input.setAttribute('aria-checked', String(e.target.checked));
    if (onChange) onChange(e.target.checked);
  });
  return el('label', { class: 'switch' }, [input, el('span', { class: 'track' }, el('span', { class: 'thumb' }))]);
}

/* Tag / token input. Mutates the passed `tags` array in place; type + Enter to
   add, click ✕ or Backspace-on-empty to remove. `suggestions` feed a datalist. */
function tagInput({ tags, suggestions = [], id, label, onChange }) {
  const listId = `${id}-list`;
  const box = el('div', { class: 'tag-input' });
  const input = el('input', {
    class: 'tag-field', type: 'text', id, list: listId,
    'aria-label': label, autocomplete: 'off'
  });

  const notify = () => onChange && onChange(tags);
  const addTag = (raw) => {
    const v = raw.replace(/,/g, '').trim();
    if (v && !tags.some((t) => t.toLowerCase() === v.toLowerCase())) { tags.push(v); notify(); }
    input.value = '';
    render();
    input.focus();
  };
  const removeAt = (i) => { tags.splice(i, 1); notify(); render(); input.focus(); };

  function render() {
    box.innerHTML = '';
    tags.forEach((t, i) => box.appendChild(
      el('span', { class: 'tag' }, [
        el('span', { text: t }),
        el('button', { type: 'button', class: 'tag-x', 'aria-label': `Remove ${t}`,
          onclick: () => removeAt(i) }, '×')
      ])
    ));
    input.placeholder = tags.length ? 'Add another…' : 'Type and press Enter…';
    box.appendChild(input);
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(input.value); }
    else if (e.key === 'Backspace' && !input.value && tags.length) { removeAt(tags.length - 1); }
  });
  input.addEventListener('blur', () => { if (input.value.trim()) addTag(input.value); });

  const datalist = el('datalist', { id: listId }, suggestions.map((s) => el('option', { value: s })));
  render();
  return el('div', {}, [box, datalist]);
}

function profileEdit() {
  const bloodSelect = el('select', { class: 'select', id: 'pf-blood', 'aria-label': 'Blood group' },
    BLOOD_GROUPS.map((b) => el('option', { value: b, text: b })));
  bloodSelect.value = user.bloodGroup;

  // Editable working copy; committed to the store on save.
  state.editAllergies = [...user.allergies];

  const form = el('form', { id: 'profile-form', novalidate: true }, [
    el('div', { class: 'profile-header' }, [
      el('h1', { text: 'Edit Profile' }),
      el('span', { class: 'muted small', html: `Press <span class="kbd">Ctrl+S</span> to save` })
    ]),
    field('Full name', 'pf-name', user.name),
    field('Email address', 'pf-email', user.email, 'email'),
    el('div', { class: 'field' }, [
      el('label', { for: 'pf-blood', text: 'Blood group' }),
      bloodSelect
    ]),
    el('div', { class: 'field' }, [
      el('label', { class: 'label', for: 'pf-allergy', text: 'Known allergies' }),
      tagInput({ tags: state.editAllergies, suggestions: ALLERGEN_OPTIONS, id: 'pf-allergy', label: 'Add an allergy' }),
      el('div', { class: 'hint', text: 'Type an allergy and press Enter. Pick a suggestion or add your own; leave blank for none.' })
    ]),
    el('div', { id: 'pf-error', class: 'error-text hidden', role: 'alert' }),
    el('div', { class: 'flex gap-2 mt-3' }, [
      el('button', { class: 'btn', type: 'submit' }, 'Save changes'),
      el('button', { class: 'btn btn-tertiary', type: 'button',
        onclick: () => { state.profileEditing = false; renderScreen(); } }, 'Cancel')
    ])
  ]);
  form.addEventListener('submit', (e) => { e.preventDefault(); saveProfile(); });
  return form;
}
function field(label, id, value, type = 'text') {
  return el('div', { class: 'field' }, [
    el('label', { for: id, text: label }),
    el('input', { class: 'input', id, type, value })
  ]);
}
function saveProfile() {
  const name = $('#pf-name').value.trim();
  const email = $('#pf-email').value.trim();
  const errBox = $('#pf-error');
  const fail = (msg, focusEl) => {
    errBox.innerHTML = `${icon('error', 16)} ${msg}`;
    errBox.classList.remove('hidden');
    focusEl?.focus();
  };
  if (!name) return fail('Full name is required.', $('#pf-name'));
  if (!email || !/.+@.+\..+/.test(email)) return fail('Enter a valid email address.', $('#pf-email'));

  user.name = name;
  user.email = email;
  user.bloodGroup = $('#pf-blood').value;
  user.allergies = (state.editAllergies || []).slice();
  saveUser();
  updateUserCard();
  state.profileEditing = false;
  renderScreen();
  toast('Profile saved', 'success');
}

/* ============================================================================
   SEARCH
   ============================================================================ */
function buildSearchIndex() {
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const idx = [
    { section: 'Navigation', title: 'Dashboard', sub: 'Home overview and recent activity', action: () => navigate('dashboard') },
    { section: 'Navigation', title: 'Notifications', sub: 'Alerts and system messages', action: () => navigate('notifications') },
    { section: 'Navigation', title: 'Profile', sub: 'Your account details', action: () => navigate('profile') },
    { section: 'Navigation', title: 'Settings', sub: 'Preferences and accessibility', action: () => navigate('settings') }
  ];
  SETTINGS_TABS.forEach((t) => idx.push({ section: 'Settings', title: `${cap(t)} settings`, sub: 'Open this settings tab', action: () => navigate('settings', { tab: t }) }));
  notifications.forEach((n) => idx.push({ section: 'Notifications', title: n.title, sub: n.body, status: n.status, action: () => navigate('notifications') }));
  activity.forEach((a) => idx.push({ section: 'Recent activity', title: a.text, sub: `${a.time} · ${a.actor}`, status: a.status, action: () => navigate('dashboard') }));
  idx.push({ section: 'Profile', title: user.name, sub: user.email, action: () => navigate('profile') });
  idx.push({ section: 'Profile', title: `Blood group ${user.bloodGroup}`, sub: `Department: ${user.dept}`, action: () => navigate('profile') });
  if (user.allergies.length) idx.push({ section: 'Profile', title: `Allergies: ${user.allergies.join(', ')}`, sub: 'Known allergies', action: () => navigate('profile') });
  SHORTCUTS.forEach((s) => idx.push({ section: 'Keyboard shortcuts', title: s.action, sub: s.keys, action: () => openHelp() }));
  return idx;
}

function searchScreen() {
  const raw = (state.searchQuery || '').trim();
  const q = raw.toLowerCase();
  const results = q
    ? buildSearchIndex().filter((r) => `${r.title} ${r.sub} ${r.section}`.toLowerCase().includes(q))
    : [];

  const header = el('header', {}, [
    el('h1', { text: 'Search results' }),
    el('p', { text: raw
      ? `${results.length} result${results.length === 1 ? '' : 's'} for “${raw}”.`
      : 'Type a query in the search bar and press Enter.' })
  ]);

  if (raw && !results.length) {
    return el('div', {}, [header, el('div', { class: 'card mt-2' }, [
      el('strong', { text: 'No matches.' }),
      el('p', { class: 'muted mt-2', text: 'Search covers navigation, notifications, recent activity, your profile, and keyboard shortcuts.' })
    ])]);
  }

  const groups = new Map();
  results.forEach((r) => { if (!groups.has(r.section)) groups.set(r.section, []); groups.get(r.section).push(r); });

  const sections = [...groups.entries()].map(([section, items]) =>
    el('div', { class: 'mt-3' }, [
      el('div', { class: 'panel-title', text: section }),
      ...items.map((r) => el('button', { class: 'card search-result', onclick: r.action }, [
        el('div', { class: 'flex between gap-2' }, [
          el('strong', { text: r.title }),
          r.status ? el('span', { html: badge(r.status) }) : null
        ]),
        el('div', { class: 'muted small', style: 'margin-top:2px', text: r.sub })
      ]))
    ])
  );
  return el('div', {}, [header, ...sections]);
}

function runSearch(query) {
  state.searchQuery = (query || '').trim();
  navigate('search');
}

/* ============================================================================
   ROUTER + FOCUS
   ============================================================================ */
const SCREEN_RENDERERS = {
  dashboard: screens.dashboard,
  notifications: screens.notifications,
  profile: screens.profile,
  settings: screens.settings,
  search: searchScreen
};

function setActiveNav() {
  // Toolbar + sidebar reflect the current screen.
  const active = state.screen;
  $$('#tool-tabs .tool-btn, #side-nav .side-link').forEach((b) => {
    if (b.dataset.screen === active) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
}

function renderScreen() {
  const main = $('#main');
  main.innerHTML = '';
  const fn = SCREEN_RENDERERS[state.screen] || SCREEN_RENDERERS.dashboard;
  main.appendChild(fn());
  setActiveNav();
}

function navigate(screen, opts = {}) {
  if (screen === 'settings' && opts.tab && SETTINGS_TABS.includes(opts.tab)) settingsTab = opts.tab;
  if (screen !== 'profile') state.profileEditing = false;
  state.screen = screen;
  renderScreen();
  // Move focus to the new screen heading for screen-reader context.
  const main = $('#main');
  const heading = main.querySelector('h1');
  if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus(); }
  else main.focus();
  announce(`${heading ? heading.textContent : screen} screen`);
}

/* ============================================================================
   MODALS (focus trap + Esc + restore focus)
   ============================================================================ */
let activeModal = null;

function openModal({ title, body, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, danger }) {
  closeModal();
  state.lastFocus = document.activeElement;
  const titleId = 'modal-title';
  const confirmBtn = el('button', {
    class: `btn ${danger ? 'btn-danger' : ''}`, text: confirmText,
    onclick: () => { closeModal(); if (onConfirm) onConfirm(); }
  });
  const modal = el('div', {
    class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId
  }, [
    el('div', { class: 'modal-header' }, [
      el('h2', { id: titleId, text: title, style: 'font-size:calc(var(--fs-h4)*var(--text-scale))' }),
      el('button', { class: 'btn-icon', 'aria-label': 'Close dialog', html: icon('x', 20), onclick: closeModal })
    ]),
    el('div', { class: 'modal-body' }, typeof body === 'string' ? el('div', { html: body }) : body),
    el('div', { class: 'modal-footer' }, [
      el('button', { class: 'btn btn-tertiary', text: cancelText, onclick: closeModal }),
      confirmBtn
    ])
  ]);
  const overlay = el('div', { class: 'overlay', onclick: (e) => { if (e.target === overlay) closeModal(); } }, modal);
  $('#modal-root').appendChild(overlay);
  activeModal = overlay;
  confirmBtn.focus();
  announce(`Dialog: ${title}`);
}

function closeModal() {
  if (!activeModal) return;
  activeModal.remove();
  activeModal = null;
  if (state.lastFocus && state.lastFocus.isConnected) state.lastFocus.focus();
}

function trapFocus(e) {
  if (!activeModal || e.key !== 'Tab') return;
  const focusables = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', activeModal)
    .filter((n) => !n.disabled && n.offsetParent !== null);
  if (!focusables.length) return;
  const first = focusables[0], last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function openHelp() {
  const list = el('div', {},
    SHORTCUTS.map((s) => el('div', { class: 'flex between', style: 'padding:6px 0' }, [
      el('span', { text: s.action }),
      el('span', { html: `<span class="kbd">${s.keys}</span>` })
    ]))
  );
  openModal({ title: 'Keyboard Shortcuts', body: list, confirmText: 'Got it', cancelText: 'Close' });
}

function openAbout() {
  openModal({
    title: 'About CareConnect',
    body: '<p><strong>CareConnect Desktop</strong> v0.1.0</p><p class="mt-2">Desktop-first, keyboard-first health portal. WCAG 2.2 AA (AAA in high-contrast mode).</p><p class="mt-2 muted">SWEN 661 — Week 7 Electron starter.</p>',
    confirmText: 'Close', cancelText: 'View shortcuts',
    onConfirm: () => {}
  });
}

/* ============================================================================
   ARROW-KEY NAVIGATION for toolbar / sidebar / tablist (roving)
   ============================================================================ */

function handleTablistKeys(e, tab) {
  const items = $$('.tabs .tab');
  const idx = SETTINGS_TABS.indexOf(tab);
  if (rovingKeys(e, items, idx, 'horizontal')) {
    settingsTab = SETTINGS_TABS[items.indexOf(document.activeElement)];
    renderScreen();
    $(`#tab-${settingsTab}`)?.focus();
  }
}

function wireRoving(container, selector, orientation) {
  container.addEventListener('keydown', (e) => {
    const items = $$(selector, container);
    const idx = items.indexOf(document.activeElement);
    if (idx === -1) return;
    rovingKeys(e, items, idx, orientation);
  });
}

/* ============================================================================
   GLOBAL KEYBOARD SHORTCUTS
   ============================================================================ */
function handleGlobalKeys(e) {
  if (activeModal) {
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); }
    trapFocus(e);
    return;
  }
  if (!state.signedIn) return;

  const mod = e.ctrlKey || e.metaKey;
  if (e.key === 'Escape') {
    // Esc cancels an in-progress profile edit.
    if (state.profileEditing) { state.profileEditing = false; renderScreen(); return; }
  }
  if (e.key === 'F1') { e.preventDefault(); openHelp(); return; }
  if (!mod) return;

  switch (e.key) {
    case 'f': case 'F': e.preventDefault(); focusSearch(); break;
    case ',': e.preventDefault(); navigate('settings'); break;
    case 'n': case 'N': e.preventDefault(); newRecord(); break;
    case 's': case 'S': e.preventDefault(); saveCurrent(); break;
    case '1': e.preventDefault(); navigate('dashboard'); break;
    case '2': e.preventDefault(); navigate('notifications'); break;
    case '3': e.preventDefault(); navigate('profile'); break;
    case '\\': e.preventDefault(); togglePanel(); break;
    case '=': case '+': e.preventDefault(); setTextScale(state.textScale + 0.1); break;
    case '-': e.preventDefault(); setTextScale(state.textScale - 0.1); break;
    case '0': e.preventDefault(); setTextScale(1); break;
    case 'h': case 'H': if (e.altKey) { e.preventDefault(); setHighContrast(!state.highContrast); } break;
    case 'l': case 'L': if (e.altKey) { e.preventDefault(); toggleHand(); } break;
    default: break;
  }
}

function focusSearch() {
  const s = $('#search');
  if (s) { s.focus(); s.select(); }
}
function newRecord() {
  openModal({
    title: 'New Record',
    body: el('div', {}, [
      el('div', { class: 'field' }, [el('label', { for: 'nr-title', text: 'Record title' }),
        el('input', { class: 'input', id: 'nr-title', placeholder: 'e.g. Follow-up appointment' })]),
      el('p', { class: 'muted small', html: `Press ${'<span class="kbd">Esc</span>'} to cancel.` })
    ]),
    confirmText: 'Create', onConfirm: () => toast('New record created', 'success')
  });
}
function saveCurrent() {
  if (state.screen === 'profile' && state.profileEditing) { saveProfile(); return; }
  if (state.screen === 'settings') { toast('Settings apply immediately — nothing to save', 'info'); return; }
  toast('Nothing to save on this screen', 'info');
}

/* ============================================================================
   LOGIN
   ============================================================================ */
function showApp() {
  state.signedIn = true;
  user.lastLogin = new Date().toISOString();
  saveUser();
  updateUserCard();
  $('#login').classList.add('hidden');
  const app = $('#app');
  app.classList.add('active');
  app.setAttribute('aria-hidden', 'false');
  window.careconnect?.setAuthState(true);
  navigate('dashboard');
}

function wireLogin() {
  const form = $('#login-form');
  const errorBox = $('#login-error');

  $('#toggle-pw').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const pw = $('#password');
    const show = pw.type === 'password';
    pw.type = show ? 'text' : 'password';
    btn.setAttribute('aria-pressed', String(show));
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    pw.focus();
  });

  $('#hc-login').addEventListener('change', (e) => setHighContrast(e.target.checked));
  $('#forgot').addEventListener('click', (e) => {
    e.preventDefault();
    toast('Password reset link sent (demo)', 'info');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#email');
    const pw = $('#password');
    errorBox.classList.add('hidden');
    [email, pw].forEach((i) => i.classList.remove('error'));

    // Minimal validation; any non-empty valid email + password signs in (demo).
    if (!email.value || !/.+@.+\..+/.test(email.value)) {
      errorBox.innerHTML = `${icon('error', 16)} Enter a valid email address.`;
      errorBox.classList.remove('hidden');
      email.classList.add('error'); email.focus();
      return;
    }
    if (!pw.value) {
      errorBox.innerHTML = `${icon('error', 16)} Password is required.`;
      errorBox.classList.remove('hidden');
      pw.classList.add('error'); pw.focus();
      return;
    }
    // Remember me: persist the email for next launch (never the password).
    if ($('#remember').checked) localStorage.setItem('careconnect.rememberEmail', email.value.trim());
    else localStorage.removeItem('careconnect.rememberEmail');
    showApp();
  });
}

/** Prefill the email field if the user previously chose "Remember me". */
function applyRememberedEmail() {
  const saved = localStorage.getItem('careconnect.rememberEmail');
  if (!saved) return false;
  $('#email').value = saved;
  $('#remember').checked = true;
  return true;
}

/* ============================================================================
   WIRING
   ============================================================================ */
function wireShell() {
  // Toolbar + sidebar navigation.
  $$('#tool-tabs .tool-btn, #side-nav .side-link').forEach((btn) =>
    btn.addEventListener('click', () => navigate(btn.dataset.screen)));

  // Roving arrow-key nav within toolbar tabs and sidebar.
  wireRoving($('#tool-tabs'), '.tool-btn', 'horizontal');
  wireRoving($('#side-nav'), '.side-link', 'vertical');

  $('#toggle-panel-btn').addEventListener('click', togglePanel);

  $('#search').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = e.target.value.trim();
      if (q) runSearch(q);
    } else if (e.key === 'Escape') {
      e.target.value = '';
    }
  });

  // Menu-bar commands from main process.
  window.careconnect?.onMenu((payload) => {
    switch (payload.action) {
      case 'nav': navigate(payload.screen, { tab: payload.tab }); break;
      case 'settings': navigate('settings'); break;
      case 'search': focusSearch(); break;
      case 'new': newRecord(); break;
      case 'save': saveCurrent(); break;
      case 'toggle-contrast': setHighContrast(!state.highContrast); break;
      case 'toggle-hand': toggleHand(); break;
      case 'toggle-panel': togglePanel(); break;
      case 'text-scale':
        if (payload.reset) setTextScale(1);
        else setTextScale(state.textScale + payload.delta);
        break;
      case 'help': openHelp(); break;
      case 'about': openAbout(); break;
      default: break;
    }
  });
}

document.addEventListener('keydown', handleGlobalKeys, true);

window.addEventListener('DOMContentLoaded', () => {
  loadPrefs();
  loadUser();
  applyPrefs();
  updateUserCard();
  wireLogin();
  wireShell();
  window.careconnect?.setAuthState(false);
  // If we remembered the email, jump straight to the password field.
  if (applyRememberedEmail()) $('#password').focus();
  else $('#email').focus();
});
