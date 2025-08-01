const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  getAllFromTable: (tableName, filters) => ipcRenderer.invoke('db-get-all', tableName, filters),
  insertIntoTable: (tableName, data) => ipcRenderer.invoke('db-insert', tableName, data),
  updateInTable: (tableName, id, data) => ipcRenderer.invoke('db-update', tableName, id, data),
  deleteFromTable: (tableName, id) => ipcRenderer.invoke('db-delete', tableName, id),
  
  // Authentication
  login: (email, password) => ipcRenderer.invoke('auth-login', email, password),
  
  // Configuration
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  
  // App info
  getVersion: () => process.versions.electron,
  getPlatform: () => process.platform
});

// Declaração global para TypeScript
declare global {
  interface Window {
    electronAPI: {
      getAllFromTable: (tableName: string, filters?: any) => Promise<any[]>;
      insertIntoTable: (tableName: string, data: any) => Promise<any>;
      updateInTable: (tableName: string, id: string, data: any) => Promise<boolean>;
      deleteFromTable: (tableName: string, id: string) => Promise<boolean>;
      login: (email: string, password: string) => Promise<any | null>;
      saveConfig: (config: any) => Promise<boolean>;
      loadConfig: () => Promise<any>;
      getVersion: () => string;
      getPlatform: () => string;
    };
  }
}