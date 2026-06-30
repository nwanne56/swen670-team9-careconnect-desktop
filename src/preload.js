'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Minimal, safe bridge. The renderer never gets Node or ipcRenderer directly —
 * only these named channels.
 */
contextBridge.exposeInMainWorld('careconnect', {
  // Subscribe to menu-bar commands coming from the main process.
  onMenu: (handler) => {
    const listener = (_evt, payload) => handler(payload);
    ipcRenderer.on('menu', listener);
    return () => ipcRenderer.removeListener('menu', listener);
  },
  // Tell main whether the user is signed in (enables/disables app menu items).
  setAuthState: (signedIn) => ipcRenderer.send('auth-state', signedIn),
  platform: process.platform
});
