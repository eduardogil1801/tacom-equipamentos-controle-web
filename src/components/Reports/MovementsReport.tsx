
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
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Movimentações', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 32);
    
    if (filteredMovements.length === 0) {
      doc.text('Nenhuma movimentação encontrada com os filtros aplicados.', 14, 50);
      doc.save('relatorio-movimentacoes.pdf');
      return;
    }

    const tableData = filteredMovements.map(item => [
      formatDateForDisplay(item.data_movimento),
      item.tipo_movimento,
      item.equipamentos?.numero_serie || '-',
      item.equipamentos?.tipo || '-',
      item.equipamentos?.empresas?.name || '-',
      item.usuario_responsavel || '-',
      item.observacoes || '-'
    ]);

    (doc as any).autoTable({
      head: [['Data', 'Tipo', 'Número Série', 'Tipo Equip.', 'Empresa', 'Responsável', 'Observações']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] },
      columnStyles: {
        6: { cellWidth: 30 } // Observações column
      }
    });

    doc.save('relatorio-movimentacoes.pdf');
    
    toast({
      title: "Sucesso",
      description: "Relatório PDF gerado com sucesso!",
    });
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
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Número Série</th>
                  <th className="text-left p-3">Tipo Equipamento</th>
                  <th className="text-left p-3">Empresa</th>
                  <th className="text-left p-3">Responsável</th>
                  <th className="text-left p-3">Observações</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map(movement => (
                  <tr key={movement.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{formatDateForDisplay(movement.data_movimento)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        movement.tipo_movimento === 'entrada' ? 'bg-green-100 text-green-800' :
                        movement.tipo_movimento === 'saida' ? 'bg-red-100 text-red-800' :
                        movement.tipo_movimento === 'manutencao' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {movement.tipo_movimento}
                      </span>
                    </td>
                    <td className="p-3">{movement.equipamentos?.numero_serie || '-'}</td>
                    <td className="p-3">{movement.equipamentos?.tipo || '-'}</td>
                    <td className="p-3">{movement.equipamentos?.empresas?.name || '-'}</td>
                    <td className="p-3">{movement.usuario_responsavel || '-'}</td>
                    <td className="p-3 max-w-xs truncate" title={movement.observacoes}>
                      {movement.observacoes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMovements.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma movimentação encontrada com os filtros aplicados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MovementsReport;
