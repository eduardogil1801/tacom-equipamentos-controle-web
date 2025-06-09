import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  modelo?: string;
  empresas?: {
    name: string;
  };
  status?: string;
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
  const { user } = useAuth();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [formData, setFormData] = useState({
    id_equipamento: '',
    tipo_movimento: '',
    data_movimento: new Date().toISOString().split('T')[0],
    observacoes: '',
    tipo_manutencao_id: '',
    detalhes_manutencao: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoadingData(true);
      
      // Carregar equipamentos
      const { data: equipmentsData, error: equipmentsError } = await supabase
        .from('equipamentos')
        .select(`
          id,
          numero_serie,
          tipo,
          modelo,
          status,
          empresas (
            name
          )
        `)
        .order('numero_serie');

      if (equipmentsError) throw equipmentsError;
      setEquipments(equipmentsData || []);

      // Carregar tipos de manutenção
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('tipos_manutencao')
        .select('*')
        .eq('ativo', true)
        .order('codigo');

      if (maintenanceError) throw maintenanceError;
      setMaintenanceTypes(maintenanceData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id_equipamento || !formData.tipo_movimento || !formData.data_movimento) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (formData.tipo_movimento === 'manutencao' && !formData.tipo_manutencao_id) {
      toast({
        title: "Erro",
        description: "Para movimentações de manutenção, selecione o tipo de manutenção.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Registrar movimentação com usuário responsável
      const movementData = {
        id_equipamento: formData.id_equipamento,
        tipo_movimento: formData.tipo_movimento,
        data_movimento: formData.data_movimento,
        observacoes: formData.observacoes || null,
        tipo_manutencao_id: formData.tipo_manutencao_id || null,
        detalhes_manutencao: formData.detalhes_manutencao || null,
        usuario_responsavel: user?.username || user?.name
      };

      const { error: movementError } = await supabase
        .from('movimentacoes')
        .insert([movementData]);

      if (movementError) throw movementError;

      // Atualizar status do equipamento baseado no tipo de movimento
      let newStatus = '';
      let updateData: any = {};

      switch (formData.tipo_movimento) {
        case 'entrada':
          newStatus = 'disponivel';
          updateData = { status: newStatus, data_entrada: formData.data_movimento };
          break;
        case 'saida':
          newStatus = 'em_uso';
          updateData = { status: newStatus, data_saida: formData.data_movimento };
          break;
        case 'manutencao':
          newStatus = 'aguardando_manutencao';
          updateData = { status: newStatus, em_manutencao: true };
          break;
        case 'retorno_manutencao':
          newStatus = 'disponivel';
          updateData = { status: newStatus, em_manutencao: false };
          break;
        default:
          break;
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('equipamentos')
          .update(updateData)
          .eq('id', formData.id_equipamento);

        if (updateError) throw updateError;
      }

      toast({
        title: "Sucesso",
        description: "Movimentação registrada com sucesso!",
      });

      onSuccess();
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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Registrar Movimentação</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Movimentação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipamento">Equipamento *</Label>
                <Select value={formData.id_equipamento || ''} onValueChange={(value) => {
                  handleChange('id_equipamento', value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipments.map(equipment => (
                      <SelectItem key={equipment.id} value={equipment.id}>
                        {equipment.numero_serie} - {equipment.tipo} ({equipment.empresas?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_movimento">Tipo de Movimento *</Label>
                <Select value={formData.tipo_movimento || ''} onValueChange={(value) => {
                  handleChange('tipo_movimento', value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="retorno_manutencao">Retorno Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_movimento">Data do Movimento *</Label>
                <Input
                  id="data_movimento"
                  type="date"
                  value={formData.data_movimento}
                  onChange={(e) => handleChange('data_movimento', e.target.value)}
                  required
                />
              </div>

              {(formData.tipo_movimento === 'manutencao' || formData.tipo_movimento === 'retorno_manutencao') && (
                <div className="space-y-2">
                  <Label htmlFor="tipo_manutencao">Tipo de Manutenção *</Label>
                  <Select value={formData.tipo_manutencao_id || ''} onValueChange={(value) => {
                    handleChange('tipo_manutencao_id', value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
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
            </div>

            {(formData.tipo_movimento === 'manutencao' || formData.tipo_movimento === 'retorno_manutencao') && (
              <div className="space-y-2">
                <Label htmlFor="detalhes_manutencao">Detalhes da Manutenção</Label>
                <Textarea
                  id="detalhes_manutencao"
                  placeholder="Descreva os detalhes da manutenção..."
                  value={formData.detalhes_manutencao}
                  onChange={(e) => handleChange('detalhes_manutencao', e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações sobre a movimentação..."
                value={formData.observacoes}
                onChange={(e) => handleChange('observacoes', e.target.value)}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
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
