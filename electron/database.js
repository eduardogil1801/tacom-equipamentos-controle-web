const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

let dbInstance = null;

async function initializeDatabase() {
  if (dbInstance) return dbInstance;

  try {
    // Criar diretório para banco se não existir
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'tacom_equipment.db');
    
    console.log('Inicializando banco de dados em:', dbPath);
    
    // Criar banco
    dbInstance = new Database(dbPath);
    
    // Configurar para WAL mode (melhor performance)
    dbInstance.pragma('journal_mode = WAL');
    
    // Criar tabelas se não existirem
    await createTables(dbInstance);
    
    // Inserir dados iniciais se necessário
    await insertInitialData(dbInstance);
    
    return dbInstance;
  } catch (error) {
    console.error('Erro ao inicializar banco:', error);
    throw error;
  }
}

async function createTables(db) {
  const tables = [
    // Tabela de usuários
    `CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Tabela de empresas
    `CREATE TABLE IF NOT EXISTS empresas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      cnpj TEXT,
      endereco TEXT,
      telefone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Tabela de tipos de equipamento
    `CREATE TABLE IF NOT EXISTS tipos_equipamento (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      descricao TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Tabela de equipamentos
    `CREATE TABLE IF NOT EXISTS equipamentos (
      id TEXT PRIMARY KEY,
      numero_serie TEXT UNIQUE NOT NULL,
      tipo TEXT NOT NULL,
      modelo TEXT,
      ano INTEGER,
      empresa_atual TEXT,
      status TEXT DEFAULT 'disponivel',
      observacoes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empresa_atual) REFERENCES empresas(id)
    )`,
    
    // Tabela de tipos de movimento
    `CREATE TABLE IF NOT EXISTS tipos_movimento (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      descricao TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Tabela de movimentações
    `CREATE TABLE IF NOT EXISTS movimentacoes (
      id TEXT PRIMARY KEY,
      equipamento_id TEXT NOT NULL,
      tipo_movimento TEXT NOT NULL,
      empresa_origem TEXT,
      empresa_destino TEXT,
      data_movimento DATETIME NOT NULL,
      observacoes TEXT,
      responsavel TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id),
      FOREIGN KEY (empresa_origem) REFERENCES empresas(id),
      FOREIGN KEY (empresa_destino) REFERENCES empresas(id)
    )`,
    
    // Tabela de tipos de manutenção
    `CREATE TABLE IF NOT EXISTS tipos_manutencao (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      descricao TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Tabela de manutenções
    `CREATE TABLE IF NOT EXISTS manutencoes (
      id TEXT PRIMARY KEY,
      equipamento_id TEXT NOT NULL,
      tipo TEXT NOT NULL,
      descricao TEXT,
      data_inicio DATETIME,
      data_fim DATETIME,
      custo DECIMAL(10,2),
      responsavel TEXT,
      status TEXT DEFAULT 'pendente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id)
    )`
  ];

  for (const tableSQL of tables) {
    db.exec(tableSQL);
  }
  
  console.log('Tabelas criadas com sucesso');
}

async function insertInitialData(db) {
  // Verificar se já existem dados
  const userCount = db.prepare('SELECT COUNT(*) as count FROM usuarios').get();
  
  if (userCount.count === 0) {
    // Inserir dados iniciais
    const initialData = {
      usuarios: [
        {
          id: '1',
          email: 'admin@tacom.com',
          password: 'admin123',
          role: 'admin',
          name: 'Administrador'
        }
      ],
      empresas: [
        {
          id: '1',
          name: 'TACOM Projetos',
          cnpj: '12.345.678/0001-90'
        },
        {
          id: '2',
          name: 'Cliente A',
          cnpj: '98.765.432/0001-10'
        },
        {
          id: '3',
          name: 'Cliente B',
          cnpj: '11.222.333/0001-44'
        }
      ],
      tipos_equipamento: [
        { id: '1', name: 'Escavadeira' },
        { id: '2', name: 'Trator' },
        { id: '3', name: 'Retroescavadeira' },
        { id: '4', name: 'Carregadeira' },
        { id: '5', name: 'Bulldozer' }
      ],
      tipos_movimento: [
        { id: '1', name: 'saida', descricao: 'Saída de equipamento' },
        { id: '2', name: 'retorno', descricao: 'Retorno de equipamento' },
        { id: '3', name: 'manutencao', descricao: 'Envio para manutenção' },
        { id: '4', name: 'retorno_manutencao', descricao: 'Retorno de manutenção' }
      ],
      tipos_manutencao: [
        { id: '1', name: 'Preventiva', descricao: 'Manutenção preventiva' },
        { id: '2', name: 'Corretiva', descricao: 'Manutenção corretiva' },
        { id: '3', name: 'Emergencial', descricao: 'Manutenção de emergência' }
      ]
    };

    // Inserir dados iniciais
    for (const [tableName, records] of Object.entries(initialData)) {
      for (const record of records) {
        const columns = Object.keys(record).join(', ');
        const placeholders = Object.keys(record).map(() => '?').join(', ');
        const values = Object.values(record);
        
        const stmt = db.prepare(`INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`);
        stmt.run(...values);
      }
    }
    
    console.log('Dados iniciais inseridos com sucesso');
  }
}

// Funções CRUD
async function getAllFromTable(db, tableName, filters = {}) {
  try {
    let query = `SELECT * FROM ${tableName}`;
    const params = [];
    
    if (Object.keys(filters).length > 0) {
      const conditions = Object.keys(filters).map(key => {
        params.push(filters[key]);
        return `${key} = ?`;
      });
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    throw error;
  }
}

async function insertIntoTable(db, tableName, data) {
  try {
    // Gerar ID se não existir
    if (!data.id) {
      data.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }
    
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const stmt = db.prepare(`INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`);
    const result = stmt.run(...values);
    
    return { ...data, id: data.id };
  } catch (error) {
    console.error('Erro ao inserir dados:', error);
    throw error;
  }
}

async function updateInTable(db, tableName, id, data) {
  try {
    data.updated_at = new Date().toISOString();
    
    const updates = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(data), id];
    
    const stmt = db.prepare(`UPDATE ${tableName} SET ${updates} WHERE id = ?`);
    const result = stmt.run(...values);
    
    return result.changes > 0;
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
    throw error;
  }
}

async function deleteFromTable(db, tableName, id) {
  try {
    const stmt = db.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
    const result = stmt.run(id);
    
    return result.changes > 0;
  } catch (error) {
    console.error('Erro ao deletar dados:', error);
    throw error;
  }
}

module.exports = {
  initializeDatabase,
  getAllFromTable,
  insertIntoTable,
  updateInTable,
  deleteFromTable
};