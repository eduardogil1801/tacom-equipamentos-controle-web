
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, Trash } from 'lucide-react';
import EquipmentForm from './EquipmentForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Equipment {
  id: string;
  tipo: string;
  numero_serie: string;
  data_entrada: string;
  data_saida?: string;
  id_empresa: string;
  estado?: string;
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
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    numero_serie: '',
    company: '',
    data_entrada: '',
    data_saida: '',
    estado: ''
  });

  useEffect(() => {
    loadData();
  }, []);

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

      // Load equipments with company names
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

  const filteredEquipments = equipments.filter(equipment => {
    const company = equipment.empresas;
    return (
      equipment.numero_serie.toLowerCase().includes(filters.numero_serie.toLowerCase()) &&
      (company?.name.toLowerCase().includes(filters.company.toLowerCase()) || !filters.company) &&
      (equipment.data_entrada.includes(filters.data_entrada) || !filters.data_entrada) &&
      (equipment.data_saida?.includes(filters.data_saida) || !filters.data_saida) &&
      (equipment.estado?.toLowerCase().includes(filters.estado.toLowerCase()) || !filters.estado)
    );
  });

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
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Equipamento
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="serialFilter">Número de Série</Label>
              <Input
                id="serialFilter"
                placeholder="Filtrar por série..."
                value={filters.numero_serie}
                onChange={(e) => setFilters({...filters, numero_serie: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="companyFilter">Empresa</Label>
              <Input
                id="companyFilter"
                placeholder="Filtrar por empresa..."
                value={filters.company}
                onChange={(e) => setFilters({...filters, company: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="estadoFilter">Estado</Label>
              <Input
                id="estadoFilter"
                placeholder="Filtrar por estado..."
                value={filters.estado}
                onChange={(e) => setFilters({...filters, estado: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="entryDateFilter">Data de Entrada</Label>
              <Input
                id="entryDateFilter"
                type="date"
                value={filters.data_entrada}
                onChange={(e) => setFilters({...filters, data_entrada: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="exitDateFilter">Data de Saída</Label>
              <Input
                id="exitDateFilter"
                type="date"
                value={filters.data_saida}
                onChange={(e) => setFilters({...filters, data_saida: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment List */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Equipamentos ({filteredEquipments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Série</th>
                  <th className="text-left p-2">Empresa</th>
                  <th className="text-left p-2">Estado</th>
                  <th className="text-left p-2">Entrada</th>
                  <th className="text-left p-2">Saída</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipments.map(equipment => (
                  <tr key={equipment.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{equipment.tipo}</td>
                    <td className="p-2 font-mono">{equipment.numero_serie}</td>
                    <td className="p-2">{equipment.empresas?.name || 'N/A'}</td>
                    <td className="p-2">{equipment.estado || '-'}</td>
                    <td className="p-2">{new Date(equipment.data_entrada).toLocaleDateString('pt-BR')}</td>
                    <td className="p-2">
                      {equipment.data_saida ? new Date(equipment.data_saida).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        equipment.data_saida 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {equipment.data_saida ? 'Retirado' : 'Em Estoque'}
                      </span>
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
    </div>
  );
};

export default EquipmentList;
