const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o processo renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Informações da aplicação
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppName: () => ipcRenderer.invoke('get-app-name'),
  getPlatform: () => ipcRenderer.invoke('get-platform')
});

console.log('🔧 Preload script carregado com sucesso!');