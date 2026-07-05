(function initKeyboardUtils(rootFactory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = rootFactory();
  } else {
    window.CareConnectKeyboardUtils = rootFactory();
  }
})(function createKeyboardUtils() {
  function nextRovingIndex(currentIndex, listLength, key, orientation) {
    if (listLength <= 0) return currentIndex;
    const isHorizontal = orientation !== 'vertical';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    if (key === nextKey) return (currentIndex + 1) % listLength;
    if (key === prevKey) return (currentIndex - 1 + listLength) % listLength;
    if (key === 'Home') return 0;
    if (key === 'End') return listLength - 1;
    return currentIndex;
  }

  function rovingKeys(event, items, currentIndex, orientation) {
    const nextIndex = nextRovingIndex(currentIndex, items.length, event.key, orientation);
    if (nextIndex === currentIndex) return false;
    event.preventDefault();
    items[nextIndex].focus();
    return true;
  }

  return {
    nextRovingIndex,
    rovingKeys
  };
});
