
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash, Move, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
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
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  
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
  }, [currentPage, filters]);

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

      // Build query with filters
      let query = supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.numero_serie) {
        query = query.ilike('numero_serie', `%${filters.numero_serie}%`);
      }
      if (filters.tipo) {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters.modelo) {
        query = query.eq('modelo', filters.modelo);
      }
      if (filters.estado) {
        query = query.eq('estado', filters.estado);
      }
      if (filters.status) {
        query = query.ilike('status', `%${filters.status}%`);
      }
      if (filters.data_entrada) {
        query = query.gte('data_entrada', filters.data_entrada);
      }
      if (filters.data_saida) {
        query = query.lte('data_saida', filters.data_saida);
      }

      // Add pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { data: equipmentsData, error: equipmentsError, count } = await query
        .range(from, to)
        .order('data_entrada', { ascending: false });

      if (equipmentsError) throw equipmentsError;
      
      setEquipments(equipmentsData || []);
      setTotalCount(count || 0);
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
      setCurrentPage(1); // Reset to first page when filtering
    }, 500);

    setSearchTimeout(newTimeout);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

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
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Controle de Equipamentos</h1>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button
            onClick={() => setShowMovement(true)}
            className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 w-full sm:w-auto"
            size="sm"
          >
            <Move className="h-4 w-4" />
            <span className="hidden sm:inline">Movimentação</span>
            <span className="sm:hidden">Mover</span>
          </Button>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 w-full sm:w-auto"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar Equipamento</span>
            <span className="sm:hidden">Adicionar</span>
          </Button>
          <Button
            onClick={() => setShowBulkImport(true)}
            className="bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 w-full sm:w-auto"
            size="sm"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importação em Lote</span>
            <span className="sm:hidden">Importar</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="serialFilter" className="text-sm">Número de Série</Label>
              <Input
                id="serialFilter"
                placeholder="Filtrar por série..."
                onChange={(e) => handleFilterChange('numero_serie', e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="companyFilter" className="text-sm">Empresa</Label>
              <Select value={filters.company || 'all'} onValueChange={(value) => {
                setFilters({...filters, company: value === 'all' ? '' : value});
                setCurrentPage(1);
              }}>
                <SelectTrigger className="text-sm">
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
              <Label htmlFor="tipoFilter" className="text-sm">Tipo</Label>
              <Select value={filters.tipo || 'all'} onValueChange={(value) => {
                setFilters({...filters, tipo: value === 'all' ? '' : value});
                setCurrentPage(1);
              }}>
                <SelectTrigger className="text-sm">
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
              <Label htmlFor="modeloFilter" className="text-sm">Modelo</Label>
              <Select value={filters.modelo || 'all'} onValueChange={(value) => {
                setFilters({...filters, modelo: value === 'all' ? '' : value});
                setCurrentPage(1);
              }}>
                <SelectTrigger className="text-sm">
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
              <Label htmlFor="estadoFilter" className="text-sm">Estado</Label>
              <Select value={filters.estado || 'all'} onValueChange={(value) => {
                setFilters({...filters, estado: value === 'all' ? '' : value});
                setCurrentPage(1);
              }}>
                <SelectTrigger className="text-sm">
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
              <Label htmlFor="statusFilter" className="text-sm">Status</Label>
              <Select value={filters.status || 'all'} onValueChange={(value) => {
                setFilters({...filters, status: value === 'all' ? '' : value});
                setCurrentPage(1);
              }}>
                <SelectTrigger className="text-sm">
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
            <CardTitle className="text-lg">
              Histórico de Equipamentos ({formatNumber(totalCount)})
            </CardTitle>
            <div className="text-sm text-gray-600">
              Página {currentPage} de {totalPages} ({itemsPerPage} por página)
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-4 p-4">
                {equipments.map(equipment => (
                  <Card key={equipment.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{equipment.tipo}</p>
                            <p className="text-xs text-gray-600">{equipment.modelo || '-'}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            equipment.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                            equipment.status === 'danificado' ? 'bg-red-100 text-red-800' :
                            equipment.status === 'em_uso' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {getStatusLabel(equipment.status)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Série:</p>
                          <p className="font-mono text-sm">{equipment.numero_serie}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Empresa:</p>
                          <p className="text-sm">{equipment.empresas?.name || 'N/A'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">Estado:</p>
                            <p>{equipment.estado || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Entrada:</p>
                            <p>{new Date(equipment.data_entrada).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingEquipment(equipment);
                              setShowForm(true);
                            }}
                            className="flex-1"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteEquipment(equipment.id)}
                            className="flex-1 text-red-600 hover:text-red-800"
                          >
                            <Trash className="h-3 w-3 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <table className="hidden sm:table w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 text-sm font-medium">Tipo</th>
                    <th className="text-left p-2 text-sm font-medium">Modelo</th>
                    <th className="text-left p-2 text-sm font-medium">Série</th>
                    <th className="text-left p-2 text-sm font-medium">Empresa</th>
                    <th className="text-left p-2 text-sm font-medium">Estado</th>
                    <th className="text-left p-2 text-sm font-medium">Status</th>
                    <th className="text-left p-2 text-sm font-medium">Entrada</th>
                    <th className="text-left p-2 text-sm font-medium">Saída</th>
                    <th className="text-left p-2 text-sm font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {equipments.map(equipment => (
                    <tr key={equipment.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 text-sm">{equipment.tipo}</td>
                      <td className="p-2 text-sm">{equipment.modelo || '-'}</td>
                      <td className="p-2 font-mono text-sm">{equipment.numero_serie}</td>
                      <td className="p-2 text-sm">{equipment.empresas?.name || 'N/A'}</td>
                      <td className="p-2 text-sm">{equipment.estado || '-'}</td>
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
                      <td className="p-2 text-sm">{new Date(equipment.data_entrada).toLocaleDateString('pt-BR')}</td>
                      <td className="p-2 text-sm">
                        {equipment.data_saida ? new Date(equipment.data_saida).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
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

              {equipments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum equipamento encontrado
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} equipamentos
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  
                  {/* Show page numbers with ellipsis for mobile */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          onClick={() => setCurrentPage(pageNum)}
                          isActive={currentPage === pageNum}
                          className="cursor-pointer"
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
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
