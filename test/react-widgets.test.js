const React = require('react');
const { render, screen } = require('@testing-library/react');

const {
  formatShortcutKeys,
  KeyboardShortcutTable
} = require('../src/renderer/react-widgets');

describe('react-widgets', () => {
  test('formatShortcutKeys splits slash-delimited shortcuts', () => {
    expect(formatShortcutKeys('Ctrl+1 / Ctrl+2 / Ctrl+3')).toEqual(['Ctrl+1', 'Ctrl+2', 'Ctrl+3']);
    expect(formatShortcutKeys('Esc')).toEqual(['Esc']);
  });

  test('KeyboardShortcutTable renders keyboard shortcuts and labels', () => {
    const shortcuts = [
      { keys: 'Ctrl+N', action: 'Create new record', screen: 'Dashboard' },
      { keys: 'Tab / Shift+Tab', action: 'Move between controls', screen: 'Global' }
    ];

    render(React.createElement(KeyboardShortcutTable, { shortcuts }));

    expect(screen.getByRole('table', { name: 'Keyboard shortcuts' })).toBeInTheDocument();
    expect(screen.getByText('Create new record')).toBeInTheDocument();
    expect(screen.getByText('Move between controls')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Global')).toBeInTheDocument();
  });
});
