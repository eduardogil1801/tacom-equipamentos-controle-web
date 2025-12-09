import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import MovementStatusSelector from './MovementStatusSelector';
import MovementEquipmentSelector from './MovementEquipmentSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Company {
  id: string;
  name: string;
}

interface MaintenanceType {
  id: string;
  descricao: string;
  codigo: string;
}

interface EquipmentType {
  id: string;
  nome: string;
}

interface MovementData {
  tipo_movimento: string;
  data_movimento: string;
  observacoes: string;
  empresa_destino: string;
  empresa_origem?: string;
  tipo_manutencao_id: string;
  defeito_reclamado_id?: string;
  defeito_encontrado_id?: string;
  outro_defeito_id?: string;
  tipo_equipamento: string;
  modelo_equipamento: string;
  status_equipamento: string;
}

interface MovementFormFieldsProps {
  movementData: MovementData;
  companies: Company[];
  maintenanceTypes: MaintenanceType[];
  equipmentTypes: EquipmentType[];
  isDestinationTacom: boolean;
  selectedEquipments: any[];
  onInputChange: (field: string, value: string) => void;
  onEquipmentSelect: (equipments: any[]) => void;
  onRemoveEquipment: (equipmentId: string) => void;
}

const MovementFormFields: React.FC<MovementFormFieldsProps> = ({
  movementData,
  companies,
  maintenanceTypes = [],
  equipmentTypes,
  isDestinationTacom,
  selectedEquipments,
  onInputChange,
  onEquipmentSelect,
  onRemoveEquipment
}) => {
  
  // Estados para os popovers
  const [openDR, setOpenDR] = useState(false);
  const [openDE, setOpenDE] = useState(false);
  const [openOutro, setOpenOutro] = useState(false);

  // Filtrar por código DR e DE
  const defeitosReclamados = useMemo(() => 
    maintenanceTypes.filter(type => 
      type.codigo.toUpperCase().startsWith('DR')
    ), [maintenanceTypes]);
  
  const defeitosEncontrados = useMemo(() => 
    maintenanceTypes.filter(type => 
      type.codigo.toUpperCase().startsWith('DE') || type.codigo.toUpperCase().startsWith('ER')
    ), [maintenanceTypes]);
  
  // Filtrar Outros Defeitos (categoria_defeito = 'outro')
  const outrosDefeitos = useMemo(() => 
    maintenanceTypes.filter(type => {
      // Primeiro verifica categoria_defeito se disponível
      if ((type as any).categoria_defeito === 'outro') return true;
      // Fallback para códigos que não começam com DR ou DE
      const code = type.codigo.toUpperCase();
      return !code.startsWith('DR') && !code.startsWith('DE') && !code.startsWith('ER');
    }), [maintenanceTypes]);

  // Verificar se deve mostrar campos de defeitos
  const shouldShowDefeitosFields = 
    movementData.tipo_movimento === 'manutencao' || 
    movementData.tipo_movimento === 'movimentacao_interna' || 
    movementData.tipo_movimento === 'envio_manutencao' ||
    movementData.tipo_movimento === 'devolucao' ||
    movementData.tipo_movimento === 'retorno_manutencao';

  // Verificar se DR é obrigatório (somente se Outro Defeito não está selecionado)
  const isDRRequired = shouldShowDefeitosFields && 
    movementData.tipo_movimento === 'manutencao' && 
    !movementData.outro_defeito_id;

  const getDestinationCompanies = () => {
    if (movementData.tipo_movimento === 'envio_manutencao') {
      return companies.filter(c => c.name === 'TACOM PROJETOS (CTG)');
    }
    return companies;
  };

  const getOriginCompanies = () => {
    if (movementData.tipo_movimento === 'envio_manutencao') {
      return companies.filter(c => 
        c.name === 'TACOM SISTEMAS POA' || c.name === 'TACOM PROJETOS SC'
      );
    }
    return companies;
  };

  // Obter label do item selecionado
  const getSelectedLabel = (items: MaintenanceType[], selectedId: string | undefined) => {
    if (!selectedId) return '';
    const item = items.find(i => i.id === selectedId);
    return item ? `${item.codigo} - ${item.descricao}` : '';
  };

  React.useEffect(() => {
    if (movementData.tipo_movimento === 'movimentacao_interna') {
      const tacomCompany = companies.find(c => c.name === 'TACOM SISTEMAS POA');
      if (tacomCompany) {
        onInputChange('empresa_destino', tacomCompany.id);
        onInputChange('empresa_origem', tacomCompany.name);
      }
    } else if (movementData.tipo_movimento === 'envio_manutencao') {
      const tacomCtgCompany = companies.find(c => c.name === 'TACOM PROJETOS (CTG)');
      if (tacomCtgCompany) {
        onInputChange('empresa_destino', tacomCtgCompany.id);
      }
    }
  }, [movementData.tipo_movimento, companies, onInputChange]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado Esquerdo */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="tipo_movimento">Tipo de Movimentação *</Label>
            <Select
              value={movementData.tipo_movimento}
              onValueChange={(value) => onInputChange('tipo_movimento', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="movimentacao">Alocação</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="devolucao">Devolução</SelectItem>
                <SelectItem value="retorno_manutencao">Retorno de Manutenção</SelectItem>
                <SelectItem value="movimentacao_interna">Movimentação Interna</SelectItem>
                <SelectItem value="envio_manutencao">Envio Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tipo_equipamento">Tipo de Equipamento *</Label>
            <Select
              value={movementData.tipo_equipamento}
              onValueChange={(value) => onInputChange('tipo_equipamento', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {equipmentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.nome}>
                    {type.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <MovementEquipmentSelector
            selectedEquipments={selectedEquipments}
            onEquipmentSelect={onEquipmentSelect}
            onRemoveEquipment={onRemoveEquipment}
            equipmentType={movementData.tipo_equipamento}
            companyFilter={movementData.tipo_movimento === 'movimentacao_interna' ? 'TACOM SISTEMAS POA' : undefined}
          />

          <div>
            <Label htmlFor="empresa_origem">Empresa Origem</Label>
            {movementData.tipo_movimento === 'envio_manutencao' ? (
              <Select
                value={movementData.empresa_origem}
                onValueChange={(value) => onInputChange('empresa_origem', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa origem" />
                </SelectTrigger>
                <SelectContent>
                  {getOriginCompanies().map((company) => (
                    <SelectItem key={company.id} value={company.name}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="empresa_origem"
                value={movementData.empresa_origem || ''}
                readOnly
                placeholder="Será preenchido automaticamente"
                className="bg-gray-50"
              />
            )}
          </div>

          <div>
            <Label htmlFor="empresa_destino">Empresa Destino *</Label>
            <Select
              value={movementData.empresa_destino}
              onValueChange={(value) => onInputChange('empresa_destino', value)}
              disabled={movementData.tipo_movimento === 'movimentacao_interna' || movementData.tipo_movimento === 'envio_manutencao'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa destino" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {getDestinationCompanies().map((company) => (
                  <SelectItem 
                    key={company.id} 
                    value={company.id}
                    className="text-sm"
                  >
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Data da Movimentação - Movido para abaixo de Empresa Destino */}
          <div>
            <Label htmlFor="data_movimento">Data da Movimentação *</Label>
            <Input
              id="data_movimento"
              type="date"
              value={movementData.data_movimento}
              onChange={(e) => onInputChange('data_movimento', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Lado Direito */}
        <div className="space-y-4">
          {/* CAMPOS DR, DE e OUTROS DEFEITOS com Autocomplete */}
          {shouldShowDefeitosFields && (
            <>
              {/* Outros Defeitos - Novo campo no topo direito */}
              <div>
                <Label htmlFor="outro_defeito_id" className="text-purple-600 font-semibold">
                  Outros Defeitos {!movementData.defeito_reclamado_id && movementData.tipo_movimento === 'manutencao' ? '*' : ''}
                </Label>
                <Popover open={openOutro} onOpenChange={setOpenOutro}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openOutro}
                      className="w-full justify-between border-purple-300"
                    >
                      {movementData.outro_defeito_id
                        ? getSelectedLabel(outrosDefeitos, movementData.outro_defeito_id)
                        : "Digite ou selecione..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 z-50 bg-white" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar código..." />
                      <CommandList>
                        <CommandEmpty>Nenhum defeito encontrado.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              onInputChange('outro_defeito_id', '');
                              setOpenOutro(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !movementData.outro_defeito_id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            -- Nenhum --
                          </CommandItem>
                          {outrosDefeitos.map((type) => (
                            <CommandItem
                              key={type.id}
                              value={`${type.codigo} ${type.descricao}`}
                              onSelect={() => {
                                onInputChange('outro_defeito_id', type.id);
                                // Limpar DR quando seleciona outro defeito
                                if (type.id) {
                                  onInputChange('defeito_reclamado_id', '');
                                }
                                setOpenOutro(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  movementData.outro_defeito_id === type.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {type.codigo} - {type.descricao}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-purple-600 mt-1">
                  Selecione quando não for DR ou DE. Torna DR opcional.
                </p>
              </div>

              {/* DR - Defeito Reclamado com Autocomplete */}
              <div>
                <Label htmlFor="defeito_reclamado_id" className="text-red-600 font-semibold">
                  DR - Defeito Reclamado {isDRRequired ? '*' : ''}
                </Label>
                <Popover open={openDR} onOpenChange={setOpenDR}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openDR}
                      className="w-full justify-between border-red-300"
                    >
                      {movementData.defeito_reclamado_id
                        ? getSelectedLabel(defeitosReclamados, movementData.defeito_reclamado_id)
                        : "Digite ou selecione..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 z-50 bg-white" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar código DR..." />
                      <CommandList>
                        <CommandEmpty>Nenhum defeito encontrado.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              onInputChange('defeito_reclamado_id', '');
                              setOpenDR(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !movementData.defeito_reclamado_id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            -- Nenhum --
                          </CommandItem>
                          {defeitosReclamados.map((type) => (
                            <CommandItem
                              key={type.id}
                              value={`${type.codigo} ${type.descricao}`}
                              onSelect={() => {
                                onInputChange('defeito_reclamado_id', type.id);
                                // Limpar outro defeito quando seleciona DR
                                if (type.id) {
                                  onInputChange('outro_defeito_id', '');
                                }
                                setOpenDR(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  movementData.defeito_reclamado_id === type.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {type.codigo} - {type.descricao}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-red-600 mt-1">
                  Defeito reportado inicialmente pelo cliente
                </p>
              </div>

              {/* DE - Defeito Encontrado com Autocomplete */}
              <div>
                <Label htmlFor="defeito_encontrado_id" className="text-orange-600 font-semibold">
                  DE - Defeito Encontrado
                </Label>
                <Popover open={openDE} onOpenChange={setOpenDE}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openDE}
                      className="w-full justify-between border-orange-300"
                    >
                      {movementData.defeito_encontrado_id
                        ? getSelectedLabel(defeitosEncontrados, movementData.defeito_encontrado_id)
                        : "Digite ou selecione..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 z-50 bg-white" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar código DE..." />
                      <CommandList>
                        <CommandEmpty>Nenhum defeito encontrado.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              onInputChange('defeito_encontrado_id', '');
                              setOpenDE(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !movementData.defeito_encontrado_id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            -- Nenhum --
                          </CommandItem>
                          {defeitosEncontrados.map((type) => (
                            <CommandItem
                              key={type.id}
                              value={`${type.codigo} ${type.descricao}`}
                              onSelect={() => {
                                onInputChange('defeito_encontrado_id', type.id);
                                setOpenDE(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  movementData.defeito_encontrado_id === type.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {type.codigo} - {type.descricao}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-orange-600 mt-1">
                  Defeito realmente identificado durante a manutenção
                </p>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="modelo_equipamento">Modelo do Equipamento</Label>
            <Input
              id="modelo_equipamento"
              value={movementData.modelo_equipamento || ''}
              onChange={(e) => onInputChange('modelo_equipamento', e.target.value)}
              placeholder="Ex: Com DVR, Sem DVR, etc."
            />
            <p className="text-xs text-gray-600 mt-1">
              Opcional - para especificar variações do equipamento
            </p>
          </div>

          {(isDestinationTacom || 
            movementData.tipo_movimento === 'movimentacao_interna' || 
            movementData.tipo_movimento === 'envio_manutencao' ||
            movementData.tipo_movimento === 'devolucao' ||
            movementData.tipo_movimento === 'manutencao') && (
            <MovementStatusSelector
              isRequired={true}
              value={movementData.status_equipamento}
              onChange={(value) => onInputChange('status_equipamento', value)}
              label="Status do Equipamento"
              isDestinationTacom={isDestinationTacom || movementData.tipo_movimento === 'devolucao' || movementData.tipo_movimento === 'manutencao'}
            />
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={movementData.observacoes}
          onChange={(e) => onInputChange('observacoes', e.target.value)}
          placeholder="Digite observações sobre a movimentação..."
          rows={3}
        />
      </div>
    </>
  );
};

export default MovementFormFields;