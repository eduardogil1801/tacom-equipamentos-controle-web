
import React, { useState, useEffect } from 'react';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDown, History, Search, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EquipmentHistory {
  id: string;
  tipo: string;
  numero_serie: string;
  data_entrada: string;
  data_saida: string | null;
  estado: string | null;
  empresas?: {
    name: string;
  };
  movimentacoes: Array<{
    id: string;
    tipo_movimento: string;
    data_movimento: string;
    observacoes: string;
    usuario_responsavel: string;
  }>;
  totalDays: number;
  totalMovements: number;
}

const EquipmentHistoryReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [equipments, setEquipments] = useState<EquipmentHistory[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadEquipmentHistory();
  }, [filters]);

  const loadEquipmentHistory = async () => {
    try {
      setLoading(true);

      // Buscar equipamentos com movimentações
      let query = supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name
          ),
          movimentacoes (
            id,
            tipo_movimento,
            data_movimento,
            observacoes,
            usuario_responsavel
          )
        `)
        .order('data_entrada', { ascending: false });

      // Aplicar filtros
      if (filters.search) {
        query = query.or(`tipo.ilike.%${filters.search}%,numero_serie.ilike.%${filters.search}%`);
      }
      if (filters.startDate) {
        query = query.gte('data_entrada', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('data_entrada', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Processar dados para incluir estatísticas
      const processedEquipments = (data || []).map(equipment => {
        const entryDate = new Date(equipment.data_entrada);
        const exitDate = equipment.data_saida ? new Date(equipment.data_saida) : new Date();
        const totalDays = Math.floor((exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Ordenar movimentações por data
        const sortedMovements = (equipment.movimentacoes || []).sort((a, b) => 
          new Date(b.data_movimento).getTime() - new Date(a.data_movimento).getTime()
        );

        return {
          ...equipment,
          movimentacoes: sortedMovements,
          totalDays,
          totalMovements: sortedMovements.length
        };
      });

      setEquipments(processedEquipments);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar histórico de equipamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvData: string[] = [];
    
    // Cabeçalho
    csvData.push('Tipo,Série,Empresa,Data Entrada,Data Saída,Total Dias,Total Movimentações,Histórico de Movimentações');
    
    // Dados dos equipamentos
    equipments.forEach(equipment => {
      const movimentacoesText = equipment.movimentacoes
        .map(mov => `${formatDateForDisplay(mov.data_movimento)}: ${mov.tipo_movimento} - ${mov.observacoes || 'Sem observações'}`)
        .join(' | ');
      
      csvData.push([
        `"${equipment.tipo}"`,
        `"${equipment.numero_serie}"`,
        `"${equipment.empresas?.name || 'N/A'}"`,
        new Date(equipment.data_entrada).toLocaleDateString('pt-BR'),
        equipment.data_saida ? new Date(equipment.data_saida).toLocaleDateString('pt-BR') : 'Em estoque',
        equipment.totalDays,
        equipment.totalMovements,
        `"${movimentacoesText}"`
      ].join(','));
    });

    const csvContent = csvData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `historico_equipamentos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Histórico de equipamentos exportado com sucesso!",
    });
  };

  const totalEquipments = equipments.length;
  const totalMovements = equipments.reduce((sum, eq) => sum + eq.totalMovements, 0);
  const avgDaysInStock = equipments.length > 0 
    ? Math.round(equipments.reduce((sum, eq) => sum + eq.totalDays, 0) / equipments.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando histórico de equipamentos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Histórico de Equipamentos</h1>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          Exportar CSV ({totalEquipments} equipamentos)
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Tipo ou número de série..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
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
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Equipamentos</p>
                <p className="text-2xl font-bold">{totalEquipments}</p>
              </div>
              <History className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Movimentações</p>
                <p className="text-2xl font-bold">{totalMovements}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Média de Dias em Estoque</p>
                <p className="text-2xl font-bold">{avgDaysInStock}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Equipamentos com Histórico */}
      <div className="space-y-4">
        {equipments.map(equipment => (
          <Card key={equipment.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{equipment.tipo}</CardTitle>
                  <p className="text-sm text-gray-600">
                    Série: <span className="font-mono">{equipment.numero_serie}</span> | 
                    Empresa: {equipment.empresas?.name || 'N/A'}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p><strong>Entrada:</strong> {new Date(equipment.data_entrada).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Saída:</strong> {equipment.data_saida ? new Date(equipment.data_saida).toLocaleDateString('pt-BR') : 'Em estoque'}</p>
                  <p><strong>Total:</strong> {equipment.totalDays} dias</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-gray-700">
                  Histórico de Movimentações ({equipment.totalMovements} registros)
                </h4>
                {equipment.movimentacoes.length > 0 ? (
                  <div className="space-y-2">
                    {equipment.movimentacoes.map(movement => (
                      <div key={movement.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            movement.tipo_movimento === 'entrada' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {movement.tipo_movimento}
                          </span>
                          <span className="text-sm">
                            {formatDateForDisplay(movement.data_movimento)}
                          </span>
                          <span className="text-sm text-gray-600">
                            {movement.observacoes || 'Sem observações'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {movement.usuario_responsavel || 'Usuário não identificado'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic">Nenhuma movimentação registrada</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {equipments.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Nenhum equipamento encontrado com os filtros selecionados
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EquipmentHistoryReport;
