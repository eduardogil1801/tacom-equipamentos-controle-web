const { app, BrowserWindow, ipcMain, Menu, dialog, shell, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');

// Forma robusta de detectar dev mode:
const isDev = !app.isPackaged;

let mainWindow;

// Pasta padrão de vídeos
const DEFAULT_VIDEO_FOLDER = 'C:\\Users\\EduardoGil\\OneDrive - TEU Bilhete\\Documentos\\video';

// Caminho do arquivo de configuração da pasta de vídeos
const getConfigPath = () => path.join(app.getPath('userData'), 'video-config.json');

// Ler a pasta de vídeos configurada
function getVideoFolder() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return config.videoFolder || DEFAULT_VIDEO_FOLDER;
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_VIDEO_FOLDER;
}

// Salvar a pasta de vídeos configurada
function saveVideoFolder(folderPath) {
  try {
    fs.writeFileSync(getConfigPath(), JSON.stringify({ videoFolder: folderPath }), 'utf-8');
  } catch (e) {
    // ignore
  }
}

// Extensões de vídeo suportadas
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpeg', '.mpg'];

// Registrar protocolo privilegiado ANTES do app.whenReady()
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'local-video',
    privileges: {
      secure: true,
      standard: true,
      stream: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
]);

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
  // Registrar protocolo local-video para servir arquivos de vídeo locais com segurança
  protocol.handle('local-video', (request) => {
    let filePath = decodeURIComponent(request.url.slice('local-video://'.length));
    // Remover barra inicial em Windows (ex: /C:/... -> C:/...)
    if (filePath.startsWith('/') && /^\/[A-Za-z]:/.test(filePath)) {
      filePath = filePath.slice(1);
    }
    return net.fetch('file:///' + filePath.replace(/\\/g, '/'));
  });

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

// Handlers IPC para vídeos
ipcMain.handle('get-video-folder', () => getVideoFolder());

ipcMain.handle('list-video-files', () => {
  const folder = getVideoFolder();
  try {
    if (!fs.existsSync(folder)) {
      return { success: false, error: `Pasta não encontrada: ${folder}`, files: [] };
    }
    const entries = fs.readdirSync(folder, { withFileTypes: true });
    const files = entries
      .filter(entry => {
        if (!entry.isFile()) return false;
        const ext = path.extname(entry.name).toLowerCase();
        return VIDEO_EXTENSIONS.includes(ext);
      })
      .map(entry => {
        const filePath = path.join(folder, entry.name);
        const stats = fs.statSync(filePath);
        return {
          name: entry.name,
          path: filePath,
          size: stats.size,
          modifiedAt: stats.mtime.toISOString(),
          url: 'local-video:///' + filePath.replace(/\\/g, '/')
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));
    return { success: true, files, folder };
  } catch (err) {
    const mensagensErro = {
      'EACCES': 'Sem permissão para acessar a pasta.',
      'EPERM':  'Operação não permitida na pasta.',
      'ENOTDIR':'O caminho indicado não é uma pasta válida.',
      'EBUSY':  'A pasta está em uso por outro processo.',
    };
    const codigo = err.code || '';
    const mensagem = mensagensErro[codigo] || `Erro ao ler a pasta: ${err.message}`;
    return { success: false, error: mensagem, files: [] };
  }
});

ipcMain.handle('select-video-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Selecionar pasta de vídeos',
    defaultPath: getVideoFolder()
  });
  if (!result.canceled && result.filePaths.length > 0) {
    const selected = result.filePaths[0];
    saveVideoFolder(selected);
    return { success: true, folder: selected };
  }
  return { success: false, folder: getVideoFolder() };
});

ipcMain.handle('open-video-folder', () => {
  const folder = getVideoFolder();
  shell.openPath(folder);
});

console.log('🚀 Electron main process iniciado');
console.log('🔧 isDev:', isDev);
