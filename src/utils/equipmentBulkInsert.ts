
import { supabase } from '@/integrations/supabase/client';

// Dados dos equipamentos CCIT 5.0 usados para FILIAL - TACOM - RS
const ccit5UsedEquipments = [
  '42555', '49016', '58292', '40132', '41035', '40191', '42590', '40242', 
  '41050', '42055', '41093', '42128', '40425', '42204', '42592', '49218', 
  '51129', '59419', '40538', '41250', '42645', '49429', '40686', '42227', 
  '42692', '49574', '59674', '40724', '43161', '52030', '59714', '40747', 
  '41279', '42286', '52595', '40789', '41333', '49738', '61609', '40800', 
  '41381', '42390', '49815', '52824', '40808', '41506', '42418', '49965', 
  '57535', '40845', '42574', '50138', '40870', '41571', '42478', '50183', 
  '57616', '40936', '41699', '47664', '50217', '57956', '40956', '48006'
];

export const insertCcit5UsedEquipments = async (empresaId: string, estado: string) => {
  const today = new Date().toISOString().split('T')[0];
  
  const equipmentsToInsert = ccit5UsedEquipments.map(serial => ({
    tipo: 'CCIT 5.0',
    numero_serie: serial,
    data_entrada: today,
    id_empresa: empresaId,
    estado: estado,
    status: 'disponivel'
  }));

  const { data, error } = await supabase
    .from('equipamentos')
    .insert(equipmentsToInsert);

  if (error) {
    throw error;
  }

  return data;
};

export const insertCcit5ForTacomRS = async () => {
  // Busca a empresa FILIAL - TACOM
  const { data: companies, error: companiesError } = await supabase
    .from('empresas')
    .select('id, name')
    .ilike('name', '%TACOM%')
    .limit(1);

  if (companiesError) throw companiesError;
  
  if (!companies || companies.length === 0) {
    throw new Error('Empresa FILIAL - TACOM não encontrada. Verifique se ela está cadastrada no sistema.');
  }

  const tacomCompany = companies[0];
  
  return await insertCcit5UsedEquipments(tacomCompany.id, 'Rio Grande do Sul');
};

export const getCcit5UsedEquipmentsList = () => {
  return ccit5UsedEquipments;
};
