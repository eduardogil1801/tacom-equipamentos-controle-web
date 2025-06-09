
import { supabase } from '@/integrations/supabase/client';

export interface BulkEquipmentData {
  tipo: string;
  numero_serie: string;
  data_entrada: string;
  id_empresa: string;
  status: string;
  estado: string;
  modelo?: string;
}

export const validateBulkData = (data: any[]): BulkEquipmentData[] => {
  const requiredFields = ['tipo', 'numero_serie', 'data_entrada', 'id_empresa', 'status', 'estado'];
  
  return data.map((item, index) => {
    // Verificar campos obrigatórios
    const missingFields = requiredFields.filter(field => !item[field]);
    if (missingFields.length > 0) {
      throw new Error(`Linha ${index + 1}: Campos obrigatórios não preenchidos: ${missingFields.join(', ')}`);
    }

    // Validar formato da data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(item.data_entrada)) {
      throw new Error(`Linha ${index + 1}: Data de entrada deve estar no formato YYYY-MM-DD`);
    }

    // Validar status
    const validStatuses = ['disponivel', 'em_uso', 'manutencao', 'defeito'];
    if (!validStatuses.includes(item.status)) {
      throw new Error(`Linha ${index + 1}: Status deve ser um dos seguintes: ${validStatuses.join(', ')}`);
    }

    // Validar estado
    const validStates = ['novo', 'usado', 'recondicionado'];
    if (!validStates.includes(item.estado)) {
      throw new Error(`Linha ${index + 1}: Estado deve ser um dos seguintes: ${validStates.join(', ')}`);
    }

    return {
      tipo: item.tipo,
      numero_serie: item.numero_serie,
      data_entrada: item.data_entrada,
      id_empresa: item.id_empresa,
      status: item.status,
      estado: item.estado,
      modelo: item.modelo || null
    };
  });
};

export const parseCSV = (csvContent: string): any[] => {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const item: any = {};
    
    headers.forEach((header, index) => {
      item[header] = values[index];
    });
    
    data.push(item);
  }
  
  return data;
};

export const bulkInsertEquipments = async (equipments: BulkEquipmentData[]) => {
  const { data, error } = await supabase
    .from('equipamentos')
    .insert(equipments);

  if (error) {
    throw new Error(`Erro ao inserir equipamentos: ${error.message}`);
  }

  return data;
};
