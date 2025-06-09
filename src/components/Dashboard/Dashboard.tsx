
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building, Database, TrendingUp, Package, Activity, Clock } from 'lucide-react';
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

const Dashboard: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
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

  // Calculate equipment performance data
  const equipmentsInUse = equipments.filter(eq => eq.status === 'em_uso').length;
  const equipmentsAvailable = equipments.filter(eq => eq.status === 'disponivel').length;

  // Calculate average usage time
  const calculateAverageUsageTime = () => {
    const usedEquipments = equipments.filter(eq => eq.data_saida);
    if (usedEquipments.length === 0) return { daily: 0, weekly: 0, monthly: 0 };

    const totalDays = usedEquipments.reduce((acc, eq) => {
      if (eq.data_entrada && eq.data_saida) {
        const start = new Date(eq.data_entrada);
        const end = new Date(eq.data_saida);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return acc + diffDays;
      }
      return acc;
    }, 0);

    const averageDays = totalDays / usedEquipments.length;
    return {
      daily: Math.round(averageDays * 10) / 10,
      weekly: Math.round((averageDays / 7) * 10) / 10,
      monthly: Math.round((averageDays / 30) * 10) / 10
    };
  };

  const averageUsage = calculateAverageUsageTime();

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

  // Performance pie chart data
  const performanceData = [
    { name: 'Em Uso', value: equipmentsInUse, color: '#2563EB' },
    { name: 'Disponível', value: equipmentsAvailable, color: '#16A34A' }
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
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
            <CardTitle className="text-sm font-medium">Desempenho dos Equipamentos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{equipmentsInUse}</div>
            <p className="text-xs text-muted-foreground">Em uso / {equipmentsAvailable} disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio de Uso</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{averageUsage.daily}</div>
            <p className="text-xs text-muted-foreground">dias de uso médio</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Desempenho dos Equipamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={performanceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Usage Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tempo Médio de Uso dos Equipamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Diário</span>
                <span className="text-lg font-bold text-blue-600">{averageUsage.daily} dias</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Semanal</span>
                <span className="text-lg font-bold text-green-600">{averageUsage.weekly} semanas</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Mensal</span>
                <span className="text-lg font-bold text-orange-600">{averageUsage.monthly} meses</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
