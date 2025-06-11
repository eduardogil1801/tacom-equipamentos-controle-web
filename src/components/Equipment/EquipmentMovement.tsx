import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Search, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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

interface Company {
  id: string;
  name: string;
}

interface MaintenanceType {
  id: string;
  codigo: string;
  descricao: string;
}

const EquipmentMovement: React.FC<EquipmentMovementProps> = ({ onCancel, onSuccess }) => {
  const { user } = useAuth();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [movementType, setMovementType] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('');
  const [movementDate, setMovementDate] = useState('');
  const [observations, setObservations] = useState('');
  const [maintenanceDetails, setMaintenanceDetails] = useState('');
  const [responsibleUser, setResponsibleUser] = useState('');
  const [loading, setLoading] = useState(false);
  const [enableMultipleSelection, setEnableMultipleSelection] = useState(false);
  const [isSelectionExpanded, setIsSelectionExpanded] = useState(true);

  useEffect(() => {
    loadEquipments();
    loadCompanies();
    loadMaintenanceTypes();
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = equipments.filter(equipment =>
        equipment.numero_serie.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEquipments(filtered);
    } else {
      setFilteredEquipments([]);
    }
  }, [searchTerm, equipments]);

  const loadCurrentUser = async () => {
    try {
      if (user?.email) {
        const { data: profiles, error } = await supabase
          .from('usuarios')
          .select('nome, sobrenome')
          .eq('email', user.email)
          .single();

        if (!error && profiles) {
          setResponsibleUser(`${profiles.nome} ${profiles.sobrenome}`.trim());
        } else {
          const userName = user.user_metadata?.name || user.email?.split('@')[0] || '';
          setResponsibleUser(userName);
        }
      }
    } catch (error) {
      console.error('Error loading current user:', error);
      if (user?.email) {
        setResponsibleUser(user.email.split('@')[0]);
      }
    }
  };

  const loadEquipments = async () => {
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`*, empresas ( name )`)
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

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
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
        .select('*')
        .eq('ativo', true)
        .order('codigo');

      if (error) throw error;
      const filteredAndSortedData = (data || [])
        .filter(type => type.id && type.id.trim() !== '' && type.codigo && type.descricao)
        .sort((a, b) => parseInt(a.codigo) - parseInt(b.codigo));
      setMaintenanceTypes(filteredAndSortedData);
    } catch (error) {
      console.error('Error loading maintenance types:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de manutenção",
        variant: "destructive",
      });
    }
  };

  const handleMultipleSelectionChange = (checked: boolean | "indeterminate") => {
    setEnableMultipleSelection(checked === true);
    if (checked !== true && selectedEquipments.length > 1) {
      setSelectedEquipments([selectedEquipments[0]]);
    }
  };

  const handleEquipmentSelect = (equipment: Equipment, checked: boolean) => {
    if (checked) {
      if (!selectedEquipments.find(item => item.id === equipment.id)) {
        if (enableMultipleSelection) {
          setSelectedEquipments(prev => [...prev, equipment]);
        } else {
          setSelectedEquipments([equipment]);
        }
      }
    } else {
      setSelectedEquipments(prev => prev.filter(item => item.id !== equipment.id));
    }
  };

  const handleAddToSelection = () => {
    if (filteredEquipments.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum equipamento encontrado para adicionar",
        variant: "destructive",
      });
      return;
    }
    const newEquipments = filteredEquipments.filter(eq => 
      !selectedEquipments.find(selected => selected.id === eq.id)
    );
    if (newEquipments.length === 0) {
      toast({
        title: "Aviso",
        description: "Todos os equipamentos encontrados já estão selecionados",
      });
      return;
    }
    if (enableMultipleSelection) {
      setSelectedEquipments(prev => [...prev, ...newEquipments]);
    } else {
      setSelectedEquipments([newEquipments[0]]);
    }
    toast({
      title: "Sucesso",
      description: `${newEquipments.length} equipamento(s) adicionado(s) à seleção`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEquipments.length === 0 || !movementType || !movementDate) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios e selecione pelo menos um equipamento",
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
    if (movementType === 'saida' && !targetCompany) {
      toast({
        title: "Erro",
        description: "Por favor, selecione a empresa de destino para a saída",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      for (const equipment of selectedEquipments) {
        const movementData = {
          id_equipamento: equipment.id,
          tipo_movimento: movementType,
          data_movimento: movementDate,
          observacoes: observations || null,
          usuario_responsavel: responsibleUser || null,
          tipo_manutencao_id: movementType === 'manutencao' ? maintenanceType : null,
          detalhes_manutencao: movementType === 'manutencao' ? maintenanceDetails : null,
        };
        const { error } = await supabase.from('movimentacoes').insert([movementData]);
        if (error) throw error;
        if (movementType === 'manutencao') {
          const { error: updateError } = await supabase.from('equipamentos')
            .update({ em_manutencao: true, status: 'aguardando_manutencao' })
            .eq('id', equipment.id);
          if (updateError) throw updateError;
        } else if (movementType === 'saida') {
          const { error: updateError } = await supabase.from('equipamentos')
            .update({ data_saida: movementDate, status: 'em_uso', id_empresa: targetCompany })
            .eq('id', equipment.id);
          if (updateError) throw updateError;
        }
      }
      toast({
        title: "Sucesso",
        description: `Movimentação registrada com sucesso para ${selectedEquipments.length} equipamento(s)!`,
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Erro",
        description: `Erro ao registrar movimentação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return <div>{/* JSX conforme fornecido anteriormente para renderização dos cards e formulários */}</div>;
};

export default EquipmentMovement;
