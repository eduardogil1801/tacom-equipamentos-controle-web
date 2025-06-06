
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';

interface DashboardFiltersProps {
  companies: Array<{ id: string; name: string; estado?: string }>;
  selectedCompany: string;
  selectedState: string;
  selectedStatus: string;
  selectedType: string;
  serialSearch: string;
  onCompanyChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSerialSearchChange: (value: string) => void;
  onClearFilters: () => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  companies,
  selectedCompany,
  selectedState,
  selectedStatus,
  selectedType,
  serialSearch,
  onCompanyChange,
  onStateChange,
  onStatusChange,
  onTypeChange,
  onSerialSearchChange,
  onClearFilters
}) => {
  const estados = ['Rio Grande do Sul', 'Santa Catarina', 'Minas Gerais'];
  
  const statusOptions = [
    'disponivel',
    'recuperados',
    'aguardando_despacho_contagem',
    'enviados_manutencao_contagem',
    'aguardando_manutencao',
    'em_uso',
    'danificado'
  ];

  const equipmentTypes = [
    'CCIT 4.0',
    'CCIT 5.0',
    'PM (Painel de Motorista)',
    'UPEX',
    'Connections 4.0',
    'Connections 5.0'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros do Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company-filter">Empresa</Label>
            <Select value={selectedCompany} onValueChange={onCompanyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as empresas</SelectItem>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="state-filter">Estado</Label>
            <Select value={selectedState} onValueChange={onStateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os estados</SelectItem>
                {estados.map(estado => (
                  <SelectItem key={estado} value={estado}>
                    {estado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                {statusOptions.map(status => (
                  <SelectItem key={status} value={status}>
                    {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type-filter">Tipo de Equipamento</Label>
            <Select value={selectedType} onValueChange={onTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                {equipmentTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serial-search">Número de Série</Label>
            <Input
              id="serial-search"
              placeholder="Buscar por número de série"
              value={serialSearch}
              onChange={(e) => onSerialSearchChange(e.target.value)}
            />
          </div>

          <div className="space-y-2 flex items-end">
            <button
              onClick={onClearFilters}
              className="w-full px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardFilters;
