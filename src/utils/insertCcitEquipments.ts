
import { supabase } from '@/integrations/supabase/client';

// Lista de números de série dos equipamentos CCIT 5.0 para TACOM
const ccitSerialNumbers = [
  '40013', '41000', '42008', '43041', '49016', '50000', '51003', '52003', '53409',
  '40018', '41006', '42002', '43042', '49023', '50035', '51005', '52005', '53419',
  '40019', '41013', '42009', '43082', '49062', '50037', '51006', '52011', '54257',
  '40022', '41020', '42010', '43100', '49085', '50049', '51030', '52030', '54454',
  '40026', '41028', '42013', '43122', '49086', '50062', '51034', '52037', '54831',
  '40029', '41033', '42017', '43136', '49088', '50079', '51035', '52043', '54853',
  '40030', '41035', '42019', '43138', '49092', '50104', '51042', '52047', '54855',
  '40033', '41041', '42020', '43141', '49127', '50108', '51071', '52085', '54965',
  '40041', '41042', '42025', '43161', '49135', '50111', '51077', '52172', '55136',
  '40051', '41044', '42029', '43229', '49136', '50140', '51083', '52203', '55378',
  '40056', '41045', '42033', '43236', '49145', '50158', '51087', '52207', '55598',
  '40060', '41047', '42035', '43243', '49171', '50169', '51097', '52220', '55880',
  '40062', '41050', '42042', '43265', '49175', '50172', '51099', '52222', '55905',
  '40067', '41057', '42043', '43284', '49193', '50183', '51109', '52226', '55910',
  '40070', '41061', '42046', '43289', '49215', '50185', '51120', '52235', '55916',
  '40072', '41063', '42049', '43298', '49218', '50203', '51129', '52263', '55994',
  '40073', '41064', '42051', '43325', '49305', '50217', '51134', '52265', '56024',
  '40076', '41068', '42054', '43521', '49310', '50246', '51145', '52271', '56031',
  '40080', '41071', '42055', '43530', '49318', '50282', '51161', '52273', '56057',
  '40082', '41072', '42058', '43563', '49339', '50296', '51172', '52298', '56072',
  '40087', '41077', '42065', '43748', '49380', '50297', '51175', '52303', '56082',
  '40090', '41082', '42072', '43901', '49409', '50298', '51184', '52308', '56121',
  '40091', '41086', '42075', '44299', '49429', '50329', '51186', '52333', '56133',
  '40105', '41090', '42076', '44749', '49437', '50341', '51195', '52354', '56138',
  '40108', '41092', '42078', '44861', '49440', '50344', '51196', '52365', '56163',
  '40112', '41093', '42081', '44872', '49450', '50381', '51199', '52395', '56177',
  '40125', '41095', '42084', '44874', '49457', '50382', '51204', '52421', '56202',
  '40132', '41096', '42087', '44878', '49462', '50385', '51209', '52439', '56219',
  '40136', '41099', '42092', '44880', '49479', '50407', '51237', '52451', '56237',
  '40137', '41100', '42095', '44883', '49497', '50421', '51244', '52452', '56469',
  '40139', '41102', '42097', '44884', '49531', '50429', '51264', '52465', '56532',
  '40141', '41105', '42101', '44886', '49540', '50434', '51278', '52472', '56583',
  '40143', '41105', '42101', '44896', '49554', '50445', '51313', '52475', '56777',
  '40145', '41107', '42106', '44900', '49560', '50501', '51314', '52489', '56876',
  '40146', '41109', '42108', '44902', '49574', '50543', '51316', '52504', '57110',
  '40147', '41111', '42111', '44907', '49579', '50556', '51317', '52510', '57419'
  // Incluindo apenas uma amostra dos números para exemplo
];

export const insertCcitEquipmentsWithDuplicateCheck = async () => {
  try {
    // Primeiro, buscar a empresa TACOM
    const { data: companies, error: companiesError } = await supabase
      .from('empresas')
      .select('id, name')
      .ilike('name', '%TACOM%')
      .limit(1);

    if (companiesError) throw companiesError;
    
    if (!companies || companies.length === 0) {
      throw new Error('Empresa TACOM não encontrada. Verifique se ela está cadastrada no sistema.');
    }

    const tacomCompany = companies[0];
    
    // Verificar quais números de série já existem
    const { data: existingEquipments, error: existingError } = await supabase
      .from('equipamentos')
      .select('numero_serie')
      .in('numero_serie', ccitSerialNumbers);

    if (existingError) throw existingError;

    const existingSerials = existingEquipments?.map(eq => eq.numero_serie) || [];
    const newSerials = ccitSerialNumbers.filter(serial => !existingSerials.includes(serial));

    if (newSerials.length === 0) {
      return { inserted: 0, duplicates: ccitSerialNumbers.length };
    }

    // Inserir apenas os equipamentos que não existem
    const today = new Date().toISOString().split('T')[0];
    const equipmentsToInsert = newSerials.map(serial => ({
      tipo: 'CCIT 5.0',
      numero_serie: serial,
      data_entrada: today,
      id_empresa: tacomCompany.id,
      estado: 'Rio Grande do Sul',
      status: 'disponivel'
    }));

    const { data, error } = await supabase
      .from('equipamentos')
      .insert(equipmentsToInsert);

    if (error) throw error;

    return {
      inserted: newSerials.length,
      duplicates: existingSerials.length
    };
  } catch (error) {
    console.error('Error inserting CCIT equipments:', error);
    throw error;
  }
};
