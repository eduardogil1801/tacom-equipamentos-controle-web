#!/bin/bash

echo "🚀 Configurando aplicação Electron para TACOM Equipamentos..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não está instalado!${NC}"
    echo "Por favor, instale Node.js: https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✅ Node.js encontrado: $(node --version)${NC}"

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm não está instalado!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm encontrado: $(npm --version)${NC}"

# Instalar dependências
echo -e "${YELLOW}📦 Instalando dependências adicionais...${NC}"
npm install --save-dev concurrently wait-on

# Criar diretórios necessários
echo -e "${YELLOW}📁 Criando estrutura de diretórios...${NC}"
mkdir -p build
mkdir -p assets
mkdir -p dist-electron

# Criar arquivo main.js se não existir
if [ ! -f "main.js" ]; then
    echo -e "${YELLOW}⚡ Criando main.js...${NC}"
    cat > main.js << 'EOF'
const { app, BrowserWindow, ipcMain, Menu, dialog, shell } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

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
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers básicos
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-name', () => app.getName());
ipcMain.handle('get-platform', () => process.platform);
EOF
    echo -e "${GREEN}✅ main.js criado${NC}"
else
    echo -e "${GREEN}✅ main.js já existe${NC}"
fi

# Criar arquivo preload.js se não existir
if [ ! -f "preload.js" ]; then
    echo -e "${YELLOW}⚡ Criando preload.js...${NC}"
    cat > preload.js << 'EOF'
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppName: () => ipcRenderer.invoke('get-app-name'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
});
EOF
    echo -e "${GREEN}✅ preload.js criado${NC}"
else
    echo -e "${GREEN}✅ preload.js já existe${NC}"
fi

# Criar hook useElectron se não existir
if [ ! -f "src/hooks/useElectron.ts" ]; then
    echo -e "${YELLOW}⚡ Criando hook useElectron.ts...${NC}"
    mkdir -p src/hooks
    cat > src/hooks/useElectron.ts << 'EOF'
import { useEffect, useState } from 'react';

const isElectron = typeof window !== 'undefined' && window.electronAPI;

export const useElectron = () => {
  const [isElectronApp, setIsElectronApp] = useState(false);

  useEffect(() => {
    setIsElectronApp(!!isElectron);
  }, []);

  return {
    isElectronApp,
    electronAPI: isElectron ? (window as any).electronAPI : null
  };
};
EOF
    echo -e "${GREEN}✅ useElectron.ts criado${NC}"
else
    echo -e "${GREEN}✅ useElectron.ts já existe${NC}"
fi

# Criar ícone placeholder se não existir
if [ ! -f "assets/icon.png" ]; then
    echo -e "${YELLOW}🖼️  Criando ícone placeholder...${NC}"
    # Criar um ícone simples em texto (você deve substituir por um ícone real)
    echo "Por favor, adicione seu ícone em assets/icon.png (512x512px recomendado)"
    touch assets/icon.png
fi

# Atualizar vite.config.ts para Electron
echo -e "${YELLOW}⚙️  Atualizando vite.config.ts...${NC}"
if grep -q "base: './'," vite.config.ts; then
    echo -e "${GREEN}✅ vite.config.ts já configurado para Electron${NC}"
else
    # Fazer backup
    cp vite.config.ts vite.config.ts.backup
    
    # Adicionar configuração base se não existir
    sed -i.tmp "s/export default defineConfig({/export default defineConfig({\n  base: '.\/',/" vite.config.ts
    rm -f vite.config.ts.tmp
    
    echo -e "${GREEN}✅ vite.config.ts atualizado${NC}"
fi

# Verificar package.json
echo -e "${YELLOW}📄 Verificando package.json...${NC}"
if grep -q '"main": "main.js"' package.json; then
    echo -e "${GREEN}✅ package.json já configurado${NC}"
else
    echo -e "${YELLOW}⚠️  Adicione as seguintes linhas ao seu package.json:${NC}"
    echo '"main": "main.js",'
    echo '"homepage": "./",'
    echo ''
    echo 'E adicione estes scripts:'
    echo '"electron": "electron .",'
    echo '"electron-dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",'
    echo '"build-electron": "npm run build && electron-builder"'
fi

echo ""
echo -e "${GREEN}🎉 Setup concluído!${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos passos:${NC}"
echo "1. Adicione um ícone real em assets/icon.png (512x512px)"
echo "2. Configure o package.json com as linhas mencionadas acima"
echo "3. Teste em desenvolvimento: npm run electron-dev"
echo "4. Para build: npm run build-electron"
echo ""
echo -e "${YELLOW}🔧 Comandos úteis:${NC}"
echo "• npm run dev          - Iniciar servidor Vite"
echo "• npm run electron     - Iniciar Electron (após build)"
echo "• npm run electron-dev - Desenvolvimento com hot-reload"
echo "• npm run build-electron - Build completo"
echo ""
echo -e "${GREEN}✨ Aplicação Electron pronta para desenvolvimento!${NC}"