
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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
      console.log('Companies loaded in equipment list:', companiesData);
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
      toast({
        title: "Erro",
        description: "Erro ao carregar dados.",
        variant: "destructive",
      });
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
    console.log('handleAddNew called');
    setEditingEquipment(null);
    setShowForm(true);
  };

  const handleEdit = (equipment: Equipment) => {
    console.log('handleEdit called with equipment:', equipment);
    setEditingEquipment(equipment);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    console.log('handleDelete called with id:', id);
    if (confirm('Tem certeza que deseja excluir este equipamento?')) {
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
          description: "Erro ao excluir equipamento.",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusBadge = (equipment: Equipment) => {
    const status = equipment.status || 'disponivel';
    
    console.log('Status do equipamento:', equipment.numero_serie, 'Status:', status);
    
    switch (status) {
      case 'disponivel':
        return <Badge className="bg-green-500 text-white hover:bg-green-600">Disponível</Badge>;
      case 'manutencao':
        return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Manutenção</Badge>;
      case 'em_uso':
        return <Badge className="bg-blue-500 text-white hover:bg-blue-600">Em Uso</Badge>;
      case 'aguardando_manutencao':
        return <Badge className="bg-orange-500 text-white hover:bg-orange-600">Aguardando Manutenção</Badge>;
      case 'danificado':
        return <Badge className="bg-red-500 text-white hover:bg-red-600">Danificado</Badge>;
      case 'indisponivel':
        return <Badge className="bg-red-700 text-white hover:bg-red-800">Indisponível</Badge>;
      default:
        return <Badge className="bg-gray-500 text-white hover:bg-gray-600">Status Desconhecido</Badge>;
    }
  };

  const handleFormClose = () => {
    console.log('handleFormClose called');
    setShowForm(false);
    setEditingEquipment(null);
  };

  const handleFormSave = () => {
    console.log('handleFormSave called');
    setShowForm(false);
    setEditingEquipment(null);
    loadData(); // Recarregar dados após salvar
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  // If showing form, render the form component
  if (showForm) {
    return (
      <EquipmentForm
        equipment={editingEquipment}
        companies={companies}
        onCancel={handleFormClose}
        onSave={handleFormSave}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Controle de Equipamentos</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowBulkImport(true)}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Importar Lote
          </Button>
          <Button 
            onClick={handleAddNew} 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Equipamento
          </Button>
        </div>
      </div>

      <EquipmentFilters 
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

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
                    {equipment.data_entrada ? new Date(equipment.data_entrada + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
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

      {showBulkImport && (
        <BulkImportDialog
          isOpen={showBulkImport}
          onClose={() => setShowBulkImport(false)}
          onImportComplete={() => {
            setShowBulkImport(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default EquipmentList;
