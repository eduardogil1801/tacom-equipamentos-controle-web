import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Building, Database, TrendingUp, Package, Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DashboardFilters from './DashboardFilters';
import EquipmentByCompanyChart from './EquipmentByCompanyChart';
import EquipmentTypesByCompanyChart from './EquipmentTypesByCompanyChart';

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

const Dashboard: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [maintenanceMovements, setMaintenanceMovements] = useState<MaintenanceMovement[]>([]);
  const [tacomCompany, setTacomCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('all');

  // Helper function to ensure valid numbers for charts - enhanced version
  const ensureValidNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return 0;
    return Math.max(0, Math.floor(num)); // Ensure positive integers for counts
  };

  // Helper function to validate chart data
  const validateChartData = (data: any[]): any[] => {
    return data
      .filter(item => item && typeof item === 'object')
      .map(item => {
        const validatedItem = { ...item };
        
        // Validate all numeric properties
        Object.keys(validatedItem).forEach(key => {
          if (typeof validatedItem[key] === 'number' || 
              (typeof validatedItem[key] === 'string' && !isNaN(Number(validatedItem[key])))) {
            validatedItem[key] = ensureValidNumber(validatedItem[key]);
          }
        });
        
        return validatedItem;
      })
      .filter(item => {
        // Filter out items where all numeric values are 0 (likely invalid data)
        const numericValues = Object.values(item).filter(val => typeof val === 'number');
        return numericValues.length === 0 || numericValues.some(val => val > 0);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedCompany, selectedEquipmentType, allEquipments]);

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

      // Find Tacom company
      const tacom = companiesData?.find(company => 
        company.name.toLowerCase().includes('tacom') && 
        company.name.toLowerCase().includes('sistemas') && 
        company.name.toLowerCase().includes('poa')
      );
      setTacomCompany(tacom || null);
      console.log('TACOM company found:', tacom);

      // Load ALL equipments with company data - FIXED: usando data_entrada em vez de data_entrance
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
        .eq('tipo_movimento', 'manutencao');

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

  const applyFilters = () => {
    let filteredEquipments = [...allEquipments];

    // Filtrar por empresa
    if (selectedCompany !== 'all') {
      filteredEquipments = filteredEquipments.filter(eq => eq.id_empresa === selectedCompany);
    }

    // Filtrar por tipo de equipamento
    if (selectedEquipmentType !== 'all') {
      filteredEquipments = filteredEquipments.filter(eq => eq.tipo === selectedEquipmentType);
    }

    console.log('Filtered equipments:', filteredEquipments.length);
    setEquipments(filteredEquipments);
  };

  // Calculate statistics - Enhanced with better validation
  const totalEquipments = ensureValidNumber(allEquipments.length);
  
  // Em Estoque = equipamentos da TACOM que não saíram (sem data_saida)
  const tacomEquipmentsInStock = tacomCompany 
    ? allEquipments.filter(eq => eq.id_empresa === tacomCompany.id && !eq.data_saida)
    : [];
  const inStockEquipments = ensureValidNumber(tacomEquipmentsInStock.length);

  // Equipamentos atualmente em manutenção
  const equipmentsInMaintenance = equipments.filter(eq => 
    eq.em_manutencao === true || 
    eq.status === 'aguardando_manutencao' || 
    eq.status === 'em_manutencao'
  );
  const equipmentsInMaintenanceCount = ensureValidNumber(equipmentsInMaintenance.length);

  // Data for company equipment chart - Enhanced validation with Total
  const companyData = validateChartData(
    companies
      .map(company => {
        const companyEquipments = allEquipments.filter(eq => eq.id_empresa === company.id);
        const total = ensureValidNumber(companyEquipments.length);
        const emEstoque = ensureValidNumber(companyEquipments.filter(eq => !eq.data_saida).length);
        const retirados = ensureValidNumber(total - emEstoque);
        
        return {
          name: company.name.length > 25 ? company.name.substring(0, 25) + '...' : company.name,
          fullName: company.name,
          'Em Estoque': emEstoque,
          'Retirados': retirados,
          'Total': total,
          total
        };
      })
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 15)
  );

  console.log('Company chart data (validated):', companyData);

  // Data for equipment types chart - Enhanced validation
  const equipmentTypeData = validateChartData(
    equipments
      .filter(eq => !eq.data_saida && eq.tipo) // Apenas equipamentos em estoque
      .reduce((acc: any[], equipment) => {
        if (!equipment.tipo) return acc;
        
        const existing = acc.find(item => item.tipo === equipment.tipo);
        if (existing) {
          existing.quantidade = ensureValidNumber(existing.quantidade + 1);
        } else {
          acc.push({ 
            tipo: equipment.tipo, 
            quantidade: ensureValidNumber(1),
            empresa: equipment.empresas?.name
          });
        }
        return acc;
      }, [])
      .sort((a, b) => b.quantidade - a.quantidade)
  );

  console.log('Equipment type chart data (validated):', equipmentTypeData);

  // Data for pie chart - Enhanced validation
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

  // Maintenance types data - Enhanced validation
  const maintenanceTypesData = validateChartData(
    equipmentsInMaintenance.reduce((acc: any[], equipment) => {
      const recentMaintenance = maintenanceMovements
        .filter(mov => mov.id_equipamento === equipment.id)
        .sort((a, b) => new Date(b.data_criacao || '').getTime() - new Date(a.data_criacao || '').getTime())[0];
      
      const tipo = recentMaintenance?.tipos_manutencao?.descricao || 
                   recentMaintenance?.detalhes_manutencao || 
                   'Tipo não especificado';
      
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

  const selectedCompanyName = companies.find(c => c.id === selectedCompany)?.name;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Filtros */}
      <DashboardFilters
        companies={companies}
        equipmentTypes={equipmentTypes}
        selectedCompany={selectedCompany}
        selectedEquipmentType={selectedEquipmentType}
        onCompanyChange={setSelectedCompany}
        onEquipmentTypeChange={setSelectedEquipmentType}
        onRefresh={loadData}
        loading={loading}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Equipamentos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalEquipments.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              Equipamentos cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{inStockEquipments.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              Equipamentos na TACOM SISTEMAS POA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{equipmentsInMaintenanceCount.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">Equipamentos em manutenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Equipment Chart */}
        <EquipmentByCompanyChart data={companyData} />

        {/* Equipment Types Chart */}
        <EquipmentTypesByCompanyChart data={equipmentTypeData} />
      </div>

      {/* Additional Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Types in Stock Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${ensureValidNumber(value).toLocaleString('pt-BR')}`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [ensureValidNumber(value).toLocaleString('pt-BR'), '']} 
                    labelFormatter={(label) => String(label || '')}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum equipamento encontrado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maintenance Types Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Equipamentos em Manutenção por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {maintenanceTypesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={maintenanceTypesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${ensureValidNumber(value)}`}
                  >
                    {maintenanceTypesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [ensureValidNumber(value), '']} 
                    labelFormatter={(label) => String(label || '')}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum equipamento em manutenção</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
