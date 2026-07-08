const { nextRovingIndex, rovingKeys } = require('../src/renderer/keyboard-utils');

describe('keyboard-utils', () => {
  test('nextRovingIndex handles horizontal and vertical arrow movement', () => {
    expect(nextRovingIndex(0, 4, 'ArrowRight', 'horizontal')).toBe(1);
    expect(nextRovingIndex(0, 4, 'ArrowLeft', 'horizontal')).toBe(3);
    expect(nextRovingIndex(0, 4, 'ArrowDown', 'vertical')).toBe(1);
    expect(nextRovingIndex(0, 4, 'ArrowUp', 'vertical')).toBe(3);
    expect(nextRovingIndex(2, 4, 'Home', 'horizontal')).toBe(0);
    expect(nextRovingIndex(1, 4, 'End', 'horizontal')).toBe(3);
    expect(nextRovingIndex(1, 4, 'Enter', 'horizontal')).toBe(1);
  });

  test('rovingKeys focuses the next item and prevents default on supported keys', () => {
    const items = [{ focus: jest.fn() }, { focus: jest.fn() }, { focus: jest.fn() }];
    const event = { key: 'ArrowRight', preventDefault: jest.fn() };

    const handled = rovingKeys(event, items, 0, 'horizontal');

    expect(handled).toBe(true);
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(items[1].focus).toHaveBeenCalledTimes(1);
  });

  test('rovingKeys returns false for unsupported keys', () => {
    const items = [{ focus: jest.fn() }, { focus: jest.fn() }, { focus: jest.fn() }];
    const event = { key: 'Enter', preventDefault: jest.fn() };

    const handled = rovingKeys(event, items, 1, 'horizontal');

    expect(handled).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(items[0].focus).not.toHaveBeenCalled();
    expect(items[1].focus).not.toHaveBeenCalled();
    expect(items[2].focus).not.toHaveBeenCalled();
  });
});
