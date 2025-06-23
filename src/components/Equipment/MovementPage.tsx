
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import EquipmentSearchDialog from './EquipmentSearchDialog';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  modelo?: string;
  empresas?: {
    name: string;
  };
}

interface Company {
  id: string;
  name: string;
}

interface MaintenanceType {
  id: string;
  descricao: string;
  codigo: string;
}

interface MovementPageProps {
  onBack: () => void;
}

const MovementPage: React.FC<MovementPageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [movementData, setMovementData] = useState({
    tipo_movimento: '',
    data_movimento: '',
    observacoes: '',
    empresa_destino: '',
    tipo_manutencao_id: ''
  });

  useEffect(() => {
    loadCompanies();
    loadMaintenanceTypes();
    // Definir data atual corretamente em UTC
    const hoje = new Date();
    // Ajustar para fuso horário local
    const localDate = new Date(hoje.getTime() - (hoje.getTimezoneOffset() * 60000));
    const dataFormatada = localDate.toISOString().split('T')[0];
    
    console.log('Data atual definida:', dataFormatada);
    
    setMovementData(prev => ({
      ...prev,
      data_movimento: dataFormatada
    }));
  }, []);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar empresas.",
        variant: "destructive",
      });
    }
  };

  const loadMaintenanceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_manutencao')
        .select('id, descricao, codigo')
        .eq('ativo', true)
        .order('descricao');

      if (error) throw error;
      setMaintenanceTypes(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de manutenção:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de manutenção.",
        variant: "destructive",
      });
    }
  };

  const handleEquipmentSelect = (equipments: Equipment[]) => {
    console.log('Equipamentos selecionados:', equipments);
    setSelectedEquipments(equipments);
    setShowSearch(false);
  };

  const removeEquipment = (equipmentId: string) => {
    setSelectedEquipments(prev => prev.filter(eq => eq.id !== equipmentId));
  };

  const handleInputChange = (field: string, value: string) => {
    setMovementData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedEquipments.length === 0 || !movementData.tipo_movimento || !movementData.data_movimento) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios e selecione pelo menos um equipamento.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('=== PROCESSANDO MOVIMENTAÇÃO ===');
      console.log('Equipamentos selecionados:', selectedEquipments);
      console.log('Dados da movimentação:', movementData);
      console.log('Usuário logado:', user);

      // Processar cada equipamento individualmente
      for (const equipment of selectedEquipments) {
        // 1. Registrar a movimentação com usuário logado
        const movimentationData: any = {
          id_equipamento: equipment.id,
          tipo_movimento: movementData.tipo_movimento,
          data_movimento: movementData.data_movimento,
          observacoes: movementData.observacoes || null,
          usuario_responsavel: user?.name ? `${user.name} ${user.surname || ''}`.trim() : user?.username || 'Sistema'
        };

        // Adicionar tipo_manutencao_id se for uma movimentação de manutenção
        if ((movementData.tipo_movimento === 'manutencao' || movementData.tipo_movimento === 'aguardando_manutencao') 
            && movementData.tipo_manutencao_id) {
          movimentationData.tipo_manutencao_id = movementData.tipo_manutencao_id;
        }

        console.log('Dados da movimentação para equipamento', equipment.numero_serie, ':', movimentationData);

        const { error: movementError } = await supabase
          .from('movimentacoes')
          .insert(movimentationData);

        if (movementError) {
          console.error('Erro ao inserir movimentação:', movementError);
          throw movementError;
        }

        console.log('Movimentação registrada com sucesso para', equipment.numero_serie);

        // 2. Atualizar o equipamento baseado no tipo de movimento
        let updateData: any = {};

        if (movementData.tipo_movimento === 'saida') {
          updateData.data_saida = movementData.data_movimento;
          updateData.status = 'em_uso';
        } else if (movementData.tipo_movimento === 'entrada') {
          updateData.data_saida = null;
          updateData.status = 'disponivel';
        } else if (movementData.tipo_movimento === 'movimentacao' && movementData.empresa_destino) {
          updateData.id_empresa = movementData.empresa_destino;
          updateData.status = 'disponivel';
          console.log('Movimentação entre empresas - Nova empresa ID:', movementData.empresa_destino);
        } else if (movementData.tipo_movimento === 'manutencao') {
          updateData.status = 'manutencao';
        } else if (movementData.tipo_movimento === 'aguardando_manutencao') {
          updateData.status = 'aguardando_manutencao';
        } else if (movementData.tipo_movimento === 'danificado') {
          updateData.status = 'danificado';
        } else if (movementData.tipo_movimento === 'indisponivel') {
          updateData.status = 'indisponivel';
        }

        console.log('Dados para atualizar equipamento', equipment.numero_serie, ':', updateData);

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('equipamentos')
            .update(updateData)
            .eq('id', equipment.id);

          if (updateError) {
            console.error('Erro ao atualizar equipamento:', updateError);
            throw updateError;
          }

          console.log('Equipamento', equipment.numero_serie, 'atualizado com sucesso');
        }
      }

      toast({
        title: "Sucesso",
        description: `Movimentação registrada com sucesso para ${selectedEquipments.length} equipamento(s)!`,
      });

      // Resetar formulário
      setSelectedEquipments([]);
      const hoje = new Date();
      const localDate = new Date(hoje.getTime() - (hoje.getTimezoneOffset() * 60000));
      const dataAtual = localDate.toISOString().split('T')[0];
      
      setMovementData({
        tipo_movimento: '',
        data_movimento: dataAtual,
        observacoes: '',
        empresa_destino: '',
        tipo_manutencao_id: ''
      });

    } catch (error) {
      console.error('Erro ao processar movimentação:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar movimentação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Movimentações de Equipamentos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova Movimentação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Seleção dos Equipamentos */}
            <div>
              <Label>Equipamentos Selecionados ({selectedEquipments.length})</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  {selectedEquipments.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                      {selectedEquipments.map((equipment) => (
                        <div key={equipment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                          <div>
                            <p className="font-medium">{equipment.numero_serie}</p>
                            <p className="text-sm text-gray-600">
                              {equipment.tipo} {equipment.modelo && `- ${equipment.modelo}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              Empresa: {equipment.empresas?.name || 'N/A'}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeEquipment(equipment.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 border rounded-lg border-dashed">
                      <p className="text-gray-500">Nenhum equipamento selecionado</p>
                    </div>
                  )}
                </div>
                <Button type="button" onClick={() => setShowSearch(true)}>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Equipamentos
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo_movimento">Tipo de Movimentação *</Label>
                <Select
                  value={movementData.tipo_movimento}
                  onValueChange={(value) => handleInputChange('tipo_movimento', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="movimentacao">Movimentação</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="aguardando_manutencao">Aguardando Manutenção</SelectItem>
                    <SelectItem value="danificado">Danificado</SelectItem>
                    <SelectItem value="indisponivel">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="data_movimento">Data da Movimentação *</Label>
                <Input
                  id="data_movimento"
                  type="date"
                  value={movementData.data_movimento}
                  onChange={(e) => handleInputChange('data_movimento', e.target.value)}
                  required
                />
              </div>

              {/* Campo Empresa Destino apenas para movimentação */}
              {movementData.tipo_movimento === 'movimentacao' && (
                <div>
                  <Label htmlFor="empresa_destino">Empresa Destino</Label>
                  <Select
                    value={movementData.empresa_destino}
                    onValueChange={(value) => handleInputChange('empresa_destino', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Campo Tipo de Manutenção apenas para manutenções */}
              {(movementData.tipo_movimento === 'manutencao' || movementData.tipo_movimento === 'aguardando_manutencao') && (
                <div>
                  <Label htmlFor="tipo_manutencao_id">Tipo de Manutenção</Label>
                  <Select
                    value={movementData.tipo_manutencao_id}
                    onValueChange={(value) => handleInputChange('tipo_manutencao_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de manutenção" />
                    </SelectTrigger>
                    <SelectContent>
                      {maintenanceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.descricao} ({type.codigo})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={movementData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Digite observações sobre a movimentação..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Registrando...' : 'Registrar Movimentação'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {showSearch && (
        <EquipmentSearchDialog
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
          onConfirm={handleEquipmentSelect}
        />
      )}
    </div>
  );
};

export default MovementPage;
