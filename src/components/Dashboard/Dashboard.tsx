
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

      // Load ALL equipments with company data - NO LIMITS
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
  const equipmentsInMaintenance = equipments.filter(eq => 
    eq.em_manutencao === true || 
    eq.status === 'aguardando_manutencao' || 
    eq.status === 'em_manutencao'
  ).length;

  console.log('Equipment stats:', { totalEquipments, inStockEquipments, outEquipments, equipmentsInMaintenance });

  // Data for company equipment chart - ALL companies, sorted by total (descending)
  const companyData = companies.map(company => {
    const companyEquipments = equipments.filter(eq => eq.id_empresa === company.id);
    const total = companyEquipments.length;
    const emEstoque = companyEquipments.filter(eq => !eq.data_saida).length;
    const retirados = total - emEstoque;
    
    return {
      name: company.name.length > 25 ? company.name.substring(0, 25) + '...' : company.name,
      fullName: company.name,
      total,
      emEstoque,
      retirados
    };
  }).filter(item => item.total > 0)
    .sort((a, b) => b.total - a.total); // Sort by total descending

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
            <div className="text-2xl font-bold text-primary">{totalEquipments.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">Equipamentos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{inStockEquipments.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">Disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retirados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{outEquipments.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">Fora do estoque</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalCompanies.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">Empresas cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{equipmentsInMaintenance.toLocaleString('pt-BR')}</div>
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
                  label={({ name, value }) => `${name}: ${value.toLocaleString('pt-BR')}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [Number(value).toLocaleString('pt-BR'), '']} />
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

      {/* Equipment by Company - Horizontal stacked bar chart with companies on Y axis */}
      {companyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Equipamentos por Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(500, companyData.length * 30)}>
              <BarChart 
                data={companyData} 
                layout="horizontal"
                margin={{ top: 20, right: 30, left: 200, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={190}
                  fontSize={11}
                  interval={0}
                />
                <Tooltip 
                  labelFormatter={(label) => {
                    const item = companyData.find(d => d.name === label);
                    return item ? item.fullName : label;
                  }}
                  formatter={(value, name) => [Number(value).toLocaleString('pt-BR'), name]}
                />
                <Bar dataKey="emEstoque" stackId="a" fill="#16A34A" name="Em Estoque" />
                <Bar dataKey="retirados" stackId="a" fill="#DC2626" name="Retirados" />
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
                <Tooltip formatter={(value) => [Number(value).toLocaleString('pt-BR'), 'Quantidade']} />
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
