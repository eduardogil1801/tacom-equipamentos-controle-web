
import React, { useState, useEffect } from 'react';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
// import jsPDF from 'jspdf'; // Removed for compatibility
// import 'jspdf-autotable'; // Removed for compatibility

interface Movement {
  id: string;
  tipo_movimento: string;
  data_movimento: string;
  observacoes?: string;
  detalhes_manutencao?: string;
  usuario_responsavel?: string;
  equipamentos: {
    numero_serie: string;
    tipo: string;
    empresas?: {
      name: string;
    };
  };
  tipos_manutencao?: {
    codigo: string;
    descricao: string;
  };
}

interface User {
  id: string;
  nome: string;
  username: string;
}

const MovementsReport: React.FC = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [availableSerialNumbers, setAvailableSerialNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    tipoMovimento: '',
    dataInicio: '',
    dataFim: '',
    numeroSerie: '',
    usuarioResponsavel: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [movements, filters]);

  useEffect(() => {
    // Extrair números de série únicos
    const serialNumbers = [...new Set(movements.map(m => m.equipamentos?.numero_serie).filter(Boolean))].sort();
    setAvailableSerialNumbers(serialNumbers);
  }, [movements]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: movementsData, error: movementsError } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          equipamentos (
            numero_serie,
            tipo,
            empresas (
              name
            )
          ),
          tipos_manutencao (
            codigo,
            descricao
          )
        `)
        .order('data_movimento', { ascending: false });

      if (movementsError) throw movementsError;
      setMovements(movementsData || []);

      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id, nome, username')
        .eq('ativo', true)
        .order('nome');

      if (userError) throw userError;
      setUsers(userData || []);

    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar movimentações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...movements];

    if (filters.tipoMovimento) {
      filtered = filtered.filter(item => item.tipo_movimento === filters.tipoMovimento);
    }

    if (filters.dataInicio) {
      filtered = filtered.filter(item => 
        new Date(item.data_movimento) >= new Date(filters.dataInicio)
      );
    }

    if (filters.dataFim) {
      filtered = filtered.filter(item => 
        new Date(item.data_movimento) <= new Date(filters.dataFim)
      );
    }

    if (filters.numeroSerie) {
      filtered = filtered.filter(item => 
        item.equipamentos?.numero_serie === filters.numeroSerie
      );
    }

    if (filters.usuarioResponsavel) {
      filtered = filtered.filter(item => 
        item.usuario_responsavel === filters.usuarioResponsavel
      );
    }

    setFilteredMovements(filtered);
  };

  const generatePDF = () => {
    alert("Geração de PDF não disponível no momento");
    return;
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando relatório...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Movimentações</h1>
        <Button onClick={generatePDF} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Gerar PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tipoMovimento">Tipo de Movimentação</Label>
              <Select 
                value={filters.tipoMovimento || 'all'} 
                onValueChange={(value) => handleFilterChange('tipoMovimento', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="movimentacao">Alocação</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="devolucao">Devolução</SelectItem>
                  <SelectItem value="retorno_manutencao">Retorno de Manutenção</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={filters.dataInicio}
                onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={filters.dataFim}
                onChange={(e) => handleFilterChange('dataFim', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="numeroSerie">Número de Série</Label>
              <Select 
                value={filters.numeroSerie || 'all'} 
                onValueChange={(value) => handleFilterChange('numeroSerie', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os números de série" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os números de série</SelectItem>
                  {availableSerialNumbers.map(serial => (
                    <SelectItem key={serial} value={serial}>{serial}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="usuarioResponsavel">Usuário Responsável</Label>
              <Select 
                value={filters.usuarioResponsavel || 'all'} 
                onValueChange={(value) => handleFilterChange('usuarioResponsavel', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os usuários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.nome}>{user.nome} (@{user.username})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 border-b border-gray-200 font-medium text-gray-900 min-w-[100px]">Data</th>
                    <th className="text-left p-3 border-b border-gray-200 font-medium text-gray-900 min-w-[120px]">Tipo</th>
                    <th className="text-left p-3 border-b border-gray-200 font-medium text-gray-900 min-w-[120px]">Número Série</th>
                    <th className="text-left p-3 border-b border-gray-200 font-medium text-gray-900 min-w-[140px]">Tipo Equipamento</th>
                    <th className="text-left p-3 border-b border-gray-200 font-medium text-gray-900 min-w-[150px]">Empresa</th>
                    <th className="text-left p-3 border-b border-gray-200 font-medium text-gray-900 min-w-[120px]">Responsável</th>
                    <th className="text-left p-3 border-b border-gray-200 font-medium text-gray-900 min-w-[200px]">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map(movement => (
                    <tr key={movement.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-sm">{formatDateForDisplay(movement.data_movimento)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          movement.tipo_movimento === 'entrada' ? 'bg-green-100 text-green-800' :
                          movement.tipo_movimento === 'saida' ? 'bg-red-100 text-red-800' :
                          movement.tipo_movimento === 'manutencao' ? 'bg-yellow-100 text-yellow-800' :
                          movement.tipo_movimento === 'movimentacao' ? 'bg-blue-100 text-blue-800' :
                          movement.tipo_movimento === 'devolucao' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {movement.tipo_movimento === 'movimentacao' ? 'Alocação' :
                           movement.tipo_movimento === 'manutencao' ? 'Manutenção' :
                           movement.tipo_movimento === 'devolucao' ? 'Devolução' :
                           movement.tipo_movimento === 'retorno_manutencao' ? 'Retorno Manutenção' :
                           movement.tipo_movimento === 'entrada' ? 'Entrada' :
                           movement.tipo_movimento === 'saida' ? 'Saída' :
                           movement.tipo_movimento}
                        </span>
                      </td>
                      <td className="p-3 text-sm font-mono">{movement.equipamentos?.numero_serie || '-'}</td>
                      <td className="p-3 text-sm">{movement.equipamentos?.tipo || '-'}</td>
                      <td className="p-3 text-sm">{movement.equipamentos?.empresas?.name || '-'}</td>
                      <td className="p-3 text-sm">{movement.usuario_responsavel || '-'}</td>
                      <td className="p-3 text-sm">
                        <div className="max-w-[200px] overflow-hidden">
                          {movement.observacoes ? (
                            <span 
                              className="block truncate"
                              title={movement.observacoes}
                            >
                              {movement.observacoes}
                            </span>
                          ) : '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredMovements.length === 0 && (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg mt-4">
                <div className="text-lg font-medium">Nenhuma movimentação encontrada</div>
                <div className="text-sm mt-1">Tente ajustar os filtros para ver os resultados</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MovementsReport;
