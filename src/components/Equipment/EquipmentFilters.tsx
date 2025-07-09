
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EquipmentFiltersProps {
  onFiltersChange: (filters: FilterValues) => void;
  onClearFilters: () => void;
}

interface FilterValues {
  searchTerm: string;
  selectedCompany: string;
  selectedStatus: string;
  selectedType: string;
  selectedModel: string;
  selectedState: string;
}

interface Company {
  id: string;
  name: string;
}

const EquipmentFilters: React.FC<EquipmentFiltersProps> = ({ onFiltersChange, onClearFilters }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [equipmentModels, setEquipmentModels] = useState<string[]>([]);
  const [equipmentStates, setEquipmentStates] = useState<string[]>([]);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('empresas')
        .select('id, name')
        .order('name');

      if (companiesError) throw companiesError;
      console.log('Companies loaded in filters:', companiesData);
      setCompanies(companiesData || []);

      // Load equipment data for filter options
      const { data: equipmentsData, error: equipmentsError } = await supabase
        .from('equipamentos')
        .select('tipo, modelo, estado');

      if (equipmentsError) throw equipmentsError;

      // Extract unique values for filters
      const types = [...new Set(equipmentsData?.map(eq => eq.tipo).filter(Boolean) || [])];
      const models = [...new Set(equipmentsData?.map(eq => eq.modelo).filter(Boolean) || [])];
      const states = [...new Set(equipmentsData?.map(eq => eq.estado).filter(Boolean) || [])];

      setEquipmentTypes(types.sort());
      setEquipmentModels(models.sort());
      setEquipmentStates(states.sort());
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const handleApplyFilters = () => {
    const filters: FilterValues = {
      searchTerm,
      selectedCompany,
      selectedStatus,
      selectedType,
      selectedModel,
      selectedState
    };
    onFiltersChange(filters);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCompany('');
    setSelectedStatus('');
    setSelectedType('');
    setSelectedModel('');
    setSelectedState('');
    onClearFilters();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtros de Equipamentos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <Input
              id="search"
              placeholder="Número de série..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="company">Empresa</Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
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
            <Label htmlFor="status">Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="em_uso">Em Uso</SelectItem>
                <SelectItem value="aguardando_manutencao">Aguardando Manutenção</SelectItem>
                <SelectItem value="em_manutencao">Em Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {equipmentTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="model">Modelo</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os modelos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os modelos</SelectItem>
                {equipmentModels.map(model => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="state">Estado</Label>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {equipmentStates.map(state => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleApplyFilters} className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Aplicar Filtros
          </Button>
          <Button variant="outline" onClick={handleClearFilters} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentFilters;
