
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Filter, X, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import EquipmentForm from './EquipmentForm';
import EquipmentFilters from './EquipmentFilters';
import BulkImportDialog from './BulkImportDialog';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  modelo?: string;
  estado?: string;
  status?: string;
  data_entrada: string;
  data_saida?: string;
  id_empresa: string;
  empresas?: {
    name: string;
    estado?: string;
  };
}

interface Company {
  id: string;
  name: string;
}

interface FilterValues {
  searchTerm: string;
  selectedCompany: string;
  selectedStatus: string;
  selectedType: string;
  selectedModel: string;
  selectedState: string;
}

const EquipmentList: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('empresas')
        .select('id, name')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Load equipments with company data
      const { data: equipmentsData, error: equipmentsError } = await supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name,
            estado
          )
        `)
        .order('data_entrada', { ascending: false });

      if (equipmentsError) throw equipmentsError;
      setEquipments(equipmentsData || []);
      setFilteredEquipments(equipmentsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltersChange = (filters: FilterValues) => {
    let filtered = [...equipments];

    // Search term filter
    if (filters.searchTerm) {
      filtered = filtered.filter(eq => 
        eq.numero_serie.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        eq.tipo.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (eq.modelo && eq.modelo.toLowerCase().includes(filters.searchTerm.toLowerCase()))
      );
    }

    // Company filter
    if (filters.selectedCompany && filters.selectedCompany !== 'all') {
      filtered = filtered.filter(eq => eq.id_empresa === filters.selectedCompany);
    }

    // Status filter
    if (filters.selectedStatus && filters.selectedStatus !== 'all') {
      if (filters.selectedStatus === 'disponivel') {
        filtered = filtered.filter(eq => !eq.data_saida);
      } else if (filters.selectedStatus === 'em_uso') {
        filtered = filtered.filter(eq => eq.data_saida && eq.status !== 'em_manutencao');
      } else {
        filtered = filtered.filter(eq => eq.status === filters.selectedStatus);
      }
    }

    // Type filter
    if (filters.selectedType && filters.selectedType !== 'all') {
      filtered = filtered.filter(eq => eq.tipo === filters.selectedType);
    }

    // Model filter
    if (filters.selectedModel && filters.selectedModel !== 'all') {
      filtered = filtered.filter(eq => eq.modelo === filters.selectedModel);
    }

    // State filter
    if (filters.selectedState && filters.selectedState !== 'all') {
      filtered = filtered.filter(eq => eq.estado === filters.selectedState);
    }

    setFilteredEquipments(filtered);
  };

  const handleClearFilters = () => {
    setFilteredEquipments(equipments);
  };

  const handleAddNew = () => {
    setEditingEquipment(null);
    setShowForm(true);
  };

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este equipamento?')) {
      try {
        const { error } = await supabase
          .from('equipamentos')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        loadData();
      } catch (error) {
        console.error('Error deleting equipment:', error);
      }
    }
  };

  const getStatusBadge = (equipment: Equipment) => {
    if (equipment.data_saida) {
      if (equipment.status === 'em_manutencao') {
        return <Badge variant="destructive">Em Manutenção</Badge>;
      }
      return <Badge variant="secondary">Em Uso</Badge>;
    }
    return <Badge variant="default">Disponível</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Controle de Equipamentos</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Importar Lote
          </Button>
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Equipamento
          </Button>
        </div>
      </div>

      {showFilters && (
        <EquipmentFilters 
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Equipamentos Cadastrados ({filteredEquipments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número de Série</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Entrada</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipments.map((equipment) => (
                <TableRow key={equipment.id}>
                  <TableCell className="font-medium">{equipment.numero_serie}</TableCell>
                  <TableCell>{equipment.tipo}</TableCell>
                  <TableCell>{equipment.modelo || '-'}</TableCell>
                  <TableCell>{equipment.empresas?.name || 'N/A'}</TableCell>
                  <TableCell>{equipment.empresas?.estado || equipment.estado || '-'}</TableCell>
                  <TableCell>{getStatusBadge(equipment)}</TableCell>
                  <TableCell>
                    {new Date(equipment.data_entrada).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(equipment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(equipment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showForm && (
        <EquipmentForm
          equipment={editingEquipment}
          companies={companies}
          onCancel={() => {
            setShowForm(false);
            setEditingEquipment(null);
          }}
          onSave={() => {
            setShowForm(false);
            setEditingEquipment(null);
            loadData();
          }}
        />
      )}

      {showBulkImport && (
        <BulkImportDialog
          isOpen={showBulkImport}
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => {
            setShowBulkImport(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default EquipmentList;
