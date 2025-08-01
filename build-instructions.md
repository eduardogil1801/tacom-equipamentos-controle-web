# Instruções para Build do Aplicativo Desktop

## Pré-requisitos

1. **Node.js** (versão 16 ou superior)
2. **Git** 
3. **Windows** (para gerar o executável .exe)

## Passo a Passo

### 1. Preparar o Projeto

```bash
# Clone o repositório do GitHub
git clone [URL_DO_SEU_REPOSITORIO]
cd tacom-equipamentos-controle-web

# Instalar dependências web
npm install

# Copiar configuração do Electron
cp package.electron.json package.json

# Instalar dependências do Electron
npm install
```

### 2. Testar Localmente

```bash
# Testar em modo desenvolvimento
npm run electron-dev
```

### 3. Gerar o Executável

```bash
# Build completo (web + electron)
npm run build

# Gerar instalador Windows (.exe)
npm run dist:win
```

## Arquivos Gerados

Após o build, encontre os arquivos em `release/`:

- **TACOM-Equipamentos-Installer-1.0.0.exe** - Instalador completo
- **TACOM-Equipamentos-Portable-1.0.0.exe** - Versão portátil

## Estrutura de Arquivos Criados

```
projeto/
├── electron/                 # Código do Electron
│   ├── main.js              # Processo principal
│   ├── preload.js           # Script de segurança
│   └── database.js          # Gerenciador SQLite
├── build/                   # Ícones do app
│   └── icon.ico
├── src/utils/               # Utilitários adaptados
│   └── electronDatabase.ts  # Interface para SQLite
├── release/                 # Executáveis gerados
├── package.electron.json    # Configuração Electron
└── build-instructions.md    # Este arquivo
```

## Adaptações Feitas

### 1. Banco de Dados
- ✅ Removido Supabase completamente
- ✅ Implementado SQLite local
- ✅ Dados salvos em `%APPDATA%/tacom-equipamentos-desktop/`
- ✅ Backup automático das configurações

### 2. Funcionalidades Mantidas
- ✅ Sistema de login local
- ✅ Gestão de equipamentos
- ✅ Controle de movimentações
- ✅ Relatórios e dashboards
- ✅ Todas as funcionalidades originais

### 3. Recursos Adicionais
- ✅ Instalador personalizado
- ✅ Ícone personalizado
- ✅ Atalho na área de trabalho
- ✅ Configurações salvas localmente
- ✅ Versão portátil disponível

## Personalização

### Alterar Ícone
1. Substitua `build/icon.ico` pelo seu ícone
2. Regenere o build com `npm run dist:win`

### Alterar Nome do App
1. Edite `build.productName` em `package.json`
2. Regenere o build

### Banco de Dados
- Localização: `%APPDATA%/tacom-equipamentos-desktop/tacom_equipment.db`
- Backup manual: Copie o arquivo `.db`
- Reset: Delete o arquivo `.db` e reinicie o app

## Troubleshooting

### Erro ao Build
- Instale: `npm install --save-dev electron-rebuild`
- Execute: `npx electron-rebuild`

### Erro de Permissão
- Execute como administrador
- Ou desative antivírus temporariamente

### Banco Não Inicia
- Verifique permissões na pasta `%APPDATA%`
- Delete `tacom_equipment.db` para reset

## Distribuição

### Para o Cliente
1. Envie apenas o arquivo `TACOM-Equipamentos-Installer-1.0.0.exe`
2. Cliente executa como administrador
3. Escolhe diretório de instalação
4. App fica pronto para uso

### Atualizações
1. Altere a versão em `package.json`
2. Regenere o build
3. Distribua novo instalador