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
import MovementStatusSelector from './MovementStatusSelector';
import { getCurrentLocalDate } from '@/utils/dateUtils';

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

interface EquipmentType {
  id: string;
  nome: string;
}

interface MovementPageProps {
  onBack: () => void;
}

const MovementPage: React.FC<MovementPageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [movementData, setMovementData] = useState({
    tipo_movimento: '',
    data_movimento: '',
    observacoes: '',
    empresa_destino: '',
    tipo_manutencao_id: '',
    tipo_equipamento: '',
    status_equipamento: '' // Novo campo para status quando necessário
  });

  // Verificar se a empresa destino é TACOM
  const isDestinationTacom = () => {
    if (!movementData.empresa_destino) return false;
    const company = companies.find(c => c.id === movementData.empresa_destino);
    return company?.name.toUpperCase().includes('TACOM');
  };

  useEffect(() => {
    loadCompanies();
    loadMaintenanceTypes();
    loadEquipmentTypes();
    
    // Usar a função utilitária para obter a data atual
    const dataAtual = getCurrentLocalDate();
    console.log('Data atual definida:', dataAtual);
    
    setMovementData(prev => ({
      ...prev,
      data_movimento: dataAtual
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

  const loadEquipmentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_equipamento')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setEquipmentTypes(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de equipamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de equipamento.",
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

    // VALIDAÇÃO: Para movimentações, empresa destino é obrigatória
    if (movementData.tipo_movimento === 'movimentacao' && !movementData.empresa_destino) {
      toast({
        title: "Erro",
        description: "Para movimentações entre empresas, selecione a empresa de destino.",
        variant: "destructive",
      });
      return;
    }

    // NOVA VALIDAÇÃO: Status obrigatório para TACOM
    if (isDestinationTacom() && !movementData.status_equipamento) {
      toast({
        title: "Erro",
        description: "Status do equipamento é obrigatório para movimentações para TACOM.",
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
        console.log(`=== PROCESSANDO EQUIPAMENTO ${equipment.numero_serie} ===`);
        
        // 1. Registrar a movimentação com usuário logado
        const movimentationData: any = {
          id_equipamento: equipment.id,
          tipo_movimento: movementData.tipo_movimento,
          data_movimento: movementData.data_movimento, // CORREÇÃO: Usar a data escolhida pelo usuário
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
        } else if (movementData.tipo_movimento === 'movimentacao') {
          // CORREÇÃO: Para movimentações, sempre atualizar a empresa se especificada
          if (movementData.empresa_destino) {
            updateData.id_empresa = movementData.empresa_destino;
            console.log('=== ATUALIZANDO EMPRESA DO EQUIPAMENTO ===');
            console.log(`Equipamento ${equipment.numero_serie}: empresa atual -> nova empresa ${movementData.empresa_destino}`);
          }
          
          // NOVA FUNCIONALIDADE: Se é TACOM e tem status definido, usar o status definido
          if (isDestinationTacom() && movementData.status_equipamento) {
            updateData.status = movementData.status_equipamento;
            console.log(`Status definido para TACOM: ${movementData.status_equipamento}`);
          } else {
            updateData.status = 'disponivel';
          }
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

        // CORREÇÃO: Sempre atualizar o equipamento com as informações da movimentação
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
          
          // Log adicional para movimentações
          if (movementData.tipo_movimento === 'movimentacao' && movementData.empresa_destino) {
            console.log(`✅ EMPRESA ATUALIZADA: Equipamento ${equipment.numero_serie} agora pertence à empresa ID: ${movementData.empresa_destino}`);
          }
        }
      }

      toast({
        title: "Sucesso",
        description: `Movimentação registrada com sucesso para ${selectedEquipments.length} equipamento(s)!`,
      });

      // Resetar formulário com data atual
      setSelectedEquipments([]);
      const dataAtual = getCurrentLocalDate();
      
      setMovementData({
        tipo_movimento: '',
        data_movimento: dataAtual,
        observacoes: '',
        empresa_destino: '',
        tipo_manutencao_id: '',
        tipo_equipamento: '',
        status_equipamento: ''
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

              <div>
                <Label htmlFor="empresa_destino">
                  Empresa Destino {movementData.tipo_movimento === 'movimentacao' && '*'}
                </Label>
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
                {movementData.tipo_movimento === 'movimentacao' && (
                  <p className="text-xs text-gray-600 mt-1">
                    ⚠️ Obrigatório para movimentações entre empresas
                  </p>
                )}
              </div>

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

              <div>
                <Label htmlFor="tipo_equipamento">Tipo de Equipamento</Label>
                <Select
                  value={movementData.tipo_equipamento}
                  onValueChange={(value) => handleInputChange('tipo_equipamento', value)}
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

              {/* NOVO: Campo de status obrigatório para TACOM */}
              {isDestinationTacom() && (
                <MovementStatusSelector
                  isRequired={true}
                  value={movementData.status_equipamento}
                  onChange={(value) => handleInputChange('status_equipamento', value)}
                  label="Status para TACOM"
                />
              )}
            </div>

            {/* Seleção dos Equipamentos */}
            <div>
              <Label>Equipamentos Selecionados</Label>
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
          equipmentType={movementData.tipo_equipamento}
        />
      )}
    </div>
  );
};

export default MovementPage;
