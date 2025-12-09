
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';

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
  const [openMaintenance, setOpenMaintenance] = useState(false);
  const [maintenanceSearch, setMaintenanceSearch] = useState('');

  const filteredMaintenanceTypes = useMemo(() => {
    if (!maintenanceSearch) return maintenanceTypes;
    return maintenanceTypes.filter(type => 
      type.codigo.toLowerCase().includes(maintenanceSearch.toLowerCase()) ||
      type.descricao.toLowerCase().includes(maintenanceSearch.toLowerCase())
    );
  }, [maintenanceTypes, maintenanceSearch]);

  const selectedMaintenanceLabel = useMemo(() => {
    if (selectedMaintenanceType === 'all') return 'Todas as manutenções';
    const found = maintenanceTypes.find(t => t.codigo === selectedMaintenanceType);
    return found ? `${found.descricao} (${found.codigo})` : 'Todas as manutenções';
  }, [selectedMaintenanceType, maintenanceTypes]);

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
            <Popover open={openMaintenance} onOpenChange={setOpenMaintenance}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between font-normal"
                >
                  <span className="truncate">{selectedMaintenanceLabel}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0 z-50 bg-background">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Buscar por código ou descrição..." 
                    value={maintenanceSearch}
                    onValueChange={setMaintenanceSearch}
                  />
                  <CommandList>
                    <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          onMaintenanceTypeChange('all');
                          setMaintenanceSearch('');
                          setOpenMaintenance(false);
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedMaintenanceType === 'all' ? "opacity-100" : "opacity-0")} />
                        Todas as manutenções
                      </CommandItem>
                      {filteredMaintenanceTypes.map((type) => (
                        <CommandItem
                          key={type.id}
                          value={type.codigo}
                          onSelect={() => {
                            onMaintenanceTypeChange(type.codigo);
                            setMaintenanceSearch('');
                            setOpenMaintenance(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", selectedMaintenanceType === type.codigo ? "opacity-100" : "opacity-0")} />
                          {type.descricao} ({type.codigo})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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
