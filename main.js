const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Prevent D-Bus error messages
process.env.DBUS_SESSION_BUS_ADDRESS = '';

function createApplicationMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Toggle Dark Mode',
          click: () => {
            BrowserWindow.getAllWindows().forEach(window => {
              window.webContents.send('toggle-dark-mode');
            });
          }
        },
        {
          label: 'Export Results',
          click: () => {
            BrowserWindow.getAllWindows().forEach(window => {
              window.webContents.send('export-requested');
            });
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createApplicationMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

ipcMain.on('save-results', async (event, results) => {
  const win = BrowserWindow.getFocusedWindow();
  const options = {
    title: 'Save Test Results',
    defaultPath: path.join(app.getPath('documents'), 'wistia-test-results.txt'),
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  };

  const { filePath } = await dialog.showSaveDialog(win, options);
  if (filePath) {
    fs.writeFileSync(filePath, results);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
