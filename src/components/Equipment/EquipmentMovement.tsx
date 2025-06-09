
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, X, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  status: string;
  empresas: {
    name: string;
  };
}

interface MaintenanceType {
  id: string;
  codigo: string;
  descricao: string;
}

interface EquipmentMovementProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const EquipmentMovement: React.FC<EquipmentMovementProps> = ({ onCancel, onSuccess }) => {
  const [isMultiple, setIsMultiple] = useState(false);
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [searchSerial, setSearchSerial] = useState('');
  const [searchResults, setSearchResults] = useState<Equipment[]>([]);
  const [movementType, setMovementType] = useState('');
  const [movementDate, setMovementDate] = useState(new Date().toISOString().split('T')[0]);
  const [observations, setObservations] = useState('');
  const [maintenanceTypeId, setMaintenanceTypeId] = useState('');
  const [maintenanceDetails, setMaintenanceDetails] = useState('');
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    loadMaintenanceTypes();
  }, []);

  useEffect(() => {
    if (searchSerial.length >= 3) {
      searchEquipments();
    } else {
      setSearchResults([]);
    }
  }, [searchSerial]);

  const loadMaintenanceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_manutencao')
        .select('*')
        .eq('ativo', true)
        .order('codigo');

      if (error) throw error;
      setMaintenanceTypes(data || []);
    } catch (error) {
      console.error('Error loading maintenance types:', error);
    }
  };

  const searchEquipments = async () => {
    try {
      setSearchLoading(true);
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          id,
          numero_serie,
          tipo,
          status,
          empresas (
            name
          )
        `)
        .ilike('numero_serie', `%${searchSerial}%`)
        .limit(10);

      if (error) throw error;
      
      // Filtrar equipamentos já selecionados
      const filtered = (data || []).filter(eq => 
        !selectedEquipments.some(selected => selected.id === eq.id)
      );
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching equipments:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar equipamentos",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const addEquipment = (equipment: Equipment) => {
    setSelectedEquipments([...selectedEquipments, equipment]);
    setSearchSerial('');
    setSearchResults([]);
  };

  const removeEquipment = (equipmentId: string) => {
    setSelectedEquipments(selectedEquipments.filter(eq => eq.id !== equipmentId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEquipments.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um equipamento",
        variant: "destructive",
      });
      return;
    }

    if (!movementType) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de movimentação",
        variant: "destructive",
      });
      return;
    }

    if (movementType === 'manutencao' && !maintenanceTypeId) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de manutenção",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Criar movimentações para cada equipamento
      const movements = selectedEquipments.map(equipment => ({
        id_equipamento: equipment.id,
        tipo_movimento: movementType,
        data_movimento: movementDate,
        observacoes: observations,
        tipo_manutencao_id: movementType === 'manutencao' ? maintenanceTypeId : null,
        detalhes_manutencao: movementType === 'manutencao' ? maintenanceDetails : null,
        usuario_responsavel: 'Sistema' // Pode ser alterado quando houver autenticação
      }));

      const { error: movementError } = await supabase
        .from('movimentacoes')
        .insert(movements);

      if (movementError) throw movementError;

      // Atualizar status dos equipamentos se necessário
      if (movementType === 'manutencao') {
        const { error: updateError } = await supabase
          .from('equipamentos')
          .update({ 
            em_manutencao: true,
            status: 'aguardando_manutencao'
          })
          .in('id', selectedEquipments.map(eq => eq.id));

        if (updateError) throw updateError;
      } else if (movementType === 'retorno_manutencao') {
        const { error: updateError } = await supabase
          .from('equipamentos')
          .update({ 
            em_manutencao: false,
            status: 'disponivel'
          })
          .in('id', selectedEquipments.map(eq => eq.id));

        if (updateError) throw updateError;
      }

      toast({
        title: "Sucesso",
        description: `Movimentação registrada para ${selectedEquipments.length} equipamento(s)!`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving movement:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar movimentação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMovementTypeLabel = (type: string) => {
    switch (type) {
      case 'entrada': return 'Entrada';
      case 'saida': return 'Saída';
      case 'manutencao': return 'Envio para Manutenção';
      case 'retorno_manutencao': return 'Retorno da Manutenção';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          Movimentação de Equipamentos
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações da Movimentação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="multiple"
              checked={isMultiple}
              onCheckedChange={(checked) => setIsMultiple(checked as boolean)}
            />
            <Label htmlFor="multiple">Movimentar múltiplos equipamentos</Label>
          </div>
        </CardContent>
      </Card>

      {/* Seleção de Equipamentos */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isMultiple ? 'Buscar e Selecionar Equipamentos' : 'Selecionar Equipamento'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca por número de série */}
          <div className="space-y-2">
            <Label htmlFor="search">Buscar por Número de Série</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                placeholder="Digite pelo menos 3 caracteres..."
                value={searchSerial}
                onChange={(e) => setSearchSerial(e.target.value)}
                className="pl-10"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          {/* Resultados da busca */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>Resultados da Busca</Label>
              <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-2">
                {searchResults.map(equipment => (
                  <div key={equipment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="font-mono text-sm">{equipment.numero_serie}</div>
                      <div className="text-xs text-gray-600">
                        {equipment.tipo} - {equipment.empresas?.name}
                      </div>
                      <div className="text-xs">
                        <span className={`px-2 py-1 rounded ${
                          equipment.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                          equipment.status === 'em_uso' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {equipment.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addEquipment(equipment)}
                      disabled={!isMultiple && selectedEquipments.length >= 1}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipamentos selecionados */}
          {selectedEquipments.length > 0 && (
            <div className="space-y-2">
              <Label>Equipamentos Selecionados ({selectedEquipments.length})</Label>
              <div className="space-y-2">
                {selectedEquipments.map(equipment => (
                  <div key={equipment.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div className="flex-1">
                      <div className="font-mono text-sm">{equipment.numero_serie}</div>
                      <div className="text-xs text-gray-600">
                        {equipment.tipo} - {equipment.empresas?.name}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeEquipment(equipment.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dados da Movimentação */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Movimentação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="movementType">Tipo de Movimentação *</Label>
                <Select value={movementType} onValueChange={setMovementType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="manutencao">Envio para Manutenção</SelectItem>
                    <SelectItem value="retorno_manutencao">Retorno da Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="movementDate">Data da Movimentação *</Label>
                <Input
                  id="movementDate"
                  type="date"
                  value={movementDate}
                  onChange={(e) => setMovementDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Campos específicos para manutenção */}
            {movementType === 'manutencao' && (
              <div className="space-y-4 p-4 bg-yellow-50 rounded">
                <h3 className="font-medium text-yellow-800">Informações de Manutenção</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="maintenanceType">Tipo de Manutenção *</Label>
                  <Select value={maintenanceTypeId} onValueChange={setMaintenanceTypeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de manutenção" />
                    </SelectTrigger>
                    <SelectContent>
                      {maintenanceTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.codigo} - {type.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenanceDetails">Detalhes da Manutenção</Label>
                  <Textarea
                    id="maintenanceDetails"
                    placeholder="Descreva detalhes adicionais sobre a manutenção..."
                    value={maintenanceDetails}
                    onChange={(e) => setMaintenanceDetails(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                placeholder="Observações adicionais sobre a movimentação..."
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90" 
                disabled={loading || selectedEquipments.length === 0}
              >
                {loading ? 'Registrando...' : 'Registrar Movimentação'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentMovement;
