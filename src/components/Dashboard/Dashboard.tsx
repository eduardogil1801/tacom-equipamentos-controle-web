
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building, Database, TrendingUp, Package, Wrench, AlertTriangle } from 'lucide-react';
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
      
      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('empresas')
        .select('*')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Load equipments with company data
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

      if (equipmentsError) throw equipmentsError;
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

      if (maintenanceError) throw maintenanceError;
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

  // Data for company equipment chart
  const companyData = companies.map(company => ({
    name: company.name,
    total: equipments.filter(eq => eq.id_empresa === company.id).length,
    inStock: equipments.filter(eq => eq.id_empresa === company.id && !eq.data_saida).length
  })).filter(item => item.total > 0).sort((a, b) => b.total - a.total);

  // Data for pie chart
  const pieData = [
    { name: 'Em Estoque', value: inStockEquipments, color: '#16A34A' },
    { name: 'Retirados', value: outEquipments, color: '#DC2626' }
  ];

  // Maintenance types data
  const maintenanceTypesData = maintenanceMovements.reduce((acc: any[], movement) => {
    const tipo = movement.tipos_manutencao?.descricao || 'Não especificado';
    const existing = acc.find(item => item.type === tipo);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ type: tipo, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.count - a.count);

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
    <div className="space-y-6">
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance Types Chart */}
        {maintenanceTypesData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Manutenção</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={maintenanceTypesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ type, count }) => `${type}: ${count}`}
                  >
                    {maintenanceTypesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 45}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

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
      </div>

      {/* Equipment by Company */}
      {companyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Equipamentos por Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={companyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#DC2626" name="Total" />
                <Bar dataKey="inStock" fill="#16A34A" name="Em Estoque" />
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
