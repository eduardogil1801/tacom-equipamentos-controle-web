
interface Equipment {
  id: string;
  tipo: string;
  numero_serie: string;
  data_entrada: string;
  data_saida?: string;
  id_empresa: string;
  estado?: string;
  status?: string;
  em_manutencao?: boolean;
  empresas?: {
    name: string;
    estado?: string;
  };
}

interface Company {
  id: string;
  name: string;
  estado?: string;
}

interface MaintenanceMovement {
  id: string;
  tipo_movimento: string;
  detalhes_manutencao?: string;
  id_equipamento?: string;
  data_criacao?: string;
  tipos_manutencao?: {
    codigo: string;
    descricao: string;
  };
}

export const useDashboardCalculations = (
  equipments: Equipment[],
  allEquipments: Equipment[],
  companies: Company[],
  maintenanceMovements: MaintenanceMovement[],
  tacomCompany: Company | null,
  selectedCompany: string
) => {
  // Helper function to ensure valid numbers for charts
  const ensureValidNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return 0;
    return Math.max(0, Math.floor(num));
  };

  // Helper function to validate chart data
  const validateChartData = (data: any[]): any[] => {
    return data
      .filter(item => item && typeof item === 'object')
      .map(item => {
        const validatedItem = { ...item };
        
        Object.keys(validatedItem).forEach(key => {
          if (typeof validatedItem[key] === 'number' || 
              (typeof validatedItem[key] === 'string' && !isNaN(Number(validatedItem[key])))) {
            validatedItem[key] = ensureValidNumber(validatedItem[key]);
          }
        });
        
        return validatedItem;
      })
      .filter(item => {
        const numericValues = Object.values(item).filter(val => typeof val === 'number');
        return numericValues.length === 0 || numericValues.some(val => val > 0);
      });
  };

  // Calculate statistics
  const totalEquipments = ensureValidNumber(allEquipments.length);
  
  const tacomEquipmentsInStock = tacomCompany 
    ? allEquipments.filter(eq => eq.id_empresa === tacomCompany.id && !eq.data_saida)
    : [];
  const inStockEquipments = ensureValidNumber(tacomEquipmentsInStock.length);

  const equipmentsInMaintenance = equipments.filter(eq => 
    eq.em_manutencao === true || 
    eq.status === 'aguardando_manutencao' || 
    eq.status === 'em_manutencao' ||
    eq.status === 'manutencao'
  );
  const equipmentsInMaintenanceCount = ensureValidNumber(equipmentsInMaintenance.length);

  // Statistics for filtered company
  const isCompanyFiltered = selectedCompany !== 'all';
  const selectedCompanyData = isCompanyFiltered ? companies.find(c => c.id === selectedCompany) : null;
  const filteredCompanyEquipments = isCompanyFiltered ? equipments : [];
  const filteredCompanyTotal = ensureValidNumber(filteredCompanyEquipments.length);
  const filteredCompanyInStock = ensureValidNumber(filteredCompanyEquipments.filter(eq => !eq.data_saida).length);
  const filteredCompanyWithdrawn = ensureValidNumber(filteredCompanyTotal - filteredCompanyInStock);

  // Check if filtered company is TACOM
  const isTacomFiltered = selectedCompanyData && tacomCompany && selectedCompanyData.id === tacomCompany.id;

  // Data for pie chart
  const pieChartData = validateChartData(
    equipments
      .filter(eq => !eq.data_saida && eq.tipo)
      .reduce((acc: any[], equipment) => {
        const existing = acc.find(item => item.name === equipment.tipo);
        if (existing) {
          existing.value = ensureValidNumber(existing.value + 1);
        } else {
          acc.push({ 
            name: equipment.tipo, 
            value: ensureValidNumber(1), 
            color: `hsl(${acc.length * 45 % 360}, 70%, 50%)` 
          });
        }
        return acc;
      }, [])
      .sort((a, b) => b.value - a.value)
  );

  // Maintenance types data
  const maintenanceTypesData = validateChartData(
    equipmentsInMaintenance.reduce((acc: any[], equipment) => {
      const recentMaintenance = maintenanceMovements
        .filter(mov => mov.id_equipamento === equipment.id)
        .sort((a, b) => new Date(b.data_criacao || '').getTime() - new Date(a.data_criacao || '').getTime())[0];
      
      let tipo = 'Tipo não especificado';
      
      if (recentMaintenance?.tipos_manutencao?.descricao) {
        tipo = recentMaintenance.tipos_manutencao.descricao;
      } else if (recentMaintenance?.detalhes_manutencao) {
        tipo = recentMaintenance.detalhes_manutencao;
      } else if (equipment.status === 'aguardando_manutencao') {
        tipo = 'Aguardando Manutenção';
      } else if (equipment.status === 'em_manutencao' || equipment.status === 'manutencao') {
        tipo = 'Em Manutenção';
      }
      
      const existing = acc.find(item => item.name === tipo);
      if (existing) {
        existing.value = ensureValidNumber(existing.value + 1);
      } else {
        acc.push({ 
          name: tipo, 
          value: ensureValidNumber(1), 
          color: `hsl(${acc.length * 45 % 360}, 70%, 50%)` 
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.value - a.value)
  );

  return {
    totalEquipments,
    inStockEquipments,
    equipmentsInMaintenanceCount,
    isCompanyFiltered,
    selectedCompanyData,
    filteredCompanyTotal,
    filteredCompanyInStock,
    filteredCompanyWithdrawn,
    isTacomFiltered,
    pieChartData,
    maintenanceTypesData,
    ensureValidNumber
  };
};
