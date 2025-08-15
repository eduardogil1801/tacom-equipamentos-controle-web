
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
// Adicionar esta função para validar duplicatas no banco:

export const validateSerialNumbersInDatabase = async (equipments: BulkEquipmentData[]): Promise<string[]> => {
  const errors: string[] = [];
  
  try {
    // Buscar todos os equipamentos existentes no banco
    const { data: existingEquipments, error } = await supabase
      .from('equipamentos')
      .select('numero_serie, tipo');
    
    if (error) {
      throw new Error(`Erro ao consultar equipamentos existentes: ${error.message}`);
    }
    
    // Criar um mapa para busca rápida de equipamentos existentes
    const existingMap = new Map<string, Set<string>>();
    existingEquipments?.forEach(eq => {
      if (!existingMap.has(eq.tipo)) {
        existingMap.set(eq.tipo, new Set());
      }
      existingMap.get(eq.tipo)?.add(eq.numero_serie);
    });
    
    // Validar cada equipamento do arquivo
    equipments.forEach((equipment, index) => {
      const key = equipment.tipo;
      const serialNumber = equipment.numero_serie;
      
      // Verificar se já existe no banco
      if (existingMap.has(key) && existingMap.get(key)?.has(serialNumber)) {
        errors.push(`Linha ${index + 1}: Já existe um equipamento do tipo "${key}" com número de série "${serialNumber}"`);
      }
    });
    
    return errors;
  } catch (error) {
    throw new Error(`Erro na validação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};
export const validateBulkData = (data: any[]): BulkEquipmentData[] => {
  const requiredFields = ['tipo', 'numero_serie', 'data_entrada', 'id_empresa', 'status', 'estado'];
  const seenCombinations = new Set<string>();
  const errors: string[] = [];
  
  const validatedData = data.map((item, index) => {
    // Verificar campos obrigatórios
    const missingFields = requiredFields.filter(field => !item[field]);
    if (missingFields.length > 0) {
      errors.push(`Linha ${index + 1}: Campos obrigatórios não preenchidos: ${missingFields.join(', ')}`);
    }

    // Validar formato da data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (item.data_entrada && !dateRegex.test(item.data_entrada)) {
      errors.push(`Linha ${index + 1}: Data de entrada deve estar no formato YYYY-MM-DD`);
    }

    // Validar status
    const validStatuses = ['disponivel', 'em_uso', 'manutencao', 'defeito', 'aguardando_manutencao', 'indisponivel', 'devolvido'];
    if (item.status && !validStatuses.includes(item.status)) {
      errors.push(`Linha ${index + 1}: Status deve ser um dos seguintes: ${validStatuses.join(', ')}`);
    }

    // Validar estado
    const validStates = ['novo', 'usado', 'recondicionado'];
    if (item.estado && !validStates.includes(item.estado)) {
      errors.push(`Linha ${index + 1}: Estado deve ser um dos seguintes: ${validStates.join(', ')}`);
    }

    // Verificar duplicatas dentro do próprio arquivo
    if (item.tipo && item.numero_serie) {
      const combination = `${item.tipo}-${item.numero_serie}`;
      if (seenCombinations.has(combination)) {
        errors.push(`Linha ${index + 1}: Combinação de tipo "${item.tipo}" e número de série "${item.numero_serie}" já existe no arquivo`);
      } else {
        seenCombinations.add(combination);
      }
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

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }

  return validatedData;
};

export const bulkInsertEquipments = async (equipments: BulkEquipmentData[]) => {
  // Primeiro, validar se há duplicatas no banco de dados
  const validationErrors = await validateSerialNumbersInDatabase(equipments);
  
  if (validationErrors.length > 0) {
    throw new Error(`Erros de validação encontrados:\n${validationErrors.join('\n')}`);
  }
  
  // Se passou na validação, inserir os equipamentos
  const { data, error } = await supabase
    .from('equipamentos')
    .insert(equipments);

  if (error) {
    throw new Error(`Erro ao inserir equipamentos: ${error.message}`);
  }

  return data;
};
