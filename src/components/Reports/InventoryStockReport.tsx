
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDown, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface InventoryData {
  totalEquipments: number;
  available: number;
  moved: number;
  withdrawn: number;
  equipmentsByType: { [key: string]: { available: number; moved: number; withdrawn: number } };
}

const InventoryStockReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [inventoryData, setInventoryData] = useState<InventoryData>({
    totalEquipments: 0,
    available: 0,
    moved: 0,
    withdrawn: 0,
    equipmentsByType: {}
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

      let equipmentQuery = supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name
          )
        `);

      if (filters.startDate) {
        equipmentQuery = equipmentQuery.gte('data_entrada', filters.startDate);
      }
      if (filters.endDate) {
        equipmentQuery = equipmentQuery.lte('data_entrada', filters.endDate);
      }
      if (filters.equipmentType) {
        equipmentQuery = equipmentQuery.eq('tipo', filters.equipmentType);
      }

      const { data: equipments, error } = await equipmentQuery;

      if (error) throw error;

      const totalEquipments = equipments?.length || 0;
      const available = equipments?.filter(eq => eq.status === 'disponivel').length || 0;
      const moved = equipments?.filter(eq => eq.status === 'em_uso').length || 0;
      const withdrawn = equipments?.filter(eq => eq.data_saida).length || 0;

      const equipmentsByType: { [key: string]: { available: number; moved: number; withdrawn: number } } = {};
      equipments?.forEach(eq => {
        if (!equipmentsByType[eq.tipo]) {
          equipmentsByType[eq.tipo] = { available: 0, moved: 0, withdrawn: 0 };
        }
        if (eq.status === 'disponivel') equipmentsByType[eq.tipo].available++;
        if (eq.status === 'em_uso') equipmentsByType[eq.tipo].moved++;
        if (eq.data_saida) equipmentsByType[eq.tipo].withdrawn++;
      });

      setInventoryData({
        totalEquipments,
        available,
        moved,
        withdrawn,
        equipmentsByType
      });
    } catch (error) {
      console.error('Erro ao carregar dados de inventário:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatório de inventário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['Relatório de Inventário de Equipamentos'],
      [''],
      ['Resumo Geral'],
      ['Total de Equipamentos', inventoryData.totalEquipments],
      ['Disponíveis', inventoryData.available],
      ['Movidos/Em Uso', inventoryData.moved],
      ['Retirados', inventoryData.withdrawn],
      [''],
      ['Inventário por Tipo'],
      ['Tipo', 'Disponíveis', 'Em Uso', 'Retirados'],
      ...Object.entries(inventoryData.equipmentsByType).map(([type, counts]) => [
        type, counts.available, counts.moved, counts.withdrawn
      ]),
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_equipamentos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Relatório de inventário exportado com sucesso!",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando relatório de inventário...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Inventário</h1>
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
                placeholder="Ex: CCIT 4.0, CCIT 5.0..."
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
                <p className="text-sm font-medium text-gray-600">Disponíveis</p>
                <p className="text-2xl font-bold text-green-600">{inventoryData.available}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Uso</p>
                <p className="text-2xl font-bold text-blue-600">{inventoryData.moved}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Retirados</p>
                <p className="text-2xl font-bold text-red-600">{inventoryData.withdrawn}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventário por Tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Inventário por Tipo de Equipamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Tipo de Equipamento</th>
                  <th className="text-left p-3">Disponíveis</th>
                  <th className="text-left p-3">Em Uso</th>
                  <th className="text-left p-3">Retirados</th>
                  <th className="text-left p-3">Total</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(inventoryData.equipmentsByType).map(([type, counts]) => (
                  <tr key={type} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{type}</td>
                    <td className="p-3">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                        {counts.available}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                        {counts.moved}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-sm">
                        {counts.withdrawn}
                      </span>
                    </td>
                    <td className="p-3 font-bold">
                      {counts.available + counts.moved + counts.withdrawn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {Object.keys(inventoryData.equipmentsByType).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum equipamento encontrado com os filtros selecionados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryStockReport;
