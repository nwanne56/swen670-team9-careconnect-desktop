'use strict';

const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');

let mainWindow = null;

/**
 * Send a menu-driven command into the renderer. The renderer owns all
 * navigation / dialog / shortcut behavior so that keyboard, toolbar, and
 * menu-bar paths all converge on the same handlers.
 */
function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function buildMenu() {
  const isMac = process.platform === 'darwin';

  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Record',
          accelerator: 'CmdOrCtrl+N',
          click: () => send('menu', { action: 'new' })
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => send('menu', { action: 'save' })
        },
        { type: 'separator' },
        {
          label: 'Settings…',
          accelerator: 'CmdOrCtrl+,',
          click: () => send('menu', { action: 'settings' })
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Find…',
          accelerator: 'CmdOrCtrl+F',
          click: () => send('menu', { action: 'search' })
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => send('menu', { action: 'nav', screen: 'dashboard' })
        },
        {
          label: 'Notifications',
          accelerator: 'CmdOrCtrl+2',
          click: () => send('menu', { action: 'nav', screen: 'notifications' })
        },
        {
          label: 'Profile',
          accelerator: 'CmdOrCtrl+3',
          click: () => send('menu', { action: 'nav', screen: 'profile' })
        },
        { type: 'separator' },
        {
          label: 'High Contrast Mode',
          accelerator: 'CmdOrCtrl+Alt+H',
          click: () => send('menu', { action: 'toggle-contrast' })
        },
        {
          label: 'Left-Handed Layout',
          accelerator: 'CmdOrCtrl+Alt+L',
          click: () => send('menu', { action: 'toggle-hand' })
        },
        {
          label: 'Increase Text Scale',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => send('menu', { action: 'text-scale', delta: 0.1 })
        },
        {
          label: 'Decrease Text Scale',
          accelerator: 'CmdOrCtrl+-',
          click: () => send('menu', { action: 'text-scale', delta: -0.1 })
        },
        {
          label: 'Reset Text Scale',
          accelerator: 'CmdOrCtrl+0',
          click: () => send('menu', { action: 'text-scale', reset: true })
        },
        { type: 'separator' },
        {
          label: 'Toggle Right Panel',
          accelerator: 'CmdOrCtrl+\\',
          click: () => send('menu', { action: 'toggle-panel' })
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'F1',
          click: () => send('menu', { action: 'help' })
        },
        {
          label: 'Accessibility Statement',
          click: () => send('menu', { action: 'nav', screen: 'settings', tab: 'about' })
        },
        { type: 'separator' },
        {
          label: 'About CareConnect',
          click: () => send('menu', { action: 'about' })
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: '#FAF8F4',
    show: false,
    title: 'CareConnect',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Open external links in the OS browser, never in-app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// Renderer reports auth state so we can enable/disable app-only menu items.
ipcMain.on('auth-state', (_evt, signedIn) => {
  const menu = Menu.getApplicationMenu();
  if (!menu) return;
  const appOnly = ['File', 'Edit', 'View'];
  for (const item of menu.items) {
    if (appOnly.includes(item.label)) {
      item.submenu.items.forEach((sub) => {
        // Keep quit/close always available.
        if (sub.role !== 'quit' && sub.role !== 'close') sub.enabled = !!signedIn;
      });
    }
  }
});

app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
