
import React, { useState, useEffect, useMemo } from 'react';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ReportExportBar from './ReportExportBar';

interface Movement {
  id: string;
  tipo_movimento: string;
  data_movimento: string;
  data_criacao?: string;
  observacoes?: string;
  detalhes_manutencao?: string;
  usuario_responsavel?: string;
  empresa_origem_nome?: string;
  empresa_destino_nome?: string;
  equipamentos: {
    numero_serie: string;
    tipo: string;
    id_empresa: string;
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

interface Company {
  id: string;
  name: string;
}

const MovementsReport: React.FC = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
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
            id_empresa,
            empresas (
              name
            )
          ),
          tipos_manutencao!movimentacoes_tipo_manutencao_id_fkey (
            codigo,
            descricao
          )
        `)
        .order('data_movimento', { ascending: false });

      if (movementsError) throw movementsError;
      setMovements((movementsData || []) as Movement[]);

      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id, nome, username')
        .eq('ativo', true)
        .order('nome');

      if (userError) throw userError;
      setUsers(userData || []);

      // Carregar empresas para mapear IDs para nomes
      const { data: companiesData, error: companiesError } = await supabase
        .from('empresas')
        .select('id, name')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

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

  // Mapa cronológico de origem/destino por equipamento
  const origemDestinoMap = useMemo(() => {
    const map = new Map<string, { origem: string; destino: string }>();
    const byEquip = new Map<string, Movement[]>();
    movements.forEach(m => {
      const key = m.equipamentos?.numero_serie || m.id;
      if (!byEquip.has(key)) byEquip.set(key, []);
      byEquip.get(key)!.push(m);
    });
    byEquip.forEach(list => {
      const sorted = [...list].sort(
        (a, b) =>
          new Date(a.data_criacao || a.data_movimento).getTime() -
          new Date(b.data_criacao || b.data_movimento).getTime()
      );
      sorted.forEach((m, idx) => {
        const empresaAtual = m.equipamentos?.empresas?.name || '-';
        const destino = m.empresa_destino_nome || empresaAtual;
        let origem = m.empresa_origem_nome || '';
        if (!origem) {
          if (idx > 0) {
            const prev = sorted[idx - 1];
            origem = prev.empresa_destino_nome || prev.equipamentos?.empresas?.name || '-';
          } else {
            const obs = m.observacoes || '';
            const match = obs.match(/Movimentado de (.+?) para (.+)/i);
            origem = match ? match[1] : empresaAtual;
          }
        }
        map.set(m.id, { origem, destino });
      });
    });
    return map;
  }, [movements]);

  const getOrigemDestino = (m: Movement) =>
    origemDestinoMap.get(m.id) || { origem: '-', destino: '-' };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const buildExport = () => ({
    title: 'Relatório de Movimentações',
    fileName: `movimentacoes_${new Date().toISOString().slice(0, 10)}`,
    headers: ['Data', 'Tipo', 'Nº Série', 'Equipamento', 'Origem', 'Destino', 'Responsável', 'Observações'],
    rows: filteredMovements.map(m => {
      const { origem, destino } = getOrigemDestino(m);
      return [
        formatDateForDisplay(m.data_movimento),
        m.tipo_movimento,
        m.equipamentos?.numero_serie || '-',
        m.equipamentos?.tipo || '-',
        origem,
        destino,
        m.usuario_responsavel || '-',
        m.observacoes || '-',
      ];
    }),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando relatório...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Movimentações</h1>
        <ReportExportBar getData={buildExport} />
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
                  <SelectItem value="movimentacao_interna">Movimentação Interna</SelectItem>
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
            <div className="min-w-[1200px]">
              <table className="w-full border-collapse border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 border-b border-gray-200 font-medium text-gray-900 whitespace-nowrap">Data</th>
                    <th className="text-left p-3 border-b border-gray-200 font-medium text-gray-900 whitespace-nowrap">Tipo</th>
                    <th className="text-left p-3 border-b border-gray-200 font-medium text-gray-900 whitespace-nowrap">Nº Série</th>
                    <th className="text-left p-3 border-b border-gray-200 font-medium text-gray-900 whitespace-nowrap">Equipamento</th>
                    <th className="text-left p-3 border-b border-gray-200 font-medium text-gray-900 whitespace-nowrap">Origem</th>
                    <th className="text-left p-3 border-b border-gray-200 font-medium text-gray-900 whitespace-nowrap">Destino</th>
                    <th className="text-left p-3 border-b border-gray-200 font-medium text-gray-900 whitespace-nowrap">Responsável</th>
                    <th className="text-left p-3 border-b border-gray-200 font-medium text-gray-900 whitespace-nowrap">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map(movement => {
                    const { origem, destino } = parseMovementDetails(movement);
                    
                    return (
                      <tr key={movement.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="p-3 text-sm whitespace-nowrap">{formatDateForDisplay(movement.data_movimento)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            movement.tipo_movimento === 'entrada' ? 'bg-green-100 text-green-800' :
                            movement.tipo_movimento === 'saida' ? 'bg-red-100 text-red-800' :
                            movement.tipo_movimento === 'manutencao' ? 'bg-yellow-100 text-yellow-800' :
                            movement.tipo_movimento === 'movimentacao' ? 'bg-blue-100 text-blue-800' :
                            movement.tipo_movimento === 'movimentacao_interna' ? 'bg-cyan-100 text-cyan-800' :
                            movement.tipo_movimento === 'devolucao' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {movement.tipo_movimento === 'movimentacao' ? 'Alocação' :
                             movement.tipo_movimento === 'movimentacao_interna' ? 'Mov. Interna' :
                             movement.tipo_movimento === 'manutencao' ? 'Manutenção' :
                             movement.tipo_movimento === 'devolucao' ? 'Devolução' :
                             movement.tipo_movimento === 'retorno_manutencao' ? 'Ret. Manutenção' :
                             movement.tipo_movimento === 'entrada' ? 'Entrada' :
                             movement.tipo_movimento === 'saida' ? 'Saída' :
                             movement.tipo_movimento}
                          </span>
                        </td>
                        <td className="p-3 text-sm font-mono whitespace-nowrap">{movement.equipamentos?.numero_serie || '-'}</td>
                        <td className="p-3 text-sm whitespace-nowrap">{movement.equipamentos?.tipo || '-'}</td>
                        <td className="p-3">
                          <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-medium whitespace-nowrap" title={origem}>
                            {origem}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-medium whitespace-nowrap" title={destino}>
                            {destino}
                          </span>
                        </td>
                        <td className="p-3 text-sm whitespace-nowrap">{movement.usuario_responsavel || '-'}</td>
                        <td className="p-3 text-sm">
                          {movement.observacoes ? (
                            <span title={movement.observacoes}>
                              {movement.observacoes.replace(/Movimentado?\s+de\s+.+?\s+para\s+.+?(?:\s*$|\.)/i, '').trim() || '-'}
                            </span>
                          ) : '-'}
                        </td>
                      </tr>
                    );
                  })}
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
