const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initializeDatabase, getAllFromTable, insertIntoTable, updateInTable, deleteFromTable } = require('./database');

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    icon: path.join(__dirname, '../build/icon.ico'),
    title: 'TACOM - Controle de Equipamentos',
    autoHideMenuBar: true,
    show: false
  });

  // Carregar a aplicação
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  // Inicializar banco de dados
  try {
    db = await initializeDatabase();
    console.log('Banco de dados inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar banco:', error);
  }

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

// IPC Handlers para comunicação com o banco
ipcMain.handle('db-get-all', async (event, tableName, filters = {}) => {
  try {
    return await getAllFromTable(db, tableName, filters);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    throw error;
  }
});

ipcMain.handle('db-insert', async (event, tableName, data) => {
  try {
    return await insertIntoTable(db, tableName, data);
  } catch (error) {
    console.error('Erro ao inserir dados:', error);
    throw error;
  }
});

ipcMain.handle('db-update', async (event, tableName, id, data) => {
  try {
    return await updateInTable(db, tableName, id, data);
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
    throw error;
  }
});

ipcMain.handle('db-delete', async (event, tableName, id) => {
  try {
    return await deleteFromTable(db, tableName, id);
  } catch (error) {
    console.error('Erro ao deletar dados:', error);
    throw error;
  }
});

// Handler para login
ipcMain.handle('auth-login', async (event, email, password) => {
  try {
    const users = await getAllFromTable(db, 'usuarios', { email, password });
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('Erro no login:', error);
    return null;
  }
});

// Salvar configurações do usuário
ipcMain.handle('save-config', async (event, config) => {
  try {
    const fs = require('fs').promises;
    const configPath = path.join(app.getPath('userData'), 'config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    return false;
  }
});

// Carregar configurações do usuário
ipcMain.handle('load-config', async () => {
  try {
    const fs = require('fs').promises;
    const configPath = path.join(app.getPath('userData'), 'config.json');
    const data = await fs.readFile(configPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Retornar configuração padrão se arquivo não existir
    return {
      theme: 'light',
      language: 'pt-BR',
      autoBackup: true
    };
  }
});