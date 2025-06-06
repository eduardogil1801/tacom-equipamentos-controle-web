
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EquipmentData {
  tipo: string;
  modelo?: string;
  status: string;
  count: number;
}

const EquipmentDistributionReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [equipmentData, setEquipmentData] = useState<EquipmentData[]>([]);
  const [filters, setFilters] = useState({
    tipo: '',
    status: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('equipamentos')
        .select('tipo, modelo, status');

      if (filters.tipo && filters.tipo !== 'all') {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Processar dados para contagem
      const processedData = data?.reduce((acc: EquipmentData[], equipment) => {
        const key = `${equipment.tipo}${equipment.modelo ? ` ${equipment.modelo}` : ''}`;
        const existing = acc.find(item => item.tipo === key && item.status === equipment.status);
        
        if (existing) {
          existing.count += 1;
        } else {
          acc.push({
            tipo: key,
            modelo: equipment.modelo,
            status: equipment.status || 'N/A',
            count: 1
          });
        }
        return acc;
      }, []) || [];

      setEquipmentData(processedData);
    } catch (error) {
      console.error('Erro ao carregar distribuição de equipamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatório de distribuição",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Tipo/Modelo', 'Status', 'Quantidade'];
    const csvContent = [
      headers.join(','),
      ...equipmentData.map(item => [
        `"${item.tipo}"`,
        `"${item.status}"`,
        item.count
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_distribuicao_equipamentos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Relatório de distribuição exportado com sucesso!",
    });
  };

  // Dados para gráfico de barras
  const chartData = equipmentData.reduce((acc: any[], item) => {
    const existing = acc.find(d => d.tipo === item.tipo);
    if (existing) {
      existing[item.status] = (existing[item.status] || 0) + item.count;
    } else {
      acc.push({ tipo: item.tipo, [item.status]: item.count });
    }
    return acc;
  }, []);

  // Dados para gráfico de pizza por status
  const statusData = equipmentData.reduce((acc: any[], item) => {
    const existing = acc.find(d => d.name === item.status);
    if (existing) {
      existing.value += item.count;
    } else {
      acc.push({ name: item.status, value: item.count });
    }
    return acc;
  }, []);

  const COLORS = ['#DC2626', '#16A34A', '#2563EB', '#CA8A04', '#9333EA', '#C2410C'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando relatório de distribuição...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Distribuição de Equipamentos</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select value={filters.tipo || 'all'} onValueChange={(value) => setFilters({...filters, tipo: value === 'all' ? '' : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="CCIT 4.0">CCIT 4.0</SelectItem>
                  <SelectItem value="CCIT 5.0">CCIT 5.0</SelectItem>
                  <SelectItem value="PM (Painel de Motorista)">PM (Painel de Motorista)</SelectItem>
                  <SelectItem value="UPEX">UPEX</SelectItem>
                  <SelectItem value="Connections 4.0">Connections 4.0</SelectItem>
                  <SelectItem value="Connections 5.0">Connections 5.0</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({...filters, status: value === 'all' ? '' : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="recuperados">Recuperados</SelectItem>
                  <SelectItem value="aguardando_despacho_contagem">Aguardando Despacho</SelectItem>
                  <SelectItem value="enviados_manutencao_contagem">Enviados Manutenção</SelectItem>
                  <SelectItem value="aguardando_manutencao">Aguardando Manutenção</SelectItem>
                  <SelectItem value="em_uso">Em Uso</SelectItem>
                  <SelectItem value="danificado">Danificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Tipo/Modelo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="tipo" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="disponivel" fill="#16A34A" name="Disponível" />
                <Bar dataKey="recuperados" fill="#2563EB" name="Recuperados" />
                <Bar dataKey="em_uso" fill="#CA8A04" name="Em Uso" />
                <Bar dataKey="danificado" fill="#DC2626" name="Danificado" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Resumo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Resumo por Tipo/Modelo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Tipo/Modelo</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Quantidade</th>
                </tr>
              </thead>
              <tbody>
                {equipmentData
                  .sort((a, b) => b.count - a.count)
                  .map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{item.tipo}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                        item.status === 'danificado' ? 'bg-red-100 text-red-800' :
                        item.status === 'em_uso' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="p-3 text-2xl font-bold text-primary">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {equipmentData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum dado encontrado com os filtros selecionados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentDistributionReport;
