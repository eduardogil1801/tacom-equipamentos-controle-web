
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Movement {
  id: string;
  data_movimento: string;
  tipo_movimento: string;
  observacoes?: string;
  detalhes_manutencao?: string;
  equipamentos: {
    numero_serie: string;
    tipo: string;
    empresas: {
      name: string;
    };
  };
  tipos_manutencao?: {
    codigo: string;
    descricao: string;
  };
}

const MovementsReport = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    company: 'all',
    movementType: 'all',
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterMovements();
  }, [movements, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar empresas
      const { data: companyData, error: companyError } = await supabase
        .from('empresas')
        .select('id, name');

      if (companyError) throw companyError;
      setCompanies(companyData || []);

      // Buscar movimentações
      const { data: movementData, error: movementError } = await supabase
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

      if (movementError) throw movementError;
      setMovements(movementData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterMovements = () => {
    let filtered = [...movements];

    if (filters.company !== 'all') {
      filtered = filtered.filter(movement => 
        movement.equipamentos?.empresas?.name === filters.company
      );
    }

    if (filters.movementType !== 'all') {
      filtered = filtered.filter(movement => 
        movement.tipo_movimento === filters.movementType
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter(movement => 
        movement.data_movimento >= filters.startDate
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(movement => 
        movement.data_movimento <= filters.endDate
      );
    }

    setFilteredMovements(filtered);
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'entrada': return 'Entrada';
      case 'saida': return 'Saída';
      case 'manutencao': return 'Manutenção';
      case 'retorno_manutencao': return 'Retorno Manutenção';
      default: return type;
    }
  };

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'entrada': return 'bg-green-100 text-green-800';
      case 'saida': return 'bg-red-100 text-red-800';
      case 'manutencao': return 'bg-yellow-100 text-yellow-800';
      case 'retorno_manutencao': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando relatório...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatório de Movimentações</h1>
        <Button onClick={fetchData}>
          Atualizar Dados
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select 
                value={filters.company} 
                onValueChange={(value) => setFilters({...filters, company: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.name}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Movimento</Label>
              <Select 
                value={filters.movementType} 
                onValueChange={(value) => setFilters({...filters, movementType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="retorno_manutencao">Retorno Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {filteredMovements.length}
            </div>
            <div className="text-sm text-gray-600">Total Movimentações</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {filteredMovements.filter(m => m.tipo_movimento === 'entrada').length}
            </div>
            <div className="text-sm text-gray-600">Entradas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {filteredMovements.filter(m => m.tipo_movimento === 'saida').length}
            </div>
            <div className="text-sm text-gray-600">Saídas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredMovements.filter(m => m.tipo_movimento === 'manutencao').length}
            </div>
            <div className="text-sm text-gray-600">Manutenções</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações ({filteredMovements.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">Data</th>
                  <th className="border border-gray-300 p-2 text-left">Tipo</th>
                  <th className="border border-gray-300 p-2 text-left">Equipamento</th>
                  <th className="border border-gray-300 p-2 text-left">Série</th>
                  <th className="border border-gray-300 p-2 text-left">Empresa</th>
                  <th className="border border-gray-300 p-2 text-left">Manutenção</th>
                  <th className="border border-gray-300 p-2 text-left">Observações</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map(movement => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2">
                      {new Date(movement.data_movimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="border border-gray-300 p-2">
                      <span className={`px-2 py-1 rounded text-xs ${getMovementTypeColor(movement.tipo_movimento)}`}>
                        {getMovementTypeLabel(movement.tipo_movimento)}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-2">{movement.equipamentos?.tipo}</td>
                    <td className="border border-gray-300 p-2 font-mono">
                      {movement.equipamentos?.numero_serie}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {movement.equipamentos?.empresas?.name}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {movement.tipos_manutencao && (
                        <div>
                          <span className="font-mono bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs mr-2">
                            {movement.tipos_manutencao.codigo}
                          </span>
                          <span className="text-sm">{movement.tipos_manutencao.descricao}</span>
                          {movement.detalhes_manutencao && (
                            <div className="text-xs text-gray-600 mt-1">
                              {movement.detalhes_manutencao}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {movement.observacoes && (
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {movement.observacoes}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredMovements.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma movimentação encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MovementsReport;
