
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

interface MaintenanceType {
  id: string;
  codigo: string;
  descricao: string;
}

interface DashboardFiltersProps {
  companies: Company[];
  equipmentTypes: EquipmentType[];
  maintenanceTypes: MaintenanceType[];
  selectedCompany: string;
  selectedEquipmentType: string;
  selectedMaintenanceType: string;
  selectedStatus: string;
  onCompanyChange: (value: string) => void;
  onEquipmentTypeChange: (value: string) => void;
  onMaintenanceTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  companies,
  equipmentTypes,
  maintenanceTypes,
  selectedCompany,
  selectedEquipmentType,
  selectedMaintenanceType,
  selectedStatus,
  onCompanyChange,
  onEquipmentTypeChange,
  onMaintenanceTypeChange,
  onStatusChange,
  onRefresh,
  loading
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <label className="text-sm font-medium mb-2 block">Tipo de Manutenção</label>
            <Select value={selectedMaintenanceType} onValueChange={onMaintenanceTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as manutenções" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as manutenções</SelectItem>
                {maintenanceTypes.map(type => (
                  <SelectItem key={type.id} value={type.codigo}>
                    {type.descricao} ({type.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="em_uso">Em Uso</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="aguardando_manutencao">Aguardando Manutenção</SelectItem>
                <SelectItem value="danificado">Danificado</SelectItem>
                <SelectItem value="indisponivel">Indisponível</SelectItem>
                <SelectItem value="devolvido">Devolvido</SelectItem>
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
