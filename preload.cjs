const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o processo renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Informações da aplicação
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppName: () => ipcRenderer.invoke('get-app-name'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // API de vídeos locais
  getVideoFolder: () => ipcRenderer.invoke('get-video-folder'),
  listVideoFiles: () => ipcRenderer.invoke('list-video-files'),
  selectVideoFolder: () => ipcRenderer.invoke('select-video-folder'),
  openVideoFolder: () => ipcRenderer.invoke('open-video-folder')
});

console.log('🔧 Preload script carregado com sucesso!');
