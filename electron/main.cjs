// ATOMICA desktop shell (TSK-UI-002): loads the built 2D sandbox (dist/) in a native window.
const { app, BrowserWindow, nativeTheme, shell } = require('electron');
const path = require('node:path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 900,
    minHeight: 600,
    title: 'ATOMICA Sandbox',
    autoHideMenuBar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#121214' : '#f3f4f6',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Open any external links in the user's browser, never inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
