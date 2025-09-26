import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useHybridAuth';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  modelo?: string;
  status: string;
}

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
  categoria_defeito?: 'defeito_reclamado' | 'defeito_encontrado' | 'outro';
}

interface MovementData {
  tipo_movimento: string;
  data_movimento: string;
  observacoes: string;
  empresa_destino: string;
  empresa_origem?: string;
  tipo_manutencao_id: string;
  defeito_reclamado_id?: string;  // NOVO
  defeito_encontrado_id?: string; // NOVO
  tipo_equipamento: string;
  modelo_equipamento: string;
  status_equipamento: string;
}

export const useMovementForm = () => {
  const { user } = useAuth();
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNewFields, setHasNewFields] = useState(false);
  
  const [movementData, setMovementData] = useState<MovementData>({
    tipo_movimento: '',
    data_movimento: new Date().toISOString().split('T')[0],
    observacoes: '',
    empresa_destino: '',
    empresa_origem: '',
    tipo_manutencao_id: '',
    defeito_reclamado_id: '',
    defeito_encontrado_id: '',
    tipo_equipamento: '',
    modelo_equipamento: '',
    status_equipamento: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await Promise.all([
      loadCompanies(),
      loadMaintenanceTypes(),
      loadEquipmentTypes()
    ]);
  };

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      
      const companiesData = (data || []).map(company => ({
        id: company.id,
        name: company.nome
      }));
      
      setCompanies(companiesData);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    }
  };

  const loadMaintenanceTypes = async () => {
    try {
      // Tentar carregar com os novos campos
      const { data, error } = await supabase
        .from('tipos_manutencao')
        .select('*')
        .eq('ativo', true)
        .order('categoria_defeito', { ascending: true })
        .order('descricao', { ascending: true });

      if (error) {
        console.warn('Erro ao carregar tipos com categoria (campo pode não existir):', error);
        // Fallback para modo compatibilidade
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('tipos_manutencao')
          .select('id, codigo, descricao, ativo')
          .eq('ativo', true)
          .order('descricao', { ascending: true });
        
        if (fallbackError) throw fallbackError;
        
        // Auto-categorizar baseado no código
        const typesWithCategory = (fallbackData || []).map(type => ({
          ...type,
          categoria_defeito: autoCategorizeCodigo(type.codigo)
        }));
        
        setMaintenanceTypes(typesWithCategory);
        setHasNewFields(false);
      } else {
        // Verificar se o campo categoria_defeito realmente existe
        const hasCategoria = data && data.length > 0 && 'categoria_defeito' in data[0];
        setHasNewFields(hasCategoria);
        
        if (hasCategoria) {
          setMaintenanceTypes(data || []);
        } else {
          // Adicionar categoria baseada no código
          const typesWithCategory = (data || []).map(type => ({
            ...type,
            categoria_defeito: autoCategorizeCodigo(type.codigo)
          }));
          setMaintenanceTypes(typesWithCategory);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de manutenção:', error);
      setMaintenanceTypes([]);
    }
  };

  const autoCategorizeCodigo = (codigo: string): 'defeito_reclamado' | 'defeito_encontrado' | 'outro' => {
    const codigoUpper = codigo.toUpperCase();
    if (codigoUpper.startsWith('DR')) {
      return 'defeito_reclamado';
    } else if (codigoUpper.startsWith('DE') || codigoUpper.startsWith('ER')) {
      return 'defeito_encontrado';
    }
    return 'outro';
  };

  const loadEquipmentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_equipamento')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setEquipmentTypes(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de equipamento:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setMovementData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isDestinationTacom = () => {
    const tacomCompany = companies.find(c => 
      c.name.includes('TACOM') && 
      movementData.empresa_destino === c.id
    );
    return !!tacomCompany;
  };

  const updateOriginCompany = (equipments: Equipment[]) => {
    if (equipments.length > 0) {
      // Lógica para definir empresa origem baseada nos equipamentos selecionados
      // Por enquanto, usar uma lógica simples
      setMovementData(prev => ({
        ...prev,
        empresa_origem: 'Empresa dos equipamentos selecionados'
      }));
    }
  };

  const validateForm = (): boolean => {
    if (selectedEquipments.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um equipamento.",
        variant: "destructive",
      });
      return false;
    }

    if (!movementData.tipo_movimento) {
      toast({
        title: "Erro",
        description: "Tipo de movimentação é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    if (!movementData.tipo_equipamento) {
      toast({
        title: "Erro",
        description: "Tipo de equipamento é obrigatório.",
        variant: "destructive",
      });
      return false;
    }

    if (!movementData.empresa_destino) {
      toast({
        title: "Erro",
        description: "Empresa de destino é obrigatória.",
        variant: "destructive",
      });
      return false;
    }

    // Validação para defeitos (quando aplicável)
    const needsDefeitoReclamado = hasNewFields && (
      movementData.tipo_movimento === 'manutencao' || 
      movementData.tipo_movimento === 'movimentacao_interna' || 
      movementData.tipo_movimento === 'envio_manutencao' ||
      movementData.tipo_movimento === 'devolucao' ||
      movementData.tipo_movimento === 'retorno_manutencao'
    );

    if (needsDefeitoReclamado && !movementData.defeito_reclamado_id) {
      toast({
        title: "Erro",
        description: "Defeito reclamado é obrigatório para este tipo de movimentação.",
        variant: "destructive",
      });
      return false;
    }

    // Validação para campo legado (quando novos campos não existem)
    const needsLegacyField = !needsDefeitoReclamado && (
      movementData.tipo_movimento === 'manutencao' ||
      movementData.tipo_movimento === 'movimentacao_interna' || 
      movementData.tipo_movimento === 'envio_manutencao' ||
      movementData.tipo_movimento === 'devolucao' ||
      movementData.tipo_movimento === 'retorno_manutencao'
    );

    if (needsLegacyField && !movementData.tipo_manutencao_id) {
      toast({
        title: "Erro",
        description: "Tipo de manutenção é obrigatório para este tipo de movimentação.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (): Promise<boolean> => {
    if (!validateForm()) {
      return false;
    }

    try {
      setLoading(true);

      console.log('=== PROCESSANDO MOVIMENTAÇÃO ===');
      console.log('Equipamentos selecionados:', selectedEquipments);
      console.log('Dados da movimentação:', movementData);
      console.log('Usuário logado:', user);
      console.log('Novos campos disponíveis:', hasNewFields);

      // Buscar nome completo do usuário logado
      let currentUserName = user?.name && user?.surname ? 
        `${user.name} ${user.surname}` : 
        user?.username || 'Usuário não identificado';

      for (const equipment of selectedEquipments) {
        console.log(`\n=== PROCESSANDO EQUIPAMENTO ${equipment.numero_serie} ===`);

        // Preparar dados da movimentação
        const movementInsertData: any = {
          id_equipamento: equipment.id,
          tipo_movimento: movementData.tipo_movimento,
          data_movimento: movementData.data_movimento,
          usuario_responsavel: currentUserName,
          observacoes: movementData.observacoes
        };

        // Adicionar campos de defeitos se disponíveis e preenchidos
        if (hasNewFields && movementData.defeito_reclamado_id) {
          movementInsertData.defeito_reclamado_id = movementData.defeito_reclamado_id;
        }
        
        if (hasNewFields && movementData.defeito_encontrado_id) {
          movementInsertData.defeito_encontrado_id = movementData.defeito_encontrado_id;
        }

        // Campo legado para compatibilidade
        if (movementData.tipo_manutencao_id) {
          movementInsertData.tipo_manutencao_id = movementData.tipo_manutencao_id;
        }

        console.log('Dados da movimentação para inserir:', movementInsertData);

        // Inserir movimentação
        const { error: movementError } = await supabase
          .from('movimentacoes')
          .insert([movementInsertData]);

        if (movementError) {
          console.error('Erro ao inserir movimentação:', movementError);
          throw movementError;
        }

        console.log('✅ Movimentação inserida com sucesso');

        // Lógica para atualizar o equipamento (baseada no tipo de movimentação)
        const updateData: any = {};

        if (movementData.tipo_movimento === 'saida') {
          updateData.data_saida = movementData.data_movimento;
          updateData.empresa_atual = movementData.empresa_destino;
        } else if (movementData.tipo_movimento === 'devolucao' || 
                   movementData.tipo_movimento === 'retorno_manutencao') {
          if (movementData.status_equipamento) {
            updateData.status = movementData.status_equipamento;
          } else {
            updateData.status = 'disponivel';
          }
        } else if (movementData.tipo_movimento === 'manutencao') {
          if (movementData.status_equipamento) {
            updateData.status = movementData.status_equipamento;
          } else {
            updateData.status = 'manutencao';
          }
        } else {
          // Para outros tipos de movimento
          if (isDestinationTacom() && movementData.status_equipamento) {
            updateData.status = movementData.status_equipamento;
          } else if (!isDestinationTacom()) {
            if (movementData.status_equipamento === 'manutencao') {
              updateData.status = 'em_uso';
              console.log('⚠️ CORREÇÃO: Status "manutenção" não permitido para empresa não-TACOM, alterado para "em_uso"');
            } else if (movementData.status_equipamento) {
              updateData.status = movementData.status_equipamento;
            } else {
              updateData.status = 'em_uso';
            }
          }
        }

        // Atualizar tipo e modelo se especificados
        if (movementData.tipo_equipamento) {
          updateData.tipo = movementData.tipo_equipamento;
        }
        
        if (movementData.modelo_equipamento) {
          updateData.modelo = movementData.modelo_equipamento;
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

          console.log('✅ Equipamento atualizado com sucesso');
        }
      }

      toast({
        title: "Sucesso",
        description: `Movimentação de ${selectedEquipments.length} equipamento(s) realizada com sucesso!`,
      });

      // Resetar formulário
      resetForm();
      return true;

    } catch (error: any) {
      console.error('Erro ao processar movimentação:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar movimentação",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMovementData({
      tipo_movimento: '',
      data_movimento: new Date().toISOString().split('T')[0],
      observacoes: '',
      empresa_destino: '',
      empresa_origem: '',
      tipo_manutencao_id: '',
      defeito_reclamado_id: '',
      defeito_encontrado_id: '',
      tipo_equipamento: '',
      modelo_equipamento: '',
      status_equipamento: ''
    });
    setSelectedEquipments([]);
  };

  return {
    selectedEquipments,
    setSelectedEquipments,
    companies,
    maintenanceTypes,
    equipmentTypes,
    movementData,
    loading,
    hasNewFields,
    isDestinationTacom,
    handleInputChange,
    handleSubmit,
    updateOriginCompany,
    resetForm,
    validateForm
  };
};