
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Package, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface InventoryData {
  totalEquipments: number;
  inStock: number;
  outOfStock: number;
  companies: number;
  equipmentsByType: { [key: string]: number };
  equipmentsByCompany: { [key: string]: number };
}

const InventoryReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<InventoryData>({
    totalEquipments: 0,
    inStock: 0,
    outOfStock: 0,
    companies: 0,
    equipmentsByType: {},
    equipmentsByCompany: {}
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    equipmentType: ''
  });

  useEffect(() => {
    loadInventoryData();
  }, [filters]);

  const loadInventoryData = async () => {
    try {
      setLoading(true);

      // Query base para equipamentos
      let equipmentQuery = supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name
          )
        `);

      // Aplicar filtros
      if (filters.startDate) {
        equipmentQuery = equipmentQuery.gte('data_entrada', filters.startDate);
      }
      if (filters.endDate) {
        equipmentQuery = equipmentQuery.lte('data_entrada', filters.endDate);
      }
      if (filters.equipmentType) {
        equipmentQuery = equipmentQuery.eq('tipo', filters.equipmentType);
      }

      const { data: equipments, error: equipError } = await equipmentQuery;

      if (equipError) throw equipError;

      // Contar empresas
      const { data: companies, error: compError } = await supabase
        .from('empresas')
        .select('id');

      if (compError) throw compError;

      // Processar dados
      const totalEquipments = equipments?.length || 0;
      const inStock = equipments?.filter(eq => !eq.data_saida).length || 0;
      const outOfStock = equipments?.filter(eq => eq.data_saida).length || 0;

      // Agrupar por tipo
      const equipmentsByType: { [key: string]: number } = {};
      equipments?.forEach(eq => {
        equipmentsByType[eq.tipo] = (equipmentsByType[eq.tipo] || 0) + 1;
      });

      // Agrupar por empresa
      const equipmentsByCompany: { [key: string]: number } = {};
      equipments?.forEach(eq => {
        const companyName = eq.empresas?.name || 'Sem empresa';
        equipmentsByCompany[companyName] = (equipmentsByCompany[companyName] || 0) + 1;
      });

      setInventoryData({
        totalEquipments,
        inStock,
        outOfStock,
        companies: companies?.length || 0,
        equipmentsByType,
        equipmentsByCompany
      });
    } catch (error) {
      console.error('Erro ao carregar dados de estoque:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatório de estoque",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['Relatório de Estoque'],
      [''],
      ['Resumo Geral'],
      ['Total de Equipamentos', inventoryData.totalEquipments],
      ['Em Estoque', inventoryData.inStock],
      ['Retirados', inventoryData.outOfStock],
      ['Total de Empresas', inventoryData.companies],
      [''],
      ['Equipamentos por Tipo'],
      ...Object.entries(inventoryData.equipmentsByType).map(([type, count]) => [type, count]),
      [''],
      ['Equipamentos por Empresa'],
      ...Object.entries(inventoryData.equipmentsByCompany).map(([company, count]) => [company, count]),
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_estoque_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Relatório de estoque exportado com sucesso!",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando relatório de estoque...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Estoque</h1>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="equipmentType">Tipo de Equipamento</Label>
              <Input
                id="equipmentType"
                placeholder="Ex: Notebook, Desktop..."
                value={filters.equipmentType}
                onChange={(e) => setFilters({...filters, equipmentType: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Equipamentos</p>
                <p className="text-2xl font-bold">{inventoryData.totalEquipments}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Estoque</p>
                <p className="text-2xl font-bold text-green-600">{inventoryData.inStock}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Retirados</p>
                <p className="text-2xl font-bold text-red-600">{inventoryData.outOfStock}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Empresas Cadastradas</p>
                <p className="text-2xl font-bold">{inventoryData.companies}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipamentos por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Equipamentos por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(inventoryData.equipmentsByType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{type}</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {count} unidades
                </span>
              </div>
            ))}
            {Object.keys(inventoryData.equipmentsByType).length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhum equipamento encontrado</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Equipamentos por Empresa */}
      <Card>
        <CardHeader>
          <CardTitle>Equipamentos por Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(inventoryData.equipmentsByCompany).map(([company, count]) => (
              <div key={company} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{company}</span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  {count} equipamentos
                </span>
              </div>
            ))}
            {Object.keys(inventoryData.equipmentsByCompany).length === 0 && (
              <p className="text-gray-500 text-center py-4">Nenhuma empresa encontrada</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryReport;
