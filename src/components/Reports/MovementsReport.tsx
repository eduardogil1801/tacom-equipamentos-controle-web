
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, ArrowUpCircle, ArrowDownCircle, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Movement {
  id: string;
  tipo_movimento: string;
  data_movimento: string;
  observacoes: string;
  usuario_responsavel: string;
  equipamentos?: {
    tipo: string;
    numero_serie: string;
    empresas?: {
      name: string;
    };
  };
}

const MovementsReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    movementType: ''
  });

  useEffect(() => {
    loadMovements();
  }, [filters]);

  const loadMovements = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('movimentacoes')
        .select(`
          *,
          equipamentos (
            tipo,
            numero_serie,
            empresas (
              name
            )
          )
        `)
        .order('data_movimento', { ascending: false });

      // Aplicar filtros
      if (filters.startDate) {
        query = query.gte('data_movimento', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('data_movimento', filters.endDate);
      }
      if (filters.movementType) {
        query = query.eq('tipo_movimento', filters.movementType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatório de movimentações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Tipo', 'Equipamento', 'Série', 'Empresa', 'Observações', 'Usuário'];
    const csvContent = [
      headers.join(','),
      ...movements.map(movement => [
        new Date(movement.data_movimento).toLocaleDateString('pt-BR'),
        movement.tipo_movimento === 'entrada' ? 'Entrada' : 'Saída',
        movement.equipamentos?.tipo || 'N/A',
        movement.equipamentos?.numero_serie || 'N/A',
        movement.equipamentos?.empresas?.name || 'N/A',
        `"${movement.observacoes || ''}"`,
        movement.usuario_responsavel || 'Sistema'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_movimentacoes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Relatório de movimentações exportado com sucesso!",
    });
  };

  const totalEntradas = movements.filter(m => m.tipo_movimento === 'entrada').length;
  const totalSaidas = movements.filter(m => m.tipo_movimento === 'saida').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando relatório de movimentações...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Movimentações</h1>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          Exportar CSV ({movements.length} registros)
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
              <Label htmlFor="movementType">Tipo de Movimento</Label>
              <Select value={filters.movementType} onValueChange={(value) => setFilters({...filters, movementType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Movimentações</p>
                <p className="text-2xl font-bold">{movements.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entradas</p>
                <p className="text-2xl font-bold text-green-600">{totalEntradas}</p>
              </div>
              <ArrowUpCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saídas</p>
                <p className="text-2xl font-bold text-red-600">{totalSaidas}</p>
              </div>
              <ArrowDownCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Equipamento</th>
                  <th className="text-left p-3">Série</th>
                  <th className="text-left p-3">Empresa</th>
                  <th className="text-left p-3">Observações</th>
                  <th className="text-left p-3">Usuário</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(movement => (
                  <tr key={movement.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{new Date(movement.data_movimento).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        movement.tipo_movimento === 'entrada' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {movement.tipo_movimento === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="p-3">{movement.equipamentos?.tipo || 'N/A'}</td>
                    <td className="p-3 font-mono">{movement.equipamentos?.numero_serie || 'N/A'}</td>
                    <td className="p-3">{movement.equipamentos?.empresas?.name || 'N/A'}</td>
                    <td className="p-3">{movement.observacoes || '-'}</td>
                    <td className="p-3">{movement.usuario_responsavel || 'Sistema'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {movements.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma movimentação encontrada com os filtros selecionados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MovementsReport;
