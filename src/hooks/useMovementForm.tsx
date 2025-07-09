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
    if (selectedEquipments.length === 0 || !movementData.tipo_movimento || !movementData.data_movimento) {
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

    if (movementData.tipo_movimento === 'manutencao' && !movementData.tipo_manutencao_id) {
      toast({
        title: "Erro",
        description: "Tipo de manutenção é obrigatório para movimentações de manutenção.",
        variant: "destructive",
      });
      return false;
    }

    if (movementData.tipo_movimento === 'movimentacao' && !movementData.empresa_destino) {
      toast({
        title: "Erro",
        description: "Para movimentações entre empresas, selecione a empresa de destino.",
        variant: "destructive",
      });
      return false;
    }

    if (isDestinationTacom() && !movementData.status_equipamento) {
      toast({
        title: "Erro",
        description: "Status do equipamento é obrigatório para movimentações para TACOM.",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);

    try {
      console.log('=== PROCESSANDO MOVIMENTAÇÃO ===');
      console.log('Equipamentos selecionados:', selectedEquipments);
      console.log('Dados da movimentação:', movementData);
      console.log('Usuário logado:', user);

      for (const equipment of selectedEquipments) {
        console.log(`=== PROCESSANDO EQUIPAMENTO ${equipment.numero_serie} ===`);
        
        const movimentationData: any = {
          id_equipamento: equipment.id,
          tipo_movimento: movementData.tipo_movimento,
          data_movimento: movementData.data_movimento,
          observacoes: movementData.observacoes || null,
          usuario_responsavel: user?.username || 'Sistema'
        };

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

        let updateData: any = {};

        if (movementData.tipo_movimento === 'saida') {
          updateData.data_saida = movementData.data_movimento;
          updateData.status = 'em_uso';
        } else if (movementData.tipo_movimento === 'entrada') {
          updateData.data_saida = null;
          updateData.status = 'disponivel';
        } else if (movementData.tipo_movimento === 'movimentacao') {
          if (movementData.empresa_destino) {
            updateData.id_empresa = movementData.empresa_destino;
            console.log('=== ATUALIZANDO EMPRESA DO EQUIPAMENTO ===');
            console.log(`Equipamento ${equipment.numero_serie}: empresa ${equipment.empresas?.name} -> nova empresa ID: ${movementData.empresa_destino}`);
            
            const newCompany = companies.find(c => c.id === movementData.empresa_destino);
            console.log(`Nova empresa: ${newCompany?.name}`);
          }
          
          // CORREÇÃO: Aplicar regras de status por empresa
          if (isDestinationTacom() && movementData.status_equipamento) {
            updateData.status = movementData.status_equipamento;
            console.log(`Status definido para TACOM: ${movementData.status_equipamento}`);
          } else if (!isDestinationTacom()) {
            updateData.status = 'em_uso'; // CORREÇÃO: Equipamentos não-TACOM ficam "em_uso"
            console.log(`Status definido para empresa não-TACOM: "em_uso"`);
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

          console.log('✅ Equipamento', equipment.numero_serie, 'atualizado com sucesso');
          console.log('✅ Status atualizado para:', updateData.status);
          
          if (movementData.tipo_movimento === 'movimentacao' && movementData.empresa_destino) {
            const newCompany = companies.find(c => c.id === movementData.empresa_destino);
            console.log(`✅ EMPRESA ATUALIZADA: Equipamento ${equipment.numero_serie} agora pertence à empresa: ${newCompany?.name}`);
          }
        } else {
          console.log('⚠️ Nenhum dado para atualizar no equipamento', equipment.numero_serie);
        }
      }

      toast({
        title: "Sucesso",
        description: `Movimentação registrada com sucesso para ${selectedEquipments.length} equipamento(s)!`,
      });

      setSelectedEquipments([]);
      const dataAtual = getCurrentLocalDate();
      
      setMovementData({
        tipo_movimento: '',
        data_movimento: dataAtual,
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
      console.error('Erro ao processar movimentação:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar movimentação.",
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
    movementData,
    loading,
    isDestinationTacom,
    handleInputChange,
    handleSubmit,
    updateOriginCompany
  };
};
