// Interface para comunicação com o banco via Electron
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

// Verificar se está rodando no Electron
export const isElectron = typeof window !== 'undefined' && window.electronAPI;

// Adaptador para o banco local
export class ElectronDatabase {
  static async getAll(tableName: string, filters: any = {}) {
    if (!isElectron) {
      throw new Error('Database não disponível fora do Electron');
    }
    return await window.electronAPI.getAllFromTable(tableName, filters);
  }

  static async insert(tableName: string, data: any) {
    if (!isElectron) {
      throw new Error('Database não disponível fora do Electron');
    }
    return await window.electronAPI.insertIntoTable(tableName, data);
  }

  static async update(tableName: string, id: string, data: any) {
    if (!isElectron) {
      throw new Error('Database não disponível fora do Electron');
    }
    return await window.electronAPI.updateInTable(tableName, id, data);
  }

  static async delete(tableName: string, id: string) {
    if (!isElectron) {
      throw new Error('Database não disponível fora do Electron');
    }
    return await window.electronAPI.deleteFromTable(tableName, id);
  }

  static async login(email: string, password: string) {
    if (!isElectron) {
      throw new Error('Database não disponível fora do Electron');
    }
    return await window.electronAPI.login(email, password);
  }
}

// Mapeamento de tabelas Supabase para SQLite
export const tableMapping = {
  equipamentos: 'equipamentos',
  empresas: 'empresas',
  movimentacoes: 'movimentacoes',
  usuarios: 'usuarios',
  tipos_equipamento: 'tipos_equipamento',
  tipos_movimento: 'tipos_movimento',
  tipos_manutencao: 'tipos_manutencao',
  manutencoes: 'manutencoes'
};

// Helper para substituir queries Supabase
export const fromTable = (tableName: string) => ({
  select: (columns: string = '*') => ({
    eq: (column: string, value: any) => ElectronDatabase.getAll(tableName, { [column]: value }),
    neq: (column: string, value: any) => ElectronDatabase.getAll(tableName).then(rows => 
      rows.filter(row => row[column] !== value)
    ),
    ilike: (column: string, value: string) => ElectronDatabase.getAll(tableName).then(rows =>
      rows.filter(row => row[column]?.toLowerCase().includes(value.toLowerCase()))
    ),
    order: (column: string, options: any = {}) => ElectronDatabase.getAll(tableName).then(rows => {
      const sorted = rows.sort((a, b) => {
        if (options.ascending === false) {
          return b[column] > a[column] ? 1 : -1;
        }
        return a[column] > b[column] ? 1 : -1;
      });
      return { data: sorted, error: null };
    }),
    limit: (count: number) => ElectronDatabase.getAll(tableName).then(rows => ({
      data: rows.slice(0, count),
      error: null
    }))
  }),
  insert: (data: any) => ElectronDatabase.insert(tableName, data).then(result => ({
    data: result,
    error: null
  })),
  update: (data: any) => ({
    eq: (column: string, value: any) => ElectronDatabase.getAll(tableName, { [column]: value })
      .then(rows => {
        if (rows.length > 0) {
          return ElectronDatabase.update(tableName, rows[0].id, data);
        }
        return false;
      }).then(success => ({ data: success ? data : null, error: success ? null : 'Update failed' }))
  }),
  delete: () => ({
    eq: (column: string, value: any) => ElectronDatabase.getAll(tableName, { [column]: value })
      .then(rows => {
        if (rows.length > 0) {
          return ElectronDatabase.delete(tableName, rows[0].id);
        }
        return false;
      }).then(success => ({ data: success, error: success ? null : 'Delete failed' }))
  })
});

// Substituir cliente Supabase
export const electronSupabase = {
  from: fromTable,
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const user = await ElectronDatabase.login(email, password);
      if (user) {
        return {
          data: { user, session: { user } },
          error: null
        };
      }
      return {
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      };
    },
    signOut: async () => {
      return { error: null };
    },
    getUser: async () => {
      // Implementar cache de usuário ou buscar do localStorage
      const userData = localStorage.getItem('currentUser');
      if (userData) {
        return { data: { user: JSON.parse(userData) }, error: null };
      }
      return { data: { user: null }, error: null };
    }
  }
};