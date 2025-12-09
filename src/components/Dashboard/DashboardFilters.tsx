
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const statusOptions = [
  { value: 'all', label: 'Todos os status' },
  { value: 'disponivel', label: 'Disponível' },
  { value: 'em_uso', label: 'Em Uso' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'aguardando_manutencao', label: 'Aguardando Manutenção' },
  { value: 'danificado', label: 'Danificado' },
  { value: 'indisponivel', label: 'Indisponível' },
  { value: 'devolvido', label: 'Devolvido' },
];

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
  const [openCompany, setOpenCompany] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  
  const [openEquipmentType, setOpenEquipmentType] = useState(false);
  const [equipmentTypeSearch, setEquipmentTypeSearch] = useState('');
  
  const [openMaintenance, setOpenMaintenance] = useState(false);
  const [maintenanceSearch, setMaintenanceSearch] = useState('');
  
  const [openStatus, setOpenStatus] = useState(false);
  const [statusSearch, setStatusSearch] = useState('');

  // Filtros
  const filteredCompanies = useMemo(() => {
    if (!companySearch) return companies;
    return companies.filter(c => c.name.toLowerCase().includes(companySearch.toLowerCase()));
  }, [companies, companySearch]);

  const filteredEquipmentTypes = useMemo(() => {
    if (!equipmentTypeSearch) return equipmentTypes;
    return equipmentTypes.filter(t => t.nome.toLowerCase().includes(equipmentTypeSearch.toLowerCase()));
  }, [equipmentTypes, equipmentTypeSearch]);

  const filteredMaintenanceTypes = useMemo(() => {
    if (!maintenanceSearch) return maintenanceTypes;
    return maintenanceTypes.filter(type => 
      type.codigo.toLowerCase().includes(maintenanceSearch.toLowerCase()) ||
      type.descricao.toLowerCase().includes(maintenanceSearch.toLowerCase())
    );
  }, [maintenanceTypes, maintenanceSearch]);

  const filteredStatusOptions = useMemo(() => {
    if (!statusSearch) return statusOptions;
    return statusOptions.filter(s => s.label.toLowerCase().includes(statusSearch.toLowerCase()));
  }, [statusSearch]);

  // Labels
  const selectedCompanyLabel = useMemo(() => {
    if (selectedCompany === 'all') return 'Todas as empresas';
    const found = companies.find(c => c.id === selectedCompany);
    return found ? found.name : 'Todas as empresas';
  }, [selectedCompany, companies]);

  const selectedEquipmentTypeLabel = useMemo(() => {
    if (selectedEquipmentType === 'all') return 'Todos os tipos';
    const found = equipmentTypes.find(t => t.nome === selectedEquipmentType);
    return found ? found.nome : 'Todos os tipos';
  }, [selectedEquipmentType, equipmentTypes]);

  const selectedMaintenanceLabel = useMemo(() => {
    if (selectedMaintenanceType === 'all') return 'Todas as manutenções';
    const found = maintenanceTypes.find(t => t.codigo === selectedMaintenanceType);
    return found ? `${found.descricao} (${found.codigo})` : 'Todas as manutenções';
  }, [selectedMaintenanceType, maintenanceTypes]);

  const selectedStatusLabel = useMemo(() => {
    const found = statusOptions.find(s => s.value === selectedStatus);
    return found ? found.label : 'Todos os status';
  }, [selectedStatus]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Empresa */}
          <div>
            <label className="text-sm font-medium mb-2 block">Empresa</label>
            <Popover open={openCompany} onOpenChange={setOpenCompany}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  <span className="truncate">{selectedCompanyLabel}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 z-50 bg-background">
                <Command shouldFilter={false}>
                  <CommandInput placeholder="Buscar empresa..." value={companySearch} onValueChange={setCompanySearch} />
                  <CommandList>
                    <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value="all" onSelect={() => { onCompanyChange('all'); setCompanySearch(''); setOpenCompany(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", selectedCompany === 'all' ? "opacity-100" : "opacity-0")} />
                        Todas as empresas
                      </CommandItem>
                      {filteredCompanies.map((company) => (
                        <CommandItem key={company.id} value={company.id} onSelect={() => { onCompanyChange(company.id); setCompanySearch(''); setOpenCompany(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", selectedCompany === company.id ? "opacity-100" : "opacity-0")} />
                          {company.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Tipo de Equipamento */}
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de Equipamento</label>
            <Popover open={openEquipmentType} onOpenChange={setOpenEquipmentType}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  <span className="truncate">{selectedEquipmentTypeLabel}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0 z-50 bg-background">
                <Command shouldFilter={false}>
                  <CommandInput placeholder="Buscar tipo..." value={equipmentTypeSearch} onValueChange={setEquipmentTypeSearch} />
                  <CommandList>
                    <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value="all" onSelect={() => { onEquipmentTypeChange('all'); setEquipmentTypeSearch(''); setOpenEquipmentType(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", selectedEquipmentType === 'all' ? "opacity-100" : "opacity-0")} />
                        Todos os tipos
                      </CommandItem>
                      {filteredEquipmentTypes.map((type) => (
                        <CommandItem key={type.id} value={type.nome} onSelect={() => { onEquipmentTypeChange(type.nome); setEquipmentTypeSearch(''); setOpenEquipmentType(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", selectedEquipmentType === type.nome ? "opacity-100" : "opacity-0")} />
                          {type.nome}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Tipo de Manutenção */}
          <div>
            <label className="text-sm font-medium mb-2 block">Tipo de Manutenção</label>
            <Popover open={openMaintenance} onOpenChange={setOpenMaintenance}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  <span className="truncate">{selectedMaintenanceLabel}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0 z-50 bg-background">
                <Command shouldFilter={false}>
                  <CommandInput placeholder="Buscar por código ou descrição..." value={maintenanceSearch} onValueChange={setMaintenanceSearch} />
                  <CommandList>
                    <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem value="all" onSelect={() => { onMaintenanceTypeChange('all'); setMaintenanceSearch(''); setOpenMaintenance(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", selectedMaintenanceType === 'all' ? "opacity-100" : "opacity-0")} />
                        Todas as manutenções
                      </CommandItem>
                      {filteredMaintenanceTypes.map((type) => (
                        <CommandItem key={type.id} value={type.codigo} onSelect={() => { onMaintenanceTypeChange(type.codigo); setMaintenanceSearch(''); setOpenMaintenance(false); }}>
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
          
          {/* Status */}
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Popover open={openStatus} onOpenChange={setOpenStatus}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  <span className="truncate">{selectedStatusLabel}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0 z-50 bg-background">
                <Command shouldFilter={false}>
                  <CommandInput placeholder="Buscar status..." value={statusSearch} onValueChange={setStatusSearch} />
                  <CommandList>
                    <CommandEmpty>Nenhum status encontrado.</CommandEmpty>
                    <CommandGroup>
                      {filteredStatusOptions.map((status) => (
                        <CommandItem key={status.value} value={status.value} onSelect={() => { onStatusChange(status.value); setStatusSearch(''); setOpenStatus(false); }}>
                          <Check className={cn("mr-2 h-4 w-4", selectedStatus === status.value ? "opacity-100" : "opacity-0")} />
                          {status.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Ações */}
          <div>
            <label className="text-sm font-medium mb-2 block">Ações</label>
            <Button onClick={onRefresh} disabled={loading} className="w-full flex items-center gap-2">
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
