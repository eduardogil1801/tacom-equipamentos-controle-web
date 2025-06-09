
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Plus } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  modelo: string;
  status: string;
}

interface MaintenanceType {
  id: string;
  codigo: string;
  descricao: string;
}

const EquipmentMovement = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [movementType, setMovementType] = useState('');
  const [movementDate, setMovementDate] = useState<Date>();
  const [observations, setObservations] = useState('');
  const [responsibleUser, setResponsibleUser] = useState('');
  const [selectedMaintenanceType, setSelectedMaintenanceType] = useState('');
  const [maintenanceDetails, setMaintenanceDetails] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEquipments();
    loadMaintenanceTypes();
  }, []);

  const loadEquipments = async () => {
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select('id, numero_serie, tipo, modelo, status')
        .eq('status', 'disponivel')
        .order('numero_serie');

      if (error) {
        console.error('Erro ao carregar equipamentos:', error);
        throw error;
      }

      console.log('Equipamentos carregados:', data);
      setEquipments(data || []);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar equipamentos",
        variant: "destructive",
      });
    }
  };

  const loadMaintenanceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_manutencao')
        .select('*')
        .eq('ativo', true)
        .order('codigo');

      if (error) {
        console.error('Erro ao carregar tipos de manutenção:', error);
        throw error;
      }

      // Ordenar numericamente pelo código
      const sortedTypes = (data || []).sort((a, b) => {
        const numA = parseInt(a.codigo);
        const numB = parseInt(b.codigo);
        return numA - numB;
      });
      
      console.log('Tipos de manutenção carregados:', sortedTypes);
      setMaintenanceTypes(sortedTypes);
    } catch (error) {
      console.error('Erro ao carregar tipos de manutenção:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de manutenção",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEquipment || !movementType || !movementDate) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (movementType === 'manutencao' && !selectedMaintenanceType) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de manutenção",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Dados da movimentação:', {
        id_equipamento: selectedEquipment,
        tipo_movimento: movementType,
        data_movimento: format(movementDate, 'yyyy-MM-dd'),
        observacoes: observations,
        usuario_responsavel: responsibleUser,
        tipo_manutencao_id: movementType === 'manutencao' ? selectedMaintenanceType : null,
        detalhes_manutencao: movementType === 'manutencao' ? maintenanceDetails : null
      });

      const { error: movementError } = await supabase
        .from('movimentacoes')
        .insert([{
          id_equipamento: selectedEquipment,
          tipo_movimento: movementType,
          data_movimento: format(movementDate, 'yyyy-MM-dd'),
          observacoes: observations,
          usuario_responsavel: responsibleUser,
          tipo_manutencao_id: movementType === 'manutencao' ? selectedMaintenanceType : null,
          detalhes_manutencao: movementType === 'manutencao' ? maintenanceDetails : null
        }]);

      if (movementError) {
        console.error('Erro ao registrar movimentação:', movementError);
        throw movementError;
      }

      // Se é manutenção, atualizar status do equipamento
      if (movementType === 'manutencao') {
        const { error: equipmentError } = await supabase
          .from('equipamentos')
          .update({ 
            em_manutencao: true,
            status: 'manutencao'
          })
          .eq('id', selectedEquipment);

        if (equipmentError) {
          console.error('Erro ao atualizar status do equipamento:', equipmentError);
          throw equipmentError;
        }
      }

      // Se é saída, atualizar data de saída
      if (movementType === 'saida') {
        const { error: equipmentError } = await supabase
          .from('equipamentos')
          .update({ 
            data_saida: format(movementDate, 'yyyy-MM-dd'),
            status: 'indisponivel'
          })
          .eq('id', selectedEquipment);

        if (equipmentError) {
          console.error('Erro ao atualizar data de saída:', equipmentError);
          throw equipmentError;
        }
      }

      toast({
        title: "Sucesso",
        description: "Movimentação registrada com sucesso!",
      });

      // Resetar formulário
      setSelectedEquipment('');
      setMovementType('');
      setMovementDate(undefined);
      setObservations('');
      setResponsibleUser('');
      setSelectedMaintenanceType('');
      setMaintenanceDetails('');
      
      // Recarregar equipamentos
      loadEquipments();
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar movimentação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Registrar Movimentação de Equipamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="equipment">Equipamento *</Label>
                <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipments.map((equipment) => (
                      <SelectItem key={equipment.id} value={equipment.id}>
                        {equipment.numero_serie} - {equipment.tipo} {equipment.modelo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="movementType">Tipo de Movimentação *</Label>
                <Select value={movementType} onValueChange={setMovementType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {movementType === 'manutencao' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maintenanceType">Tipo de Manutenção *</Label>
                  <Select value={selectedMaintenanceType} onValueChange={setSelectedMaintenanceType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de manutenção" />
                    </SelectTrigger>
                    <SelectContent>
                      {maintenanceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.codigo} - {type.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maintenanceDetails">Detalhes da Manutenção</Label>
                  <Textarea
                    id="maintenanceDetails"
                    placeholder="Descreva os detalhes da manutenção"
                    value={maintenanceDetails}
                    onChange={(e) => setMaintenanceDetails(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Data da Movimentação *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !movementDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {movementDate ? format(movementDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={movementDate}
                      onSelect={setMovementDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="responsibleUser">Usuário Responsável</Label>
                <Input
                  id="responsibleUser"
                  placeholder="Nome do responsável"
                  value={responsibleUser}
                  onChange={(e) => setResponsibleUser(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                placeholder="Observações sobre a movimentação"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Registrando...' : 'Registrar Movimentação'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentMovement;
