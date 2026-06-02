import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useHybridAuth';
import { isTacomCompanyName } from '@/utils/tacomCompany';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  modelo?: string;
  status: string;
  id_empresa?: string;
  empresas?: {
    nome: string;
  };
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
  defeito_reclamado_id?: string;
  defeito_encontrado_id?: string;
  outro_defeito_id?: string;
  tipo_equipamento: string;
  modelo_equipamento: string;
  status_equipamento: string;
}

export const useMovementForm = () => {
  const { user } = useAuth();
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [defeitosReclamados, setDefeitosReclamados] = useState<MaintenanceType[]>([]);
  const [defeitosEncontrados, setDefeitosEncontrados] = useState<MaintenanceType[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNewFields, setHasNewFields] = useState(false);
  const [confirmation, setConfirmation] = useState<{ title: string; messages: string[] } | null>(null);
  const pendingExecuteRef = useRef<(() => Promise<void>) | null>(null);
  
  
  const [movementData, setMovementData] = useState<MovementData>({
    tipo_movimento: '',
    data_movimento: new Date().toISOString().split('T')[0],
    observacoes: '',
    empresa_destino: '',
    empresa_origem: '',
    tipo_manutencao_id: '',
    defeito_reclamado_id: '',
    defeito_encontrado_id: '',
    outro_defeito_id: '',
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
      loadEquipmentTypes(),
      loadDefeitosReclamados(),
      loadDefeitosEncontrados()
    ]);
  };

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, name')
        .order('name');

      if (error) throw error;
      
      setCompanies((data || []) as Company[]);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar empresas",
        variant: "destructive",
      });
    }
  };

  const loadMaintenanceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_manutencao')
        .select('id, codigo, descricao, categoria_defeito')
        .eq('ativo', true)
        .order('codigo');

      if (error) throw error;
      
      setMaintenanceTypes((data || []) as MaintenanceType[]);
    } catch (error) {
      console.error('Erro ao carregar tipos de manutenção:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de manutenção",
        variant: "destructive",
      });
    }
  };

  const loadDefeitosReclamados = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_manutencao')
        .select('id, codigo, descricao')
        .like('codigo', 'DR-%')
        .eq('ativo', true)
        .order('codigo');

      if (error) throw error;
      
      setDefeitosReclamados((data || []) as MaintenanceType[]);
    } catch (error) {
      console.error('Erro ao carregar defeitos reclamados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar defeitos reclamados",
        variant: "destructive",
      });
    }
  };

  const loadDefeitosEncontrados = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_manutencao')
        .select('id, codigo, descricao')
        .like('codigo', 'DE-%')
        .eq('ativo', true)
        .order('codigo');

      if (error) throw error;
      
      setDefeitosEncontrados((data || []) as MaintenanceType[]);
    } catch (error) {
      console.error('Erro ao carregar defeitos encontrados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar defeitos encontrados",
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
      
      setEquipmentTypes((data || []) as EquipmentType[]);
    } catch (error) {
      console.error('Erro ao carregar tipos de equipamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de equipamentos",
        variant: "destructive",
      });
    }
  };

  const isDestinationTacom = () => {
    if (!movementData.empresa_destino) return false;
    const company = companies.find(
      c => c.id === movementData.empresa_destino || c.name === movementData.empresa_destino
    );
    return isTacomCompanyName(company?.name);
  };

  const handleInputChange = (field: keyof MovementData, value: string) => {
    setMovementData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateOriginCompany = (equipments: Equipment[]) => {
    if (equipments.length > 0 && equipments[0].id_empresa) {
      // Buscar o nome da empresa pelo ID
      const company = companies.find(c => c.id === equipments[0].id_empresa);
      setMovementData(prev => ({
        ...prev,
        empresa_origem: company?.name || ''
      }));
    }
  };

  const executeMovement = async () => {
    try {
      setLoading(true);

      const destCompanyGlobal = companies.find(
        c => c.name === movementData.empresa_destino || c.id === movementData.empresa_destino
      );

      const currentUserName = user?.name && user?.surname ? 
        `${user.name} ${user.surname}` : 
        user?.username || 'Usuário não identificado';

      for (const equipment of selectedEquipments) {
        console.log(`\n=== PROCESSANDO EQUIPAMENTO ${equipment.numero_serie} ===`);

        const destCompany = destCompanyGlobal;
        const origemCompany = equipment.id_empresa
          ? companies.find(c => c.id === equipment.id_empresa)
          : undefined;

        const movementInsertData: any = {
          id_equipamento: equipment.id,
          tipo_movimento: movementData.tipo_movimento,
          data_movimento: movementData.data_movimento,
          usuario_responsavel: currentUserName,
          observacoes: movementData.observacoes,
          empresa_origem_nome: origemCompany?.name || null,
          empresa_destino_nome: destCompany?.name || null,
        };

        if (movementData.defeito_reclamado_id) {
          movementInsertData.defeito_reclamado_id = movementData.defeito_reclamado_id;
        }
        if (movementData.defeito_encontrado_id) {
          movementInsertData.defeito_encontrado_id = movementData.defeito_encontrado_id;
        }
        if (movementData.tipo_manutencao_id) {
          movementInsertData.tipo_manutencao_id = movementData.tipo_manutencao_id;
        } else if (movementData.outro_defeito_id) {
          movementInsertData.tipo_manutencao_id = movementData.outro_defeito_id;
        }

        const { error: movementError } = await supabase
          .from('movimentacoes')
          .insert([movementInsertData]);

        if (movementError) throw movementError;
        console.log('✅ Movimentação inserida');

        const updateData: any = {};
        if (destCompany) updateData.id_empresa = destCompany.id;
        if (movementData.tipo_equipamento) updateData.tipo = movementData.tipo_equipamento;
        if (movementData.modelo_equipamento) updateData.modelo = movementData.modelo_equipamento;

        const isDestTacom = isTacomCompanyName(destCompany?.name);
        if (destCompany && !isDestTacom) {
          updateData.status = 'em_uso';
        } else if (movementData.status_equipamento) {
          updateData.status = movementData.status_equipamento;
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('equipamentos')
            .update(updateData)
            .eq('id', equipment.id);
          if (updateError) throw updateError;
        }
      }

      toast({
        title: "Sucesso",
        description: `Movimentação registrada para ${selectedEquipments.length} equipamento(s)`,
      });

      setSelectedEquipments([]);
      setMovementData({
        tipo_movimento: '',
        data_movimento: new Date().toISOString().split('T')[0],
        observacoes: '',
        empresa_destino: '',
        empresa_origem: '',
        tipo_manutencao_id: '',
        defeito_reclamado_id: '',
        defeito_encontrado_id: '',
        outro_defeito_id: '',
        tipo_equipamento: '',
        modelo_equipamento: '',
        status_equipamento: ''
      });
    } catch (error: any) {
      console.error('Erro ao registrar movimentação:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao registrar movimentação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validações bloqueantes
    if (selectedEquipments.length === 0) {
      toast({ title: "Atenção", description: "Selecione pelo menos um equipamento", variant: "destructive" });
      return;
    }
    if (!movementData.tipo_movimento) {
      toast({ title: "Atenção", description: "Selecione o tipo de movimentação", variant: "destructive" });
      return;
    }
    const requiresDefect = ['manutencao', 'envio_manutencao', 'retorno_manutencao', 'movimentacao_interna'].includes(
      movementData.tipo_movimento
    );
    if (requiresDefect && !movementData.defeito_reclamado_id && !movementData.defeito_encontrado_id && !movementData.outro_defeito_id) {
      toast({ title: "Atenção", description: "Selecione ao menos um defeito ou outro tipo de manutenção", variant: "destructive" });
      return;
    }
    if (!movementData.empresa_destino) {
      toast({ title: "Atenção", description: "Selecione a empresa destino", variant: "destructive" });
      return;
    }

    const destCompanyGlobal = companies.find(
      c => c.name === movementData.empresa_destino || c.id === movementData.empresa_destino
    );
    const destIsTacom = isTacomCompanyName(destCompanyGlobal?.name);

    // Origem = destino?
    const sameOriginDest = selectedEquipments.filter(eq => {
      const origem = companies.find(c => c.id === eq.id_empresa);
      return origem?.name && destCompanyGlobal?.name && origem.name === destCompanyGlobal.name;
    });

    if (sameOriginDest.length > 0 && !destIsTacom) {
      toast({
        title: "Movimentação não permitida",
        description: `Empresa cliente "${destCompanyGlobal?.name}" já possui o(s) equipamento(s) ${sameOriginDest.map(e => e.numero_serie).join(', ')} em uso. Não é possível movimentar para a mesma empresa cliente.`,
        variant: "destructive",
      });
      return;
    }

    // Coleta avisos para confirmação
    const warnings: string[] = [];

    if (sameOriginDest.length > 0 && destIsTacom) {
      const codes = sameOriginDest.map(e => e.numero_serie).join(', ');
      warnings.push(
        `O(s) equipamento(s) ${codes} já está(ão) em ${destCompanyGlobal?.name}. Deseja registrar mesmo assim (ex.: mudança de status)?`
      );
    }

    if (!destIsTacom && movementData.tipo_movimento === 'manutencao') {
      warnings.push(
        `O tipo de movimentação está como "Manutenção", mas o destino é uma empresa cliente (${destCompanyGlobal?.name}). O status será ajustado para "Em Uso".`
      );
    }

    if (
      !destIsTacom &&
      movementData.status_equipamento &&
      movementData.status_equipamento !== 'em_uso'
    ) {
      warnings.push(
        `O destino "${destCompanyGlobal?.name}" é empresa cliente — o status será forçado para "Em Uso".`
      );
    }

    if (warnings.length > 0) {
      pendingExecuteRef.current = executeMovement;
      setConfirmation({ title: "Confirmar movimentação", messages: warnings });
      return;
    }

    await executeMovement();
  };

  const confirmPending = async () => {
    const fn = pendingExecuteRef.current;
    pendingExecuteRef.current = null;
    setConfirmation(null);
    if (fn) await fn();
  };

  const cancelPending = () => {
    pendingExecuteRef.current = null;
    setConfirmation(null);
  };

  return {
    selectedEquipments,
    setSelectedEquipments,
    companies,
    maintenanceTypes,
    defeitosReclamados,
    defeitosEncontrados,
    equipmentTypes,
    loading,
    movementData,
    setMovementData,
    handleSubmit,
    hasNewFields,
    setHasNewFields,
    isDestinationTacom,
    handleInputChange,
    updateOriginCompany,
    confirmation,
    confirmPending,
    cancelPending,
  };
};