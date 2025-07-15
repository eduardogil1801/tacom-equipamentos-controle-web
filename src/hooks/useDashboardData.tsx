
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

interface EquipmentType {
  id: string;
  nome: string;
  ativo: boolean;
}

interface MaintenanceType {
  id: string;
  codigo: string;
  descricao: string;
  ativo: boolean;
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

export const useDashboardData = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [maintenanceMovements, setMaintenanceMovements] = useState<MaintenanceMovement[]>([]);
  const [tacomCompany, setTacomCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data...');
      
      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('empresas')
        .select('*')
        .order('name');

      if (companiesError) {
        console.error('Error loading companies:', companiesError);
        throw companiesError;
      }
      console.log('Companies loaded:', companiesData?.length);
      setCompanies(companiesData || []);

      // Load equipment types
      const { data: equipmentTypesData, error: equipmentTypesError } = await supabase
        .from('tipos_equipamento')
        .select('id, nome, ativo')
        .eq('ativo', true)
        .order('nome');

      if (equipmentTypesError) {
        console.error('Error loading equipment types:', equipmentTypesError);
        throw equipmentTypesError;
      }
      setEquipmentTypes(equipmentTypesData || []);

      // Load maintenance types
      const { data: maintenanceTypesData, error: maintenanceTypesError } = await supabase
        .from('tipos_manutencao')
        .select('id, codigo, descricao, ativo')
        .eq('ativo', true)
        .order('codigo');

      if (maintenanceTypesError) {
        console.error('Error loading maintenance types:', maintenanceTypesError);
        throw maintenanceTypesError;
      }
      setMaintenanceTypes(maintenanceTypesData || []);

      // Find Tacom company
      const tacom = companiesData?.find(company => 
        company.name.toLowerCase().includes('tacom') && 
        company.name.toLowerCase().includes('sistemas') && 
        company.name.toLowerCase().includes('poa')
      );
      setTacomCompany(tacom || null);
      console.log('TACOM company found:', tacom);

      // Load ALL equipments with company data
      const { data: equipmentsData, error: equipmentsError } = await supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name,
            estado
          )
        `)
        .order('data_entrada', { ascending: false });

      if (equipmentsError) {
        console.error('Error loading equipments:', equipmentsError);
        throw equipmentsError;
      }
      console.log('Equipments loaded:', equipmentsData?.length);
      setAllEquipments(equipmentsData || []);
      setEquipments(equipmentsData || []);

      // Load maintenance movements
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          tipos_manutencao (
            codigo,
            descricao
          )
        `)
        .in('tipo_movimento', ['manutencao', 'aguardando_manutencao']);

      if (maintenanceError) {
        console.error('Error loading maintenance movements:', maintenanceError);
        throw maintenanceError;
      }
      console.log('Maintenance movements loaded:', maintenanceData?.length);
      setMaintenanceMovements(maintenanceData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (selectedCompany: string, selectedEquipmentType: string) => {
    let filteredEquipments = [...allEquipments];

    if (selectedCompany !== 'all') {
      filteredEquipments = filteredEquipments.filter(eq => eq.id_empresa === selectedCompany);
    }

    if (selectedEquipmentType !== 'all') {
      filteredEquipments = filteredEquipments.filter(eq => eq.tipo === selectedEquipmentType);
    }

    console.log('Filtered equipments:', filteredEquipments.length);
    setEquipments(filteredEquipments);
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    equipments,
    allEquipments,
    companies,
    equipmentTypes,
    maintenanceTypes,
    maintenanceMovements,
    tacomCompany,
    loading,
    loadData,
    applyFilters
  };
};
