
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllRows } from '@/utils/fetchAllRows';


interface EquipmentFiltersProps {
  filters: FilterValues;
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

const EquipmentFilters: React.FC<EquipmentFiltersProps> = ({ filters, onFiltersChange, onClearFilters }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [equipmentModels, setEquipmentModels] = useState<string[]>([]);
  const [equipmentStates, setEquipmentStates] = useState<string[]>([]);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      // Load companies (com estado)
      const { data: companiesData, error: companiesError } = await supabase
        .from('empresas')
        .select('id, name, estado')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Load equipment data for filter options (paginado)
      const equipmentsData = await fetchAllRows<{ tipo: string; modelo: string | null; estado: string | null }>(
        (from, to) =>
          supabase.from('equipamentos').select('tipo, modelo, estado').range(from, to) as any
      );

      // Estados cadastrados no sistema
      const { data: estadosData } = await supabase
        .from('estados')
        .select('nome')
        .eq('ativo', true)
        .order('nome');

      const types = [...new Set(equipmentsData.map(eq => eq.tipo).filter(Boolean))] as string[];
      const models = [...new Set(equipmentsData.map(eq => eq.modelo).filter(Boolean))] as string[];
      const states = [...new Set([
        ...(estadosData?.map(e => e.nome) || []),
        ...(companiesData?.map(c => c.estado) || []),
        ...equipmentsData.map(eq => eq.estado),
      ].filter(Boolean))] as string[];

      setEquipmentTypes(types.sort());
      setEquipmentModels(models.sort());
      setEquipmentStates(states.sort());
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };


  const updateFilter = (field: keyof FilterValues, value: string) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  const handleClearFilters = () => {
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
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="company">Empresa</Label>
            <Select value={filters.selectedCompany} onValueChange={(value) => updateFilter('selectedCompany', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto bg-white border border-gray-200 shadow-lg z-50">
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
            <Select value={filters.selectedStatus} onValueChange={(value) => updateFilter('selectedStatus', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto bg-white border border-gray-200 shadow-lg z-50">
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="em_uso">Em Uso</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="aguardando_manutencao">Aguardando Manutenção</SelectItem>
                <SelectItem value="danificado">Danificado</SelectItem>
                <SelectItem value="indisponivel">Indisponível</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select value={filters.selectedType} onValueChange={(value) => updateFilter('selectedType', value)}>
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
            <Select value={filters.selectedModel} onValueChange={(value) => updateFilter('selectedModel', value)}>
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
            <Select value={filters.selectedState} onValueChange={(value) => updateFilter('selectedState', value)}>
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
          <Button onClick={() => onFiltersChange({ ...filters })} className="flex items-center gap-2">
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
