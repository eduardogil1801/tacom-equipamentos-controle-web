
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface Company {
  id: string;
  name: string;
}

interface EquipmentType {
  id: string;
  nome: string;
}

interface DashboardFiltersProps {
  companies: Company[];
  equipmentTypes: EquipmentType[];
  selectedCompany: string;
  selectedEquipmentType: string;
  onCompanyChange: (value: string) => void;
  onEquipmentTypeChange: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  companies,
  equipmentTypes,
  selectedCompany,
  selectedEquipmentType,
  onCompanyChange,
  onEquipmentTypeChange,
  onRefresh,
  loading
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Empresa</label>
            <Select value={selectedCompany} onValueChange={onCompanyChange}>
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
            <label className="text-sm font-medium mb-2 block">Tipo de Equipamento</label>
            <Select value={selectedEquipmentType} onValueChange={onEquipmentTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {equipmentTypes.map(type => (
                  <SelectItem key={type.id} value={type.nome}>
                    {type.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Ações</label>
            <Button 
              onClick={onRefresh} 
              disabled={loading}
              className="w-full flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardFilters;
