const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o processo renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Informações da aplicação
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppName: () => ipcRenderer.invoke('get-app-name'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  
  // Diálogos do sistema
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // Navegação externa
  openExternal: (url) => ipcRenderer.invoke('shell-open-external', url),
  
  // Notificações
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
  
  // Paths do sistema
  getPath: (name) => ipcRenderer.invoke('get-path', name),
  
  // Listeners para eventos do menu
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action, data) => {
      callback(action, data);
    });
  },
  
  // Remover listeners
  removeMenuActionListener: () => {
    ipcRenderer.removeAllListeners('menu-action');
  },
  
  // Utilitários para arquivos
  fs: {
    // Apenas funções seguras para arquivos serão expostas aqui
    // Implementar conforme necessário para sua aplicação
  },
  
  // Utilities para base de dados local (SQLite)
  database: {
    // APIs para interação com SQLite serão implementadas aqui
    // quando necessário
  }
});

// Log para desenvolvimento
console.log('Preload script carregado com sucesso!');

// Listener para quando o DOM estiver carregado
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM carregado no processo renderer');
  
  // Aqui você pode adicionar inicializações específicas
  // que precisam acontecer após o DOM estar pronto
});