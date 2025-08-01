// Sistema de armazenamento local para substituir Supabase
export interface LocalData {
  equipment: any[];
  companies: any[];
  movements: any[];
  users: any[];
  equipmentTypes: any[];
  movementTypes: any[];
  maintenanceTypes: any[];
  maintenanceRules: any[];
}

const STORAGE_KEY = 'tacom_equipment_data';

// Dados iniciais padrão
const defaultData: LocalData = {
  equipment: [],
  companies: [
    { id: '1', name: 'TACOM Projetos', cnpj: '12.345.678/0001-90' },
    { id: '2', name: 'Cliente A', cnpj: '98.765.432/0001-10' },
    { id: '3', name: 'Cliente B', cnpj: '11.222.333/0001-44' }
  ],
  movements: [],
  users: [
    { 
      id: '1', 
      email: 'admin@tacom.com', 
      password: 'admin123', 
      role: 'admin',
      name: 'Administrador'
    }
  ],
  equipmentTypes: [
    { id: '1', name: 'Escavadeira' },
    { id: '2', name: 'Trator' },
    { id: '3', name: 'Retroescavadeira' }
  ],
  movementTypes: [
    { id: '1', name: 'Saída' },
    { id: '2', name: 'Retorno' },
    { id: '3', name: 'Manutenção' },
    { id: '4', name: 'Retorno de Manutenção' }
  ],
  maintenanceTypes: [
    { id: '1', name: 'Preventiva' },
    { id: '2', name: 'Corretiva' }
  ],
  maintenanceRules: []
};

// Salvar dados no localStorage
export const saveData = (data: LocalData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    throw new Error('Falha ao salvar dados localmente');
  }
};

// Carregar dados do localStorage
export const loadData = (): LocalData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Se não existe dados, criar dados iniciais
    saveData(defaultData);
    return defaultData;
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    // Em caso de erro, retornar dados padrão
    return defaultData;
  }
};

// Atualizar uma tabela específica
export const updateTable = (table: keyof LocalData, data: any[]): void => {
  const currentData = loadData();
  currentData[table] = data;
  saveData(currentData);
};

// Adicionar item a uma tabela
export const addToTable = (table: keyof LocalData, item: any): void => {
  const currentData = loadData();
  const items = currentData[table] as any[];
  
  // Gerar ID único se não existir
  if (!item.id) {
    item.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
  
  items.push(item);
  currentData[table] = items;
  saveData(currentData);
};

// Atualizar item em uma tabela
export const updateInTable = (table: keyof LocalData, id: string, updates: any): void => {
  const currentData = loadData();
  const items = currentData[table] as any[];
  
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    currentData[table] = items;
    saveData(currentData);
  }
};

// Remover item de uma tabela
export const removeFromTable = (table: keyof LocalData, id: string): void => {
  const currentData = loadData();
  const items = currentData[table] as any[];
  
  currentData[table] = items.filter(item => item.id !== id);
  saveData(currentData);
};

// Buscar itens em uma tabela
export const getFromTable = (table: keyof LocalData, filters?: any): any[] => {
  const currentData = loadData();
  let items = currentData[table] as any[];
  
  if (filters) {
    items = items.filter(item => {
      return Object.keys(filters).every(key => {
        const filterValue = filters[key];
        const itemValue = item[key];
        
        if (filterValue === null || filterValue === undefined) return true;
        if (typeof filterValue === 'string') {
          return itemValue?.toString().toLowerCase().includes(filterValue.toLowerCase());
        }
        return itemValue === filterValue;
      });
    });
  }
  
  return items;
};

// Export/Import para backup
export const exportData = (): string => {
  const data = loadData();
  return JSON.stringify(data, null, 2);
};

export const importData = (jsonString: string): void => {
  try {
    const data = JSON.parse(jsonString) as LocalData;
    saveData(data);
  } catch (error) {
    throw new Error('Formato de arquivo inválido');
  }
};

// Limpar todos os dados
export const clearAllData = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// Resetar para dados padrão
export const resetToDefault = (): void => {
  saveData(defaultData);
};