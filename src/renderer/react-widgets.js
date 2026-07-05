(function initReactWidgets(rootFactory) {
  if (typeof module === 'object' && module.exports) {
    const React = require('react');
    const ReactDOMClient = require('react-dom/client');
    module.exports = rootFactory(React, ReactDOMClient);
  } else {
    window.CareConnectReactWidgets = rootFactory(window.React, window.ReactDOM);
  }
})(function createReactWidgets(React, ReactDOMClient) {
  if (!React) return {};
  const e = React.createElement;

  function formatShortcutKeys(rawKeys) {
    return String(rawKeys)
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function KeyboardShortcutTable(props) {
    const shortcuts = Array.isArray(props.shortcuts) ? props.shortcuts : [];
    return e('table', { className: 'shortcut-table mt-2', role: 'table', 'aria-label': 'Keyboard shortcuts' }, [
      e('thead', { key: 'thead' }, e('tr', {}, [
        e('th', { key: 'h-shortcut' }, 'Shortcut'),
        e('th', { key: 'h-action' }, 'Action'),
        e('th', { key: 'h-screen' }, 'Screen')
      ])),
      e('tbody', { key: 'tbody' },
        shortcuts.map((shortcut, index) => e('tr', { key: `${shortcut.keys}-${index}` }, [
          e('td', { key: 'keys' }, formatShortcutKeys(shortcut.keys).join(' / ')),
          e('td', { key: 'action' }, shortcut.action),
          e('td', { key: 'screen', className: 'muted' }, shortcut.screen)
        ]))
      )
    ]);
  }

  function renderKeyboardShortcutTable(container, shortcuts) {
    if (!container || !ReactDOMClient || typeof ReactDOMClient.createRoot !== 'function') return null;
    const root = ReactDOMClient.createRoot(container);
    root.render(e(KeyboardShortcutTable, { shortcuts }));
    return root;
  }

  return {
    formatShortcutKeys,
    KeyboardShortcutTable,
    renderKeyboardShortcutTable
  };
});
