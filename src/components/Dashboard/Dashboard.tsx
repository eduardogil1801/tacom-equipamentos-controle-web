
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Building, Database, TrendingUp, Package, MapPin, Upload, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { updateAllCompaniesState } from '@/utils/updateCompaniesState';
import { insertCcitEquipmentsWithDuplicateCheck } from '@/utils/insertCcitEquipments';
import DashboardFilters from './DashboardFilters';

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
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingBulkOperations, setProcessingBulkOperations] = useState(false);

  // Filter states
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [serialSearch, setSerialSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [equipments, selectedCompany, selectedState, selectedStatus, selectedType, serialSearch]);

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

  const applyFilters = () => {
    let filtered = [...equipments];

    if (selectedCompany) {
      filtered = filtered.filter(eq => eq.id_empresa === selectedCompany);
    }

    if (selectedState) {
      filtered = filtered.filter(eq => 
        eq.estado === selectedState || eq.empresas?.estado === selectedState
      );
    }

    if (selectedStatus) {
      filtered = filtered.filter(eq => eq.status === selectedStatus);
    }

    if (selectedType) {
      filtered = filtered.filter(eq => eq.tipo === selectedType);
    }

    if (serialSearch) {
      filtered = filtered.filter(eq => 
        eq.numero_serie.toLowerCase().includes(serialSearch.toLowerCase())
      );
    }

    setFilteredEquipments(filtered);
  };

  const clearFilters = () => {
    setSelectedCompany('');
    setSelectedState('');
    setSelectedStatus('');
    setSelectedType('');
    setSerialSearch('');
  };

  const handleUpdateCompaniesState = async () => {
    setProcessingBulkOperations(true);
    try {
      await updateAllCompaniesState();
      toast({
        title: "Sucesso",
        description: "Estado de todas as empresas atualizado para Rio Grande do Sul!",
      });
      loadData();
    } catch (error) {
      console.error('Error updating companies state:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar estado das empresas.",
        variant: "destructive",
      });
    } finally {
      setProcessingBulkOperations(false);
    }
  };

  const handleInsertCcitEquipments = async () => {
    setProcessingBulkOperations(true);
    try {
      const result = await insertCcitEquipmentsWithDuplicateCheck();
      toast({
        title: "Sucesso",
        description: `${result.inserted} equipamentos CCIT 5.0 inseridos com sucesso! (${result.duplicates} duplicatas ignoradas)`,
      });
      loadData();
    } catch (error) {
      console.error('Error inserting CCIT equipments:', error);
      toast({
        title: "Erro",
        description: "Erro ao inserir equipamentos CCIT 5.0.",
        variant: "destructive",
      });
    } finally {
      setProcessingBulkOperations(false);
    }
  };

  // Calculate statistics based on filtered data
  const totalEquipments = filteredEquipments.length;
  const inStockEquipments = filteredEquipments.filter(eq => !eq.data_saida).length;
  const outEquipments = filteredEquipments.filter(eq => eq.data_saida).length;
  const totalCompanies = companies.length;

  // Data for equipment by state (filtered)
  const stateData = filteredEquipments.reduce((acc: any[], equipment) => {
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

  // Data for company equipment chart (filtered)
  const companyData = companies.map(company => {
    const companyEquipments = filteredEquipments.filter(eq => eq.id_empresa === company.id);
    return {
      name: company.name,
      total: companyEquipments.length,
      inStock: companyEquipments.filter(eq => !eq.data_saida).length
    };
  }).filter(item => item.total > 0).sort((a, b) => b.total - a.total);

  // Data for pie chart (filtered)
  const pieData = [
    { name: 'Em Estoque', value: inStockEquipments, color: '#16A34A' },
    { name: 'Retirados', value: outEquipments, color: '#DC2626' }
  ];

  // Equipment types data (filtered)
  const typeData = filteredEquipments.reduce((acc: any[], equipment) => {
    const existing = acc.find(item => item.type === equipment.tipo);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ type: equipment.tipo, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.count - a.count);

  // Get unique states for stats (filtered)
  const uniqueStates = [...new Set(filteredEquipments.map(eq => eq.estado || eq.empresas?.estado).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <Button 
            onClick={handleUpdateCompaniesState}
            disabled={processingBulkOperations}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            {processingBulkOperations ? 'Atualizando...' : 'Atualizar Estado Empresas'}
          </Button>
          <Button 
            onClick={handleInsertCcitEquipments}
            disabled={processingBulkOperations}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {processingBulkOperations ? 'Inserindo...' : 'Inserir CCIT 5.0'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <DashboardFilters
        companies={companies}
        selectedCompany={selectedCompany}
        selectedState={selectedState}
        selectedStatus={selectedStatus}
        selectedType={selectedType}
        serialSearch={serialSearch}
        onCompanyChange={setSelectedCompany}
        onStateChange={setSelectedState}
        onStatusChange={setSelectedStatus}
        onTypeChange={setSelectedType}
        onSerialSearchChange={setSerialSearch}
        onClearFilters={clearFilters}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Equipamentos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalEquipments}</div>
            <p className="text-xs text-muted-foreground">
              {totalEquipments === equipments.length ? 'Equipamentos cadastrados' : 'Equipamentos filtrados'}
            </p>
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
            <CardTitle className="text-sm font-medium">Estados</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{uniqueStates.length}</div>
            <p className="text-xs text-muted-foreground">Estados com equipamentos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment by State */}
        <Card>
          <CardHeader>
            <CardTitle>Equipamentos por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="estado" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#DC2626" name="Total" />
                <Bar dataKey="emEstoque" fill="#16A34A" name="Em Estoque" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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
