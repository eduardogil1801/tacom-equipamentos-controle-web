
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Search, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Equipment {
  id: string;
  tipo: string;
  numero_serie: string;
  data_entrada: string;
  data_saida?: string;
  status?: string;
  empresas?: {
    name: string;
  };
  movimentacoes?: {
    id: string;
    tipo_movimento: string;
    data_movimento: string;
    observacoes: string;
  }[];
}

const EquipmentHistoryDetailReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    serialNumber: '',
    companyId: '',
    startDate: '',
    endDate: '',
    status: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('empresas')
        .select('*')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Load equipments with movements
      let equipmentQuery = supabase
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
            observacoes
          )
        `)
        .order('data_entrada', { ascending: false });

      // Apply filters
      if (filters.serialNumber) {
        equipmentQuery = equipmentQuery.ilike('numero_serie', `%${filters.serialNumber}%`);
      }
      if (filters.companyId && filters.companyId !== 'all') {
        equipmentQuery = equipmentQuery.eq('id_empresa', filters.companyId);
      }
      if (filters.startDate) {
        equipmentQuery = equipmentQuery.gte('data_entrada', filters.startDate);
      }
      if (filters.endDate) {
        equipmentQuery = equipmentQuery.lte('data_entrada', filters.endDate);
      }
      if (filters.status) {
        equipmentQuery = equipmentQuery.eq('status', filters.status);
      }

      const { data: equipmentsData, error: equipmentsError } = await equipmentQuery;

      if (equipmentsError) throw equipmentsError;
      setEquipments(equipmentsData || []);
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
    const csvData = [
      ['Relatório de Histórico de Equipamentos'],
      [''],
      ['Número de Série', 'Tipo', 'Empresa', 'Status', 'Data Entrada', 'Data Saída', 'Movimentações'],
      ...equipments.map(equipment => [
        equipment.numero_serie,
        equipment.tipo,
        equipment.empresas?.name || 'N/A',
        equipment.status || 'N/A',
        new Date(equipment.data_entrada).toLocaleDateString('pt-BR'),
        equipment.data_saida ? new Date(equipment.data_saida).toLocaleDateString('pt-BR') : '-',
        equipment.movimentacoes?.length || 0
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando histórico...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Histórico de Equipamentos</h1>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          Exportar CSV ({equipments.length} registros)
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
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="serialNumber">Número de Série</Label>
              <Input
                id="serialNumber"
                placeholder="Filtrar por série..."
                value={filters.serialNumber}
                onChange={(e) => setFilters({...filters, serialNumber: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="company">Empresa</Label>
              <Select value={filters.companyId || 'all'} onValueChange={(value) => setFilters({...filters, companyId: value === 'all' ? '' : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({...filters, status: value === 'all' ? '' : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em_uso">Em Uso</SelectItem>
                  <SelectItem value="aguardando_manutencao">Aguardando Manutenção</SelectItem>
                  <SelectItem value="danificado">Danificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico Detalhado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico Completo ({equipments.length} equipamentos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {equipments.map(equipment => (
              <div key={equipment.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Série:</span>
                    <p className="font-mono text-sm">{equipment.numero_serie}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Tipo:</span>
                    <p className="text-sm">{equipment.tipo}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Empresa:</span>
                    <p className="text-sm">{equipment.empresas?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      equipment.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                      equipment.status === 'em_uso' ? 'bg-blue-100 text-blue-800' :
                      equipment.status === 'danificado' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {equipment.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Entrada:</span>
                    <p className="text-sm">{new Date(equipment.data_entrada).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Saída:</span>
                    <p className="text-sm">
                      {equipment.data_saida ? new Date(equipment.data_saida).toLocaleDateString('pt-BR') : 'Em estoque'}
                    </p>
                  </div>
                </div>
                
                {equipment.movimentacoes && equipment.movimentacoes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Movimentações:</h4>
                    <div className="space-y-2">
                      {equipment.movimentacoes.map(movement => (
                        <div key={movement.id} className="flex items-center justify-between bg-white p-2 rounded border text-sm">
                          <div className="flex items-center gap-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              movement.tipo_movimento === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {movement.tipo_movimento === 'entrada' ? 'Entrada' : 'Saída'}
                            </span>
                            <span>{new Date(movement.data_movimento).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <span className="text-gray-600">{movement.observacoes || 'Sem observações'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {equipments.length === 0 && (
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

export default EquipmentHistoryDetailReport;
