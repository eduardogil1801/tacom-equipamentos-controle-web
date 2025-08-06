const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  // Criar a janela principal
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
    icon: path.join(__dirname, 'assets', 'icon.png') // Adicione seu ícone aqui
  });

  // Carregar a aplicação
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Abrir DevTools automaticamente em desenvolvimento
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Mostrar janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    if (isDev) {
      mainWindow.focus();
    }
  });

  // Limpar referência quando a janela for fechada
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Configurar menu
  createMenu();

  // Interceptar navegação externa
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Novo',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-action', 'new');
          }
        },
        {
          label: 'Abrir',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'Todos os arquivos', extensions: ['*'] }
              ]
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('menu-action', 'open', result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Desfazer', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Refazer', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cortar', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copiar', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Colar', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Selecionar Tudo', accelerator: 'CmdOrCtrl+A', role: 'selectall' }
      ]
    },
    {
      label: 'Visualizar',
      submenu: [
        { label: 'Recarregar', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Forçar Recarga', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Ferramentas do Desenvolvedor', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Zoom Real', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Ampliar', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Reduzir', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Tela Cheia', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Relatórios',
      submenu: [
        {
          label: 'Exportar Frota',
          click: () => {
            mainWindow.webContents.send('menu-action', 'export-frota');
          }
        },
        {
          label: 'Relatório de Manutenções',
          click: () => {
            mainWindow.webContents.send('menu-action', 'maintenance-report');
          }
        },
        { type: 'separator' },
        {
          label: 'Configurações de Relatório',
          click: () => {
            mainWindow.webContents.send('menu-action', 'report-settings');
          }
        }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre TACOM Equipamentos',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Sobre',
              message: 'TACOM Equipamentos Controle',
              detail: `Versão: ${app.getVersion()}\nSistema de controle e gestão de equipamentos`
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Documentação',
          click: () => {
            shell.openExternal('https://docs.tacom.com'); // Substitua pela URL real
          }
        },
        {
          label: 'Suporte',
          click: () => {
            shell.openExternal('mailto:suporte@tacom.com'); // Substitua pelo email real
          }
        }
      ]
    }
  ];

  // Ajustes específicos para macOS
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { label: 'Sobre ' + app.getName(), role: 'about' },
        { type: 'separator' },
        { label: 'Serviços', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'Ocultar ' + app.getName(), accelerator: 'Command+H', role: 'hide' },
        { label: 'Ocultar Outros', accelerator: 'Command+Shift+H', role: 'hideothers' },
        { label: 'Mostrar Todos', role: 'unhide' },
        { type: 'separator' },
        { label: 'Sair', accelerator: 'Command+Q', click: () => app.quit() }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Configurações do app
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
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-name', () => {
  return app.getName();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

ipcMain.handle('shell-open-external', async (event, url) => {
  await shell.openExternal(url);
});

// Handler para notificações
ipcMain.handle('show-notification', (event, title, body) => {
  const notification = new Notification({
    title: title,
    body: body,
    icon: path.join(__dirname, 'assets', 'icon.png')
  });
  
  notification.show();
});

// Handler para paths do sistema
ipcMain.handle('get-path', (event, name) => {
  return app.getPath(name);
});

// Configurações de segurança
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationUrl) => {
    navigationEvent.preventDefault();
    shell.openExternal(navigationUrl);
  });
  
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:5173' && !isDev) {
      navigationEvent.preventDefault();
    }
  });
});