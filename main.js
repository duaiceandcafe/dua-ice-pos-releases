// Dua Ice POS — Electron main process with auto-update
const { app, BrowserWindow, Menu, shell, dialog, screen } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow = null;

// === AUTO-UPDATER CONFIG ===
autoUpdater.autoDownload = true;          // Download silently in background
autoUpdater.autoInstallOnAppQuit = true;  // Install when user closes the app
autoUpdater.allowPrerelease = false;

function setupAutoUpdater() {
  // 1. Found a new version → notify user
  autoUpdater.on('update-available', (info) => {
    if (!mainWindow) return;
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: `Dua Ice POS v${info.version} is available.`,
      detail: 'The update is downloading in the background. You will be notified when it is ready to install.',
      buttons: ['OK']
    });
  });

  // 2. Update downloaded → ask user when to install
  autoUpdater.on('update-downloaded', (info) => {
    if (!mainWindow) return;
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: `Dua Ice POS v${info.version} has been downloaded.`,
      detail: 'Restart the app now to apply the update, or it will be installed automatically when you close the app.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
      cancelId: 1
    }).then(result => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  // 3. Errors → silent log (don't bother the user)
  autoUpdater.on('error', (err) => {
    console.error('Auto-update error:', err == null ? 'unknown' : (err.stack || err).toString());
  });

  // 4. Progress (optional — could show in UI)
  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow) {
      mainWindow.setProgressBar(progress.percent / 100);
    }
  });

  autoUpdater.on('update-not-available', () => {
    if (mainWindow) mainWindow.setProgressBar(-1);
  });

  // Check for updates on startup (5s after window opens — avoids hammering on slow startup)
  // and every 4 hours while the app runs
  setTimeout(() => autoUpdater.checkForUpdatesAndNotify().catch(()=>{}), 5000);
  setInterval(() => autoUpdater.checkForUpdatesAndNotify().catch(()=>{}), 4 * 60 * 60 * 1000);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Dua Ice POS',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      nativeWindowOpen: true
    },
    show: false,
    autoHideMenuBar: true
  });

  mainWindow.loadFile('index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  // Multi-monitor: open Call Screen on secondary display
  mainWindow.webContents.setWindowOpenHandler(({ url, frameName, features }) => {
    const displays = screen.getAllDisplays();
    const primary = screen.getPrimaryDisplay();
    const secondary = displays.find(d => d.id !== primary.id);

    let bounds = { x: 100, y: 100, width: 1280, height: 800 };
    if (secondary) {
      bounds = {
        x: secondary.bounds.x,
        y: secondary.bounds.y,
        width: secondary.bounds.width,
        height: secondary.bounds.height
      };
    }
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        ...bounds,
        title: 'Dua Ice — Order Display',
        autoHideMenuBar: true,
        fullscreen: !!secondary,
        webPreferences: { nodeIntegration: false, contextIsolation: true }
      }
    };
  });

  // Menu
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Open Call Screen', accelerator: 'CmdOrCtrl+Shift+C', click: () => mainWindow.webContents.executeJavaScript('openCallScreen && openCallScreen()') },
        { type: 'separator' },
        { label: 'Print Test Ticket', click: () => mainWindow.webContents.executeJavaScript('printTestTicket && printTestTicket()') },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates',
          click: () => {
            autoUpdater.checkForUpdates().then(result => {
              if (!result || !result.updateInfo || result.updateInfo.version === app.getVersion()) {
                dialog.showMessageBox(mainWindow, {
                  type: 'info',
                  title: 'No Updates',
                  message: 'You are running the latest version (' + app.getVersion() + ').'
                });
              }
            }).catch(err => {
              dialog.showMessageBox(mainWindow, {
                type: 'warning',
                title: 'Update Check Failed',
                message: 'Could not check for updates.',
                detail: err.message
              });
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Open Data Folder',
          click: () => shell.openPath(app.getPath('userData'))
        },
        {
          label: 'Backup Data (Export)',
          click: () => {
            mainWindow.webContents.executeJavaScript(`
              const data = {};
              for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                data[k] = localStorage.getItem(k);
              }
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'dua-ice-backup-' + new Date().toISOString().slice(0,10) + '.json';
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            `);
          }
        },
        { type: 'separator' },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Dua Ice POS',
              message: 'Dua Ice & Cafe — POS System',
              detail: `Version ${app.getVersion()}\n\nPoint of Sale system with thermal printer, customer display, inventory and reporting.`
            });
          }
        }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  // Start auto-updater AFTER the window is ready
  setupAutoUpdater();
}

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
