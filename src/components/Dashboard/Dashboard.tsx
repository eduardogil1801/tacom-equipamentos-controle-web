
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building, Database, TrendingUp, Package, Wrench } from 'lucide-react';
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

interface MaintenanceMovement {
  id: string;
  tipo_movimento: string;
  detalhes_manutencao?: string;
  tipos_manutencao?: {
    codigo: string;
    descricao: string;
  };
}

const Dashboard: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [maintenanceMovements, setMaintenanceMovements] = useState<MaintenanceMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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

      // Load ALL equipments with company data - removed any limits
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

  // Calculate statistics
  const totalEquipments = equipments.length;
  const inStockEquipments = equipments.filter(eq => !eq.data_saida).length;
  const outEquipments = equipments.filter(eq => eq.data_saida).length;
  const totalCompanies = companies.length;
  const equipmentsInMaintenance = equipments.filter(eq => eq.em_manutencao === true).length;

  console.log('Equipment stats:', { totalEquipments, inStockEquipments, outEquipments, equipmentsInMaintenance });

  // Data for equipment by state
  const stateData = equipments.reduce((acc: any[], equipment) => {
    const estado = equipment.estado || equipment.empresas?.estado || 'Não informado';
    const existing = acc.find(item => item.estado === estado);
    const inStock = !equipment.data_saida;
    
    if (existing) {
      existing.total += 1;
      if (inStock) existing.emEstoque += 1;
      else existing.retirados += 1;
    } else {
      acc.push({ 
        estado, 
        total: 1, 
        emEstoque: inStock ? 1 : 0,
        retirados: inStock ? 0 : 1
      });
    }
    return acc;
  }, []).sort((a, b) => b.total - a.total);

  // Data for company equipment chart - take top 15 companies for better visualization
  const companyData = companies.map(company => ({
    name: company.name,
    total: equipments.filter(eq => eq.id_empresa === company.id).length,
    inStock: equipments.filter(eq => eq.id_empresa === company.id && !eq.data_saida).length
  })).filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 15); // Show top 15 companies for better chart readability

  // Data for pie chart
  const pieData = [
    { name: 'Em Estoque', value: inStockEquipments, color: '#16A34A' },
    { name: 'Retirados', value: outEquipments, color: '#DC2626' }
  ];

  // Maintenance types data
  const maintenanceTypesData = maintenanceMovements.reduce((acc: any[], movement) => {
    const tipo = movement.tipos_manutencao?.descricao || movement.detalhes_manutencao || 'Não especificado';
    const existing = acc.find(item => item.name === tipo);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: tipo, value: 1, color: `hsl(${acc.length * 45}, 70%, 50%)` });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  console.log('Maintenance types data:', maintenanceTypesData);

  // Equipment types data
  const typeData = equipments.reduce((acc: any[], equipment) => {
    const existing = acc.find(item => item.type === equipment.tipo);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ type: equipment.tipo, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.count - a.count);

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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Equipamentos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalEquipments}</div>
            <p className="text-xs text-muted-foreground">Equipamentos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{inStockEquipments}</div>
            <p className="text-xs text-muted-foreground">Disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retirados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outEquipments}</div>
            <p className="text-xs text-muted-foreground">Fora do estoque</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalCompanies}</div>
            <p className="text-xs text-muted-foreground">Empresas cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{equipmentsInMaintenance}</div>
            <p className="text-xs text-muted-foreground">Equipamentos em manutenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Side by side layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Maintenance Types Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Equipamentos por Tipo de Manutenção</CardTitle>
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
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {maintenanceTypesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum dado de manutenção encontrado</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Equipment by Company - Changed to stacked bar chart as requested */}
      {companyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Equipamentos por Empresa (Top 15)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={companyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={10}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="inStock" stackId="a" fill="#16A34A" name="Em Estoque" />
                <Bar dataKey="total" stackId="a" fill="#DC2626" name="Retirados" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Equipment Types */}
      {typeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tipos de Equipamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="type" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#DC2626" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
