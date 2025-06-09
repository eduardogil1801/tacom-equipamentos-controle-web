import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash, Move, Upload } from 'lucide-react';
import EquipmentForm from './EquipmentForm';
import EquipmentMovement from './EquipmentMovement';
import BulkImportDialog from './BulkImportDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Equipment {
  id: string;
  tipo: string;
  modelo?: string;
  numero_serie: string;
  data_entrada: string;
  data_saida?: string;
  id_empresa: string;
  estado?: string;
  status?: string;
  empresas?: {
    name: string;
  };
}

interface Company {
  id: string;
  name: string;
}

const EquipmentList: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Estados para as opções dos filtros
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  
  const [filters, setFilters] = useState({
    numero_serie: '',
    company: '',
    data_entrada: '',
    data_saida: '',
    estado: '',
    tipo: '',
    modelo: '',
    status: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Extrair tipos, modelos e estados únicos dos equipamentos
    const types = [...new Set(equipments.map(eq => eq.tipo).filter(Boolean))].sort();
    const models = [...new Set(equipments.map(eq => eq.modelo).filter(Boolean))].sort();
    const states = [...new Set(equipments.map(eq => eq.estado).filter(Boolean))].sort();
    
    setAvailableTypes(types);
    setAvailableModels(models);
    setAvailableStates(states);
  }, [equipments]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: companiesData, error: companiesError } = await supabase
        .from('empresas')
        .select('*')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      const { data: equipmentsData, error: equipmentsError } = await supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name
          )
        `)
        .order('data_entrada', { ascending: false });

      if (equipmentsError) throw equipmentsError;
      setEquipments(equipmentsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEquipment = () => {
    loadData();
    setShowForm(false);
    setEditingEquipment(null);
  };

  const handleMovementSuccess = () => {
    loadData();
    setShowMovement(false);
  };

  const handleBulkImportSuccess = () => {
    loadData();
    setShowBulkImport(false);
  };

  const handleDeleteEquipment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Equipamento excluído com sucesso!",
      });
      
      loadData();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir equipamento",
        variant: "destructive",
      });
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const newTimeout = setTimeout(() => {
      setFilters(prev => ({ ...prev, [field]: value }));
    }, 500);

    setSearchTimeout(newTimeout);
  };

  const filteredEquipments = equipments.filter(equipment => {
    const company = equipment.empresas;
    return (
      equipment.numero_serie.toLowerCase().includes(filters.numero_serie.toLowerCase()) &&
      (company?.name.toLowerCase().includes(filters.company.toLowerCase()) || !filters.company) &&
      (equipment.data_entrada.includes(filters.data_entrada) || !filters.data_entrada) &&
      (equipment.data_saida?.includes(filters.data_saida) || !filters.data_saida) &&
      (equipment.estado === filters.estado || !filters.estado) &&
      (equipment.tipo === filters.tipo || !filters.tipo) &&
      (equipment.modelo === filters.modelo || !filters.modelo) &&
      (equipment.status?.toLowerCase().includes(filters.status.toLowerCase()) || !filters.status)
    );
  });

  const getStatusLabel = (status?: string) => {
    if (!status) return 'N/A';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR');
  };

  if (showForm) {
    return (
      <EquipmentForm
        equipment={editingEquipment}
        companies={companies}
        onSave={handleSaveEquipment}
        onCancel={() => {
          setShowForm(false);
          setEditingEquipment(null);
        }}
      />
    );
  }

  if (showMovement) {
    return (
      <EquipmentMovement
        onCancel={() => setShowMovement(false)}
        onSuccess={handleMovementSuccess}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Controle de Equipamentos</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowMovement(true)}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Move className="h-4 w-4" />
            Movimentação
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Equipamento
          </Button>
          <Button
            onClick={() => setShowBulkImport(true)}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Importação em Lote
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="serialFilter">Número de Série</Label>
              <Input
                id="serialFilter"
                placeholder="Filtrar por série..."
                onChange={(e) => handleFilterChange('numero_serie', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="companyFilter">Empresa</Label>
              <Select value={filters.company || 'all'} onValueChange={(value) => setFilters({...filters, company: value === 'all' ? '' : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.name}>{company.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipoFilter">Tipo</Label>
              <Select value={filters.tipo || 'all'} onValueChange={(value) => setFilters({...filters, tipo: value === 'all' ? '' : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {availableTypes.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="modeloFilter">Modelo</Label>
              <Select value={filters.modelo || 'all'} onValueChange={(value) => setFilters({...filters, modelo: value === 'all' ? '' : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os modelos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os modelos</SelectItem>
                  {availableModels.map(modelo => (
                    <SelectItem key={modelo} value={modelo}>{modelo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="estadoFilter">Estado</Label>
              <Select value={filters.estado || 'all'} onValueChange={(value) => setFilters({...filters, estado: value === 'all' ? '' : value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {availableStates.map(estado => (
                    <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="statusFilter">Status</Label>
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

      {/* Equipment List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Equipamentos ({formatNumber(filteredEquipments.length)})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Modelo</th>
                  <th className="text-left p-2">Série</th>
                  <th className="text-left p-2">Empresa</th>
                  <th className="text-left p-2">Estado</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Entrada</th>
                  <th className="text-left p-2">Saída</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipments.map(equipment => (
                  <tr key={equipment.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{equipment.tipo}</td>
                    <td className="p-2">{equipment.modelo || '-'}</td>
                    <td className="p-2 font-mono">{equipment.numero_serie}</td>
                    <td className="p-2">{equipment.empresas?.name || 'N/A'}</td>
                    <td className="p-2">{equipment.estado || '-'}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        equipment.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                        equipment.status === 'danificado' ? 'bg-red-100 text-red-800' :
                        equipment.status === 'em_uso' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getStatusLabel(equipment.status)}
                      </span>
                    </td>
                    <td className="p-2">{new Date(equipment.data_entrada).toLocaleDateString('pt-BR')}</td>
                    <td className="p-2">
                      {equipment.data_saida ? new Date(equipment.data_saida).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingEquipment(equipment);
                            setShowForm(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteEquipment(equipment.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEquipments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum equipamento encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <BulkImportDialog
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onSuccess={handleBulkImportSuccess}
      />
    </div>
  );
};

export default EquipmentList;
