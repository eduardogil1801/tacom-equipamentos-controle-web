import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getCurrentLocalDate } from '@/utils/dateUtils';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  modelo?: string;
  id_empresa: string;
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

interface MovementData {
  tipo_movimento: string;
  data_movimento: string;
  observacoes: string;
  empresa_destino: string;
  empresa_origem?: string;
  tipo_manutencao_id: string;
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
  
  const [movementData, setMovementData] = useState<MovementData>({
    tipo_movimento: '',
    data_movimento: '',
    observacoes: '',
    empresa_destino: '',
    empresa_origem: '',
    tipo_manutencao_id: '',
    tipo_equipamento: '',
    modelo_equipamento: '',
    status_equipamento: ''
  });

  const isDestinationTacom = () => {
    if (!movementData.empresa_destino) return false;
    const company = companies.find(c => c.id === movementData.empresa_destino);
    return company?.name.toUpperCase().includes('TACOM');
  };

  useEffect(() => {
    loadCompanies();
    loadMaintenanceTypes();
    loadEquipmentTypes();
    
    const dataAtual = getCurrentLocalDate();
    console.log('Data atual definida na movimentação:', dataAtual);
    
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

  const handleInputChange = (field: string, value: string) => {
    setMovementData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateOriginCompany = (equipments: Equipment[]) => {
    if (equipments.length > 0) {
      const firstEquipment = equipments[0];
      const companyName = firstEquipment.empresas?.name || '';
      setMovementData(prev => ({
        ...prev,
        empresa_origem: companyName
      }));
    } else {
      setMovementData(prev => ({
        ...prev,
        empresa_origem: ''
      }));
    }
  };

  const handleSubmit = async () => {
    console.log('=== INICIANDO HANDLESUBMIT ===');
    console.log('=== VALIDAÇÃO INICIAL ===');
    console.log('selectedEquipments:', selectedEquipments);
    console.log('movementData:', movementData);
    console.log('isDestinationTacom():', isDestinationTacom());
    
    try {
      setLoading(true);

      if (selectedEquipments.length === 0 || !movementData.tipo_movimento || !movementData.data_movimento) {
        console.log('❌ Erro: Campos obrigatórios não preenchidos');
        toast({
          title: "Erro",
          description: "Preencha todos os campos obrigatórios e selecione pelo menos um equipamento.",
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

      // Tipo de manutenção obrigatório para manutenção, movimentação interna, envio manutenção E devolução
      if ((movementData.tipo_movimento === 'manutencao' || 
           movementData.tipo_movimento === 'movimentacao_interna' || 
           movementData.tipo_movimento === 'envio_manutencao' ||
           movementData.tipo_movimento === 'devolucao') && !movementData.tipo_manutencao_id) {
        toast({
          title: "Erro",
          description: "Tipo de manutenção é obrigatório para este tipo de movimentação.",
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

      // Status obrigatório para TACOM, movimentação interna, envio manutenção, devolução E manutenção
      if ((isDestinationTacom() || 
           movementData.tipo_movimento === 'movimentacao_interna' || 
           movementData.tipo_movimento === 'envio_manutencao' ||
           movementData.tipo_movimento === 'devolucao' ||
           movementData.tipo_movimento === 'manutencao') && 
           !movementData.status_equipamento) {
        toast({
          title: "Erro",
          description: "Status do equipamento é obrigatório para este tipo de movimentação.",
          variant: "destructive",
        });
        return false;
      }

      console.log('=== PROCESSANDO MOVIMENTAÇÃO ===');
      console.log('Equipamentos selecionados:', selectedEquipments);
      console.log('Dados da movimentação:', movementData);
      console.log('Usuário logado:', user);

      // Buscar nome completo do usuário logado
      let currentUserName = user?.name && user?.surname ? `${user.name} ${user.surname}` : 'Usuário não identificado';
      
      // Se temos o ID do usuário mas não o nome completo, buscar no banco
      if (user?.id && (!user?.name || !user?.surname)) {
        try {
          const { data: userData } = await supabase
            .from('usuarios')
            .select('nome, sobrenome')
            .eq('id', user.id)
            .single();
          
          if (userData) {
            currentUserName = `${userData.nome} ${userData.sobrenome}`;
          }
        } catch (error) {
          console.error('Erro ao buscar dados do usuário:', error);
          // Manter o nome do usuário atual se houver erro
        }
      }

      for (const equipment of selectedEquipments) {
        console.log(`=== PROCESSANDO EQUIPAMENTO ${equipment.numero_serie} ===`);
        
        // Verificar se o equipamento já está na empresa de destino (para movimentações)
        if (movementData.tipo_movimento === 'movimentacao' && equipment.id_empresa === movementData.empresa_destino) {
          console.log(`⚠️ Equipamento ${equipment.numero_serie} já está na empresa de destino`);
          toast({
            title: "Aviso",
            description: `O equipamento ${equipment.numero_serie} já está na empresa de destino.`,
            variant: "destructive",
          });
          continue; // Pula este equipamento
        }

        // Para movimentações e devoluções, verificar se não é uma movimentação duplicada para a MESMA empresa
        if (movementData.tipo_movimento === 'movimentacao' || movementData.tipo_movimento === 'devolucao') {
          const { data: existingMovements } = await supabase
            .from('movimentacoes')
            .select(`
              id,
              equipamentos!inner(id_empresa, empresas(name))
            `)
            .eq('id_equipamento', equipment.id)
            .eq('data_movimento', movementData.data_movimento)
            .eq('tipo_movimento', movementData.tipo_movimento);

          // Verificar se já existe movimentação para a mesma empresa de destino hoje
          const sameDestinationToday = existingMovements?.some(mov => 
            mov.equipamentos?.id_empresa === movementData.empresa_destino
          );

          if (sameDestinationToday) {
            console.log(`⚠️ Já existe uma movimentação para a mesma empresa de destino hoje para equipamento ${equipment.numero_serie}`);
            toast({
              title: "Aviso", 
              description: `Já existe uma movimentação para a mesma empresa de destino hoje para o equipamento ${equipment.numero_serie}.`,
              variant: "destructive",
            });
            continue; // Pula este equipamento
          }

          console.log(`✅ Permitindo nova movimentação para empresa diferente - Equipamento ${equipment.numero_serie}`);
        }
        
        const movimentationData: any = {
          id_equipamento: equipment.id,
          tipo_movimento: movementData.tipo_movimento,
          data_movimento: movementData.data_movimento,
          observacoes: movementData.observacoes || null,
          usuario_responsavel: currentUserName
        };

        if ((movementData.tipo_movimento === 'manutencao' || 
             movementData.tipo_movimento === 'aguardando_manutencao' ||
             movementData.tipo_movimento === 'movimentacao_interna' ||
             movementData.tipo_movimento === 'envio_manutencao' ||
             movementData.tipo_movimento === 'devolucao') 
            && movementData.tipo_manutencao_id) {
          movimentationData.tipo_manutencao_id = movementData.tipo_manutencao_id;
        }

        console.log('Dados da movimentação para equipamento', equipment.numero_serie, ':', movimentationData);

        // Para contornar a constraint única, usar upsert com retry
        let attemptCount = 0;
        let movementError;
        
        do {
          console.log('=== TENTANDO INSERIR MOVIMENTAÇÃO ===');
          console.log('Dados da movimentação:', movimentationData);
          
          const { error } = await supabase
            .from('movimentacoes')
            .insert(movimentationData);
          
          movementError = error;
          
          if (movementError) {
            console.error('=== ERRO AO INSERIR MOVIMENTAÇÃO ===');
            console.error('Código:', movementError.code);
            console.error('Mensagem:', movementError.message);
            console.error('Detalhes:', movementError.details);
            console.error('Dados tentando inserir:', movimentationData);
          }
          
          if (movementError?.code === '23505') {
            attemptCount++;
            if (attemptCount < 3) {
              console.log(`Tentativa ${attemptCount}: Constraint violation, aguardando 100ms...`);
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
        } while (movementError?.code === '23505' && attemptCount < 3);

        if (movementError) {
          console.error('Erro final ao inserir movimentação:', movementError);
          throw movementError;
        }

        console.log('Movimentação registrada com sucesso para', equipment.numero_serie);

        let updateData: any = {};

        console.log('=== DEFININDO DADOS PARA ATUALIZAÇÃO ===');
        console.log('Tipo de movimento:', movementData.tipo_movimento);
        console.log('É destino TACOM?', isDestinationTacom());
        console.log('Empresa destino:', movementData.empresa_destino);

        if (movementData.tipo_movimento === 'saida') {
          updateData.data_saida = movementData.data_movimento;
          updateData.status = 'em_uso';
        } else if (movementData.tipo_movimento === 'entrada') {
          updateData.data_saida = null;
          updateData.status = 'disponivel';
        } else if (movementData.tipo_movimento === 'movimentacao' || 
                   movementData.tipo_movimento === 'devolucao' ||
                   movementData.tipo_movimento === 'movimentacao_interna' ||
                   movementData.tipo_movimento === 'envio_manutencao' ||
                   movementData.tipo_movimento === 'manutencao') {
          
          // Atualizar empresa
          if (movementData.empresa_destino) {
            updateData.id_empresa = movementData.empresa_destino;
            console.log('=== ATUALIZANDO EMPRESA DO EQUIPAMENTO ===');
            console.log(`Equipamento ${equipment.numero_serie}: empresa ${equipment.empresas?.name} -> nova empresa ID: ${movementData.empresa_destino}`);
            
            const newCompany = companies.find(c => c.id === movementData.empresa_destino);
            console.log(`Nova empresa: ${newCompany?.name}`);
          }
          
          // Definir status baseado no tipo de movimento
          if (movementData.tipo_movimento === 'devolucao') {
            // Para devolução/retorno de manutenção, sempre usar o status selecionado pelo usuário
            if (movementData.status_equipamento) {
              updateData.status = movementData.status_equipamento;
              console.log(`Status definido para devolução: "${movementData.status_equipamento}"`);
            } else {
              updateData.status = 'disponivel'; // fallback para devolução
              console.log(`Status fallback para devolução: "disponivel"`);
            }
          } else if (movementData.tipo_movimento === 'manutencao') {
            // Para manutenção, usar o status selecionado pelo usuário se disponível
            if (movementData.status_equipamento) {
              updateData.status = movementData.status_equipamento;
              console.log(`Status definido para manutenção: "${movementData.status_equipamento}"`);
            } else {
              updateData.status = 'manutencao'; // fallback
            }
          } else {
            // Para outros tipos de movimento (movimentacao, movimentacao_interna, envio_manutencao)
            if (isDestinationTacom() && movementData.status_equipamento) {
              // Para TACOM: permitir qualquer status selecionado pelo usuário
              updateData.status = movementData.status_equipamento;
              console.log(`Status definido para TACOM: ${movementData.status_equipamento}`);
            } else if (!isDestinationTacom()) {
              // Para empresas NÃO-TACOM: NUNCA permitir status "manutenção"
              if (movementData.status_equipamento === 'manutencao') {
                updateData.status = 'em_uso'; // Forçar "em_uso" se tentou usar "manutenção"
                console.log(`⚠️ CORREÇÃO: Status "manutenção" não permitido para empresa não-TACOM, alterado para "em_uso"`);
              } else if (movementData.status_equipamento) {
                updateData.status = movementData.status_equipamento;
                console.log(`Status definido para empresa não-TACOM: ${movementData.status_equipamento}`);
              } else {
                updateData.status = 'em_uso'; // Status padrão para empresas não-TACOM
                console.log(`Status padrão definido para empresa não-TACOM: "em_uso"`);
              }
            }
          }
        } else if (movementData.tipo_movimento === 'aguardando_manutencao') {
          updateData.status = 'aguardando_manutencao';
        } else if (movementData.tipo_movimento === 'danificado') {
          updateData.status = 'danificado';
        } else if (movementData.tipo_movimento === 'indisponivel') {
          updateData.status = 'indisponivel';
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
          console.log('=== TENTANDO ATUALIZAR EQUIPAMENTO ===');
          console.log('ID do equipamento:', equipment.id);
          console.log('Dados para atualização:', updateData);
          
          const { error: updateError } = await supabase
            .from('equipamentos')
            .update(updateData)
            .eq('id', equipment.id);

          if (updateError) {
            console.error('=== ERRO AO ATUALIZAR EQUIPAMENTO ===');
            console.error('Código:', updateError.code);
            console.error('Mensagem:', updateError.message);
            console.error('Detalhes:', updateError.details);
            console.error('Dados tentando atualizar:', updateData);
            throw updateError;
          }

          console.log(`✅ Equipamento ${equipment.numero_serie} atualizado com sucesso:`, updateData);
        } else {
          console.log('Nenhuma atualização necessária para o equipamento', equipment.numero_serie);
        }
      }

      console.log('=== MOVIMENTAÇÃO CONCLUÍDA COM SUCESSO ===');
      
      toast({
        title: "Sucesso",
        description: `Movimentação ${movementData.tipo_movimento} registrada com sucesso para ${selectedEquipments.length} equipamento(s).`,
        variant: "default",
      });

      // Reset form
      setSelectedEquipments([]);
      setMovementData({
        tipo_movimento: '',
        data_movimento: getCurrentLocalDate(),
        observacoes: '',
        empresa_destino: '',
        empresa_origem: '',
        tipo_manutencao_id: '',
        tipo_equipamento: '',
        modelo_equipamento: '',
        status_equipamento: ''
      });

      return true;

    } catch (error) {
      console.error('=== ERRO GERAL NA MOVIMENTAÇÃO ===');
      console.error('Tipo do erro:', typeof error);
      console.error('Erro:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'Stack não disponível');
      
      toast({
        title: "Erro",
        description: `Erro ao registrar movimentação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    selectedEquipments,
    setSelectedEquipments,
    companies,
    maintenanceTypes,
    equipmentTypes,
    loading,
    movementData,
    handleInputChange,
    handleSubmit,
    updateOriginCompany,
    isDestinationTacom
  };
};