const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const path = require('path');

// Forma robusta de detectar dev mode:
const isDev = !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.cjs'),
      webSecurity: true
    },
    titleBarStyle: 'default',
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.png')
  });
 // Remover a barra de menu
  mainWindow.setMenu(null);
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    //mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
   mainWindow.maximize();  // <-- maximiza a janela aqui
   
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handlers IPC
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-name', () => app.getName());
ipcMain.handle('get-platform', () => process.platform);

console.log('🚀 Electron main process iniciado');
console.log('🔧 isDev:', isDev);
