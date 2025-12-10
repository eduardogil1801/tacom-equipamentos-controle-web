import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FileDown, Package, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LabelList } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EquipmentData {
  tipo: string;
  modelo?: string;
  status: string;
  count: number;
}

const statusLabels: { [key: string]: string } = {
  'disponivel': 'Disponível',
  'em_uso': 'Em Uso',
  'manutencao': 'Manutenção',
  'aguardando_manutencao': 'Aguardando Manutenção',
  'danificado': 'Danificado',
  'indisponivel': 'Indisponível',
  'devolvido': 'Devolvido'
};

const statusColors: { [key: string]: string } = {
  'disponivel': '#16A34A',
  'em_uso': '#DC2626',
  'manutencao': '#CA8A04',
  'aguardando_manutencao': '#F59E0B',
  'danificado': '#EF4444',
  'indisponivel': '#9333EA',
  'devolvido': '#6B7280'
};

const EquipmentDistributionReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [equipmentData, setEquipmentData] = useState<EquipmentData[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('equipamentos')
        .select('tipo, modelo, status');

      if (error) throw error;

      // Extrair tipos e status únicos
      const types = [...new Set(data?.map(eq => `${eq.tipo}${eq.modelo ? ` ${eq.modelo}` : ''}`) || [])].sort();
      const statuses = [...new Set(data?.map(eq => eq.status).filter(Boolean) || [])].sort();
      
      setAvailableTypes(types);
      setAvailableStatuses(statuses);

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

  // Filtrar dados baseado nas seleções
  const filteredData = useMemo(() => {
    let filtered = equipmentData;
    
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(item => selectedTypes.includes(item.tipo));
    }
    
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(item => selectedStatuses.includes(item.status));
    }
    
    return filtered;
  }, [equipmentData, selectedTypes, selectedStatuses]);

  const exportToCSV = () => {
    const headers = ['Tipo/Modelo', 'Status', 'Quantidade'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(item => [
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

  // Dados para gráfico de barras horizontais por status
  const statusChartData = useMemo(() => {
    const grouped = filteredData.reduce((acc: { [key: string]: number }, item) => {
      const statusLabel = statusLabels[item.status] || item.status;
      acc[statusLabel] = (acc[statusLabel] || 0) + item.count;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // Dados para gráfico de barras por tipo
  const chartData = useMemo(() => {
    return filteredData.reduce((acc: any[], item) => {
      const existing = acc.find(d => d.tipo === item.tipo);
      if (existing) {
        existing[item.status] = (existing[item.status] || 0) + item.count;
      } else {
        acc.push({ tipo: item.tipo, [item.status]: item.count });
      }
      return acc;
    }, []).sort((a, b) => {
      const totalA = Object.values(a).filter(v => typeof v === 'number').reduce((sum: number, v) => sum + (v as number), 0);
      const totalB = Object.values(b).filter(v => typeof v === 'number').reduce((sum: number, v) => sum + (v as number), 0);
      return totalB - totalA;
    });
  }, [filteredData]);

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Distribuição de Equipamentos por Status</h1>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros com Multi-Select */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro de Tipos */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tipos de Equipamento</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedTypes.length === 0 
                      ? 'Todos os tipos' 
                      : `${selectedTypes.length} tipo(s) selecionado(s)`}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setSelectedTypes([])}
                    >
                      Limpar seleção
                    </Button>
                    {availableTypes.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`type-${type}`}
                          checked={selectedTypes.includes(type)}
                          onCheckedChange={() => toggleType(type)}
                        />
                        <label 
                          htmlFor={`type-${type}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Filtro de Status */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedStatuses.length === 0 
                      ? 'Todos os status' 
                      : `${selectedStatuses.length} status selecionado(s)`}
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setSelectedStatuses([])}
                    >
                      Limpar seleção
                    </Button>
                    {availableStatuses.map(status => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`status-${status}`}
                          checked={selectedStatuses.includes(status)}
                          onCheckedChange={() => toggleStatus(status)}
                        />
                        <label 
                          htmlFor={`status-${status}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {statusLabels[status] || status}
                        </label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quantidade por Tipo de Equipamento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="tipo" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={11}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {availableStatuses.map((status) => (
                  <Bar 
                    key={status} 
                    dataKey={status} 
                    fill={statusColors[status] || '#8884d8'} 
                    name={statusLabels[status] || status}
                    stackId="a"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Barras Horizontal por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Total de Equipamentos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={statusChartData} 
                layout="vertical"
                margin={{ left: 20, right: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar 
                  dataKey="value" 
                  fill="#3B82F6" 
                  radius={[0, 4, 4, 0]}
                >
                  <LabelList dataKey="value" position="right" fill="#374151" fontSize={12} />
                </Bar>
              </BarChart>
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
                {filteredData
                  .sort((a, b) => b.count - a.count)
                  .map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{item.tipo}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                        item.status === 'danificado' ? 'bg-red-100 text-red-800' :
                        item.status === 'em_uso' ? 'bg-red-100 text-red-800' :
                        item.status === 'indisponivel' ? 'bg-purple-100 text-purple-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {statusLabels[item.status] || item.status}
                      </span>
                    </td>
                    <td className="p-3 text-2xl font-bold text-primary">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length === 0 && (
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
