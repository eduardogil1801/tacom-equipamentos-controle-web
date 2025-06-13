
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Equipment {
  id: string;
  tipo: string;
  numero_serie: string;
  data_entrada: string;
  data_saida: string | null;
  estado: string | null;
  status: string;
  empresas?: {
    name: string;
  };
  daysInStock: number;
  statusCategory: 'available' | 'out' | 'long_term' | 'recent' | 'maintenance' | 'unavailable';
}

const EquipmentStatusReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    equipmentType: '',
    companyId: ''
  });
  const [companies, setCompanies] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar empresas
      const { data: companiesData } = await supabase
        .from('empresas')
        .select('id, name')
        .order('name');
      
      setCompanies(companiesData || []);

      // Carregar equipamentos
      let query = supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name
          )
        `)
        .order('data_entrada', { ascending: false });

      // Aplicar filtros
      if (filters.equipmentType) {
        query = query.eq('tipo', filters.equipmentType);
      }
      if (filters.companyId && filters.companyId !== 'all') {
        query = query.eq('id_empresa', filters.companyId);
      }

      const { data: equipmentsData, error } = await query;
      if (error) throw error;

      // Processar dados para incluir status e dias em estoque
      const processedEquipments = (equipmentsData || []).map(equipment => {
        const entryDate = new Date(equipment.data_entrada);
        const exitDate = equipment.data_saida ? new Date(equipment.data_saida) : null;
        const today = new Date();
        
        let daysInStock: number;
        let statusCategory: 'available' | 'out' | 'long_term' | 'recent' | 'maintenance' | 'unavailable';

        if (exitDate) {
          daysInStock = Math.floor((exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
          statusCategory = 'out';
        } else {
          daysInStock = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Categorizar baseado no status atual do equipamento
          const currentStatus = equipment.status || 'disponivel';
          
          if (currentStatus === 'indisponivel' || currentStatus === 'danificado') {
            statusCategory = 'unavailable';
          } else if (currentStatus === 'manutencao' || currentStatus === 'aguardando_manutencao') {
            statusCategory = 'maintenance';
          } else if (daysInStock <= 7) {
            statusCategory = 'recent';
          } else if (daysInStock > 90) {
            statusCategory = 'long_term';
          } else {
            statusCategory = 'available';
          }
        }

        return {
          ...equipment,
          status: equipment.status || 'disponivel',
          daysInStock,
          statusCategory
        };
      });

      // Filtrar por status se especificado
      const filteredEquipments = (filters.status && filters.status !== 'all')
        ? processedEquipments.filter(eq => eq.statusCategory === filters.status)
        : processedEquipments;

      setEquipments(filteredEquipments);
    } catch (error) {
      console.error('Erro ao carregar status dos equipamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatório de status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Tipo', 'Série', 'Empresa', 'Status Atual', 'Categoria', 'Dias em Estoque', 'Data Entrada', 'Data Saída', 'Estado'];
    const csvContent = [
      headers.join(','),
      ...equipments.map(equipment => [
        `"${equipment.tipo}"`,
        `"${equipment.numero_serie}"`,
        `"${equipment.empresas?.name || 'N/A'}"`,
        `"${getStatusLabel(equipment.status)}"`,
        `"${getCategoryLabel(equipment.statusCategory)}"`,
        equipment.daysInStock,
        new Date(equipment.data_entrada).toLocaleDateString('pt-BR'),
        equipment.data_saida ? new Date(equipment.data_saida).toLocaleDateString('pt-BR') : '',
        equipment.estado || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_status_equipamentos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Relatório de status exportado com sucesso!",
    });
  };

  const getStatusIcon = (statusCategory: string) => {
    switch (statusCategory) {
      case 'available':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'out':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'long_term':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'recent':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'maintenance':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'unavailable':
        return <XCircle className="h-5 w-5 text-red-700" />;
      default:
        return null;
    }
  };

  const getCategoryLabel = (statusCategory: string) => {
    switch (statusCategory) {
      case 'available':
        return 'Disponível';
      case 'out':
        return 'Retirado';
      case 'long_term':
        return 'Longo Prazo';
      case 'recent':
        return 'Recente';
      case 'maintenance':
        return 'Manutenção';
      case 'unavailable':
        return 'Indisponível';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível';
      case 'manutencao':
        return 'Manutenção';
      case 'em_uso':
        return 'Em Uso';
      case 'aguardando_manutencao':
        return 'Aguardando Manutenção';
      case 'danificado':
        return 'Danificado';
      case 'indisponivel':
        return 'Indisponível';
      default:
        return 'Desconhecido';
    }
  };

  const statusCounts = {
    available: equipments.filter(eq => eq.statusCategory === 'available').length,
    out: equipments.filter(eq => eq.statusCategory === 'out').length,
    long_term: equipments.filter(eq => eq.statusCategory === 'long_term').length,
    recent: equipments.filter(eq => eq.statusCategory === 'recent').length,
    maintenance: equipments.filter(eq => eq.statusCategory === 'maintenance').length,
    unavailable: equipments.filter(eq => eq.statusCategory === 'unavailable').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando relatório de status...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Status dos Equipamentos</h1>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          Exportar CSV ({equipments.length} equipamentos)
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
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({...filters, status: value === 'all' ? '' : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="out">Retirado</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="unavailable">Indisponível</SelectItem>
                  <SelectItem value="long_term">Longo Prazo ({'>'}90 dias)</SelectItem>
                  <SelectItem value="recent">Recente (≤7 dias)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="equipmentType">Tipo de Equipamento</Label>
              <Input
                id="equipmentType"
                placeholder="Ex: Notebook, Desktop..."
                value={filters.equipmentType}
                onChange={(e) => setFilters({...filters, equipmentType: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="companyId">Empresa</Label>
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
          </div>
        </CardContent>
      </Card>

      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Disponíveis</p>
                <p className="text-xl font-bold text-green-600">{statusCounts.available}</p>
              </div>
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Retirados</p>
                <p className="text-xl font-bold text-red-600">{statusCounts.out}</p>
              </div>
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Manutenção</p>
                <p className="text-xl font-bold text-yellow-600">{statusCounts.maintenance}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Indisponíveis</p>
                <p className="text-xl font-bold text-red-700">{statusCounts.unavailable}</p>
              </div>
              <XCircle className="h-6 w-6 text-red-700" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Longo Prazo</p>
                <p className="text-xl font-bold text-orange-600">{statusCounts.long_term}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">Recentes</p>
                <p className="text-xl font-bold text-blue-600">{statusCounts.recent}</p>
              </div>
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Equipamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Equipamentos por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Status Categoria</th>
                  <th className="text-left p-3">Status Atual</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Série</th>
                  <th className="text-left p-3">Empresa</th>
                  <th className="text-left p-3">Dias em Estoque</th>
                  <th className="text-left p-3">Data Entrada</th>
                  <th className="text-left p-3">Data Saída</th>
                </tr>
              </thead>
              <tbody>
                {equipments.map(equipment => (
                  <tr key={equipment.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(equipment.statusCategory)}
                        <span className="text-sm">{getCategoryLabel(equipment.statusCategory)}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-sm">{getStatusLabel(equipment.status)}</span>
                    </td>
                    <td className="p-3">{equipment.tipo}</td>
                    <td className="p-3 font-mono">{equipment.numero_serie}</td>
                    <td className="p-3">{equipment.empresas?.name || 'N/A'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        equipment.daysInStock <= 7 ? 'bg-blue-100 text-blue-800' :
                        equipment.daysInStock > 90 ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {equipment.daysInStock} dias
                      </span>
                    </td>
                    <td className="p-3">{new Date(equipment.data_entrada).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3">
                      {equipment.data_saida ? new Date(equipment.data_saida).toLocaleDateString('pt-BR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default EquipmentStatusReport;
