
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDown, Calendar, TrendingUp, TrendingDown, BarChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MonthlyData {
  month: string;
  entries: number;
  exits: number;
  totalEquipments: number;
  activeCompanies: number;
}

const MonthlyReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear().toString(),
    startMonth: '',
    endMonth: ''
  });

  useEffect(() => {
    loadMonthlyData();
  }, [filters]);

  const loadMonthlyData = async () => {
    try {
      setLoading(true);

      const startDate = filters.startMonth ? `${filters.year}-${filters.startMonth}-01` : `${filters.year}-01-01`;
      const endDate = filters.endMonth ? `${filters.year}-${filters.endMonth}-31` : `${filters.year}-12-31`;

      // Buscar movimentações do ano
      const { data: movements, error: movError } = await supabase
        .from('movimentacoes')
        .select('*')
        .gte('data_movimento', startDate)
        .lte('data_movimento', endDate);

      if (movError) throw movError;

      // Buscar equipamentos do ano
      const { data: equipments, error: equipError } = await supabase
        .from('equipamentos')
        .select('*')
        .gte('data_entrada', startDate)
        .lte('data_entrada', endDate);

      if (equipError) throw equipError;

      // Buscar empresas ativas no período
      const { data: companies, error: compError } = await supabase
        .from('empresas')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (compError) throw compError;

      // Processar dados por mês
      const monthlyDataMap: { [key: string]: MonthlyData } = {};
      
      // Inicializar meses
      const startMonthNum = filters.startMonth ? parseInt(filters.startMonth) : 1;
      const endMonthNum = filters.endMonth ? parseInt(filters.endMonth) : 12;
      
      for (let month = startMonthNum; month <= endMonthNum; month++) {
        const monthKey = `${filters.year}-${month.toString().padStart(2, '0')}`;
        const monthName = new Date(parseInt(filters.year), month - 1, 1).toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
        });
        
        monthlyDataMap[monthKey] = {
          month: monthName,
          entries: 0,
          exits: 0,
          totalEquipments: 0,
          activeCompanies: 0
        };
      }

      // Contar movimentações por mês
      movements?.forEach(movement => {
        const monthKey = movement.data_movimento.substring(0, 7); // YYYY-MM
        if (monthlyDataMap[monthKey]) {
          if (movement.tipo_movimento === 'entrada') {
            monthlyDataMap[monthKey].entries++;
          } else {
            monthlyDataMap[monthKey].exits++;
          }
        }
      });

      // Contar equipamentos por mês
      equipments?.forEach(equipment => {
        const monthKey = equipment.data_entrada.substring(0, 7); // YYYY-MM
        if (monthlyDataMap[monthKey]) {
          monthlyDataMap[monthKey].totalEquipments++;
        }
      });

      // Contar empresas ativas por mês
      companies?.forEach(company => {
        const monthKey = company.created_at.substring(0, 7); // YYYY-MM
        if (monthlyDataMap[monthKey]) {
          monthlyDataMap[monthKey].activeCompanies++;
        }
      });

      setMonthlyData(Object.values(monthlyDataMap));
    } catch (error) {
      console.error('Erro ao carregar dados mensais:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatório mensal",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Mês', 'Entradas', 'Saídas', 'Total Equipamentos', 'Empresas Ativas'];
    const csvContent = [
      headers.join(','),
      ...monthlyData.map(data => [
        `"${data.month}"`,
        data.entries,
        data.exits,
        data.totalEquipments,
        data.activeCompanies
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_mensal_${filters.year}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Relatório mensal exportado com sucesso!",
    });
  };

  const totalEntries = monthlyData.reduce((sum, data) => sum + data.entries, 0);
  const totalExits = monthlyData.reduce((sum, data) => sum + data.exits, 0);
  const totalEquipments = monthlyData.reduce((sum, data) => sum + data.totalEquipments, 0);
  const totalCompanies = monthlyData.reduce((sum, data) => sum + data.activeCompanies, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando relatório mensal...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Relatório Mensal</h1>
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
              <Label htmlFor="year">Ano</Label>
              <Input
                id="year"
                type="number"
                value={filters.year}
                onChange={(e) => setFilters({...filters, year: e.target.value})}
                min="2020"
                max="2030"
              />
            </div>
            <div>
              <Label htmlFor="startMonth">Mês Inicial</Label>
              <Input
                id="startMonth"
                type="number"
                placeholder="1-12"
                value={filters.startMonth}
                onChange={(e) => setFilters({...filters, startMonth: e.target.value})}
                min="1"
                max="12"
              />
            </div>
            <div>
              <Label htmlFor="endMonth">Mês Final</Label>
              <Input
                id="endMonth"
                type="number"
                placeholder="1-12"
                value={filters.endMonth}
                onChange={(e) => setFilters({...filters, endMonth: e.target.value})}
                min="1"
                max="12"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo Anual */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Entradas</p>
                <p className="text-2xl font-bold text-green-600">{totalEntries}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Saídas</p>
                <p className="text-2xl font-bold text-red-600">{totalExits}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Equipamentos</p>
                <p className="text-2xl font-bold">{totalEquipments}</p>
              </div>
              <BarChart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Novas Empresas</p>
                <p className="text-2xl font-bold">{totalCompanies}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Mensais - {filters.year}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Mês</th>
                  <th className="text-left p-3">Entradas</th>
                  <th className="text-left p-3">Saídas</th>
                  <th className="text-left p-3">Saldo</th>
                  <th className="text-left p-3">Total Equipamentos</th>
                  <th className="text-left p-3">Novas Empresas</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((data, index) => {
                  const balance = data.entries - data.exits;
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{data.month}</td>
                      <td className="p-3">
                        <span className="text-green-600 font-semibold">+{data.entries}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-red-600 font-semibold">-{data.exits}</span>
                      </td>
                      <td className="p-3">
                        <span className={`font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {balance >= 0 ? '+' : ''}{balance}
                        </span>
                      </td>
                      <td className="p-3">{data.totalEquipments}</td>
                      <td className="p-3">{data.activeCompanies}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {monthlyData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum dado encontrado para o período selecionado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyReport;
