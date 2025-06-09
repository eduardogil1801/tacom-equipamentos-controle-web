import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface EquipmentMovementProps {
  onCancel: () => void;
  onSuccess: () => void;
}

interface Equipment {
  id: string;
  tipo: string;
  modelo?: string;
  numero_serie: string;
  empresas?: {
    name: string;
  };
}

interface MaintenanceType {
  id: string;
  codigo: string;
  descricao: string;
}

const EquipmentMovement: React.FC<EquipmentMovementProps> = ({ onCancel, onSuccess }) => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [movementType, setMovementType] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('');
  const [movementDate, setMovementDate] = useState('');
  const [observations, setObservations] = useState('');
  const [maintenanceDetails, setMaintenanceDetails] = useState('');
  const [responsibleUser, setResponsibleUser] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEquipments();
    loadMaintenanceTypes();
  }, []);

  const loadEquipments = async () => {
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name
          )
        `)
        .order('numero_serie');

      if (error) throw error;
      setEquipments(data || []);
    } catch (error) {
      console.error('Error loading equipments:', error);
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

      if (error) throw error;
      
      // Ordenar numericamente pelo código
      const sortedData = (data || []).sort((a, b) => {
        const aNum = parseInt(a.codigo);
        const bNum = parseInt(b.codigo);
        return aNum - bNum;
      });
      
      setMaintenanceTypes(sortedData);
    } catch (error) {
      console.error('Error loading maintenance types:', error);
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
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    if (movementType === 'manutencao' && !maintenanceType) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o tipo de manutenção",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Registrando movimentação:', {
        selectedEquipment,
        movementType,
        movementDate,
        maintenanceType,
        observations,
        maintenanceDetails,
        responsibleUser
      });

      const movementData = {
        id_equipamento: selectedEquipment,
        tipo_movimento: movementType,
        data_movimento: movementDate,
        observacoes: observations || null,
        usuario_responsavel: responsibleUser || null,
        tipo_manutencao_id: movementType === 'manutencao' ? maintenanceType : null,
        detalhes_manutencao: movementType === 'manutencao' ? maintenanceDetails : null,
      };

      console.log('Dados da movimentação a serem inseridos:', movementData);

      const { data, error } = await supabase
        .from('movimentacoes')
        .insert([movementData])
        .select();

      if (error) {
        console.error('Erro ao inserir movimentação:', error);
        throw error;
      }

      console.log('Movimentação registrada com sucesso:', data);

      // Atualizar status do equipamento se necessário
      if (movementType === 'manutencao') {
        const { error: updateError } = await supabase
          .from('equipamentos')
          .update({ 
            em_manutencao: true,
            status: 'aguardando_manutencao'
          })
          .eq('id', selectedEquipment);

        if (updateError) {
          console.error('Erro ao atualizar status do equipamento:', updateError);
          throw updateError;
        }
      } else if (movementType === 'saida') {
        const { error: updateError } = await supabase
          .from('equipamentos')
          .update({ 
            data_saida: movementDate,
            status: 'em_uso'
          })
          .eq('id', selectedEquipment);

        if (updateError) {
          console.error('Erro ao atualizar data de saída:', updateError);
          throw updateError;
        }
      }

      toast({
        title: "Sucesso",
        description: "Movimentação registrada com sucesso!",
      });

      onSuccess();
    } catch (error) {
      console.error('Error registering movement:', error);
      toast({
        title: "Erro",
        description: `Erro ao registrar movimentação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Registrar Movimentação</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova Movimentação de Equipamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="equipment">Equipamento *</Label>
              <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {equipments.map(equipment => (
                    <SelectItem key={equipment.id} value={equipment.id}>
                      {equipment.numero_serie} - {equipment.tipo} ({equipment.empresas?.name || 'Sem empresa'})
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

            {movementType === 'manutencao' && (
              <div>
                <Label htmlFor="maintenanceType">Tipo de Manutenção *</Label>
                <Select value={maintenanceType} onValueChange={setMaintenanceType}>
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
            )}

            <div>
              <Label htmlFor="movementDate">Data da Movimentação *</Label>
              <Input
                id="movementDate"
                type="date"
                value={movementDate}
                onChange={(e) => setMovementDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="responsibleUser">Usuário Responsável</Label>
              <Input
                id="responsibleUser"
                value={responsibleUser}
                onChange={(e) => setResponsibleUser(e.target.value)}
                placeholder="Nome do usuário responsável"
              />
            </div>

            <div>
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Observações sobre a movimentação"
                rows={3}
              />
            </div>

            {movementType === 'manutencao' && (
              <div>
                <Label htmlFor="maintenanceDetails">Detalhes da Manutenção</Label>
                <Textarea
                  id="maintenanceDetails"
                  value={maintenanceDetails}
                  onChange={(e) => setMaintenanceDetails(e.target.value)}
                  placeholder="Detalhes específicos da manutenção"
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Registrando...' : 'Registrar Movimentação'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
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
