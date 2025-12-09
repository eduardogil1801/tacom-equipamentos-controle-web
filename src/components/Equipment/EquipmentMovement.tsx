
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useHybridAuth';
import { formatDateForDisplay } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Movement = {
  id: string;
  tipo_movimento: string;
  data_movimento: string;
  data_criacao: string;
  observacoes?: string;
  usuario_responsavel?: string;
  equipamentos?: {
    numero_serie: string;
    tipo: string;
    empresas?: {
      name: string;
    };
  };
};

const EquipmentMovement = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([]);
  const [selectedEquipmentCode, setSelectedEquipmentCode] = useState<string>('');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<string>('');
  const [openEquipmentSearch, setOpenEquipmentSearch] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMovements = async () => {
      const { data, error } = await supabase
        .from('movimentacoes')
        .select(`
          *,
          equipamentos (
            numero_serie,
            tipo,
            empresas (
              name
            )
          )
        `)
        .order('data_criacao', { ascending: false })
        .order('data_movimento', { ascending: false });

      if (error) {
        console.error('Erro ao buscar movimentos:', error);
      } else {
        const filteredData = data?.filter(movement => 
          movement.usuario_responsavel && 
          movement.usuario_responsavel !== 'Sistema' && 
          movement.usuario_responsavel !== 'Usuário não identificado'
        ) || [];
        
        const uniqueMovements = filteredData.filter((movement, index, array) => {
          const key = `${movement.id_equipamento}-${movement.tipo_movimento}-${movement.data_movimento}`;
          return array.findIndex(m => 
            `${m.id_equipamento}-${m.tipo_movimento}-${m.data_movimento}` === key
          ) === index;
        });
        
        setMovements(uniqueMovements as Movement[]);
        setFilteredMovements(uniqueMovements as Movement[]);
      }
    };

    fetchMovements();
  }, []);

// Extrair códigos de equipamentos únicos
  const equipmentCodes = useMemo(() => {
    const codes = movements.map(m => m.equipamentos?.numero_serie).filter(Boolean) as string[];
    return [...new Set(codes)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [movements]);
  
  // Filtrar códigos baseado na busca (só mostra se digitar código exato ou parcial)
  const [searchTerm, setSearchTerm] = useState('');
  const filteredCodes = useMemo(() => {
    if (!searchTerm) return equipmentCodes.slice(0, 50); // Limitar quando sem busca
    return equipmentCodes.filter(code => code.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [equipmentCodes, searchTerm]);

  // Extrair tipos de equipamento para o código selecionado
  const equipmentTypesForCode = useMemo(() => {
    if (!selectedEquipmentCode) return [];
    const types = movements
      .filter(m => m.equipamentos?.numero_serie === selectedEquipmentCode)
      .map(m => m.equipamentos?.tipo)
      .filter(Boolean) as string[];
    return [...new Set(types)].sort();
  }, [movements, selectedEquipmentCode]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...movements];
    
    if (selectedEquipmentCode) {
      filtered = filtered.filter(m => m.equipamentos?.numero_serie === selectedEquipmentCode);
    }
    
    if (selectedEquipmentType) {
      filtered = filtered.filter(m => m.equipamentos?.tipo === selectedEquipmentType);
    }
    
    setFilteredMovements(filtered);
  }, [movements, selectedEquipmentCode, selectedEquipmentType]);

  const currentUserName = user ? `${user.name} ${user.surname}` : 'Usuário não logado';

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Histórico de Movimentações</h1>
      
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por Código do Equipamento */}
            <div>
              <Label>Código do Equipamento</Label>
              <Popover open={openEquipmentSearch} onOpenChange={setOpenEquipmentSearch}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {selectedEquipmentCode || "Buscar código..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 z-50 bg-white">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Digite o código completo..." 
                      value={searchTerm}
                      onValueChange={setSearchTerm}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhum código encontrado.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="todos"
                          onSelect={() => {
                            setSelectedEquipmentCode('');
                            setSelectedEquipmentType('');
                            setSearchTerm('');
                            setOpenEquipmentSearch(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", !selectedEquipmentCode ? "opacity-100" : "opacity-0")} />
                          Todos
                        </CommandItem>
                        {filteredCodes.map((code) => (
                          <CommandItem
                            key={code}
                            value={code}
                            onSelect={() => {
                              setSelectedEquipmentCode(code);
                              setSelectedEquipmentType('');
                              setSearchTerm('');
                              setOpenEquipmentSearch(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", selectedEquipmentCode === code ? "opacity-100" : "opacity-0")} />
                            {code}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Filtro por Tipo de Equipamento */}
            {equipmentTypesForCode.length > 1 && (
              <div>
                <Label>Tipo de Equipamento</Label>
                <Select value={selectedEquipmentType} onValueChange={setSelectedEquipmentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    {equipmentTypesForCode.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-gray-600">Usuário logado: {currentUserName}</p>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b min-w-[180px]">Equipamento</th>
              <th className="py-2 px-4 border-b min-w-[200px]">Empresa</th>
              <th className="py-2 px-4 border-b">Tipo Movimento</th>
              <th className="py-2 px-4 border-b">Data</th>
              <th className="py-2 px-4 border-b">Responsável</th>
              <th className="py-2 px-4 border-b">Observações</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.map((movement) => (
              <tr key={movement.id}>
                <td className="py-2 px-4 border-b min-w-[180px] whitespace-nowrap">
                  {movement.equipamentos?.numero_serie || 'N/A'} - {movement.equipamentos?.tipo || 'N/A'}
                </td>
                <td className="py-2 px-4 border-b min-w-[200px]">
                  {movement.equipamentos?.empresas?.name || 'N/A'}
                </td>
                <td className="py-2 px-4 border-b whitespace-nowrap">{movement.tipo_movimento}</td>
                <td className="py-2 px-4 border-b whitespace-nowrap">
                  {new Date(movement.data_criacao).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="py-2 px-4 border-b whitespace-nowrap">{movement.usuario_responsavel || 'N/A'}</td>
                <td className="py-2 px-4 border-b max-w-[300px]">{movement.observacoes || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <p className="text-sm text-gray-500">
        Exibindo {filteredMovements.length} de {movements.length} registros
      </p>
    </div>
  );
};

export default EquipmentMovement;
