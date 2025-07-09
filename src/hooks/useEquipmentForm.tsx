
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getCurrentLocalDate } from '@/utils/dateUtils';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  modelo?: string;
  estado?: string;
  status?: string;
  data_entrada: string;
  data_saida?: string;
  id_empresa: string;
}

interface Company {
  id: string;
  name: string;
  estado?: string;
}

interface EquipmentType {
  id: string;
  nome: string;
}

interface FormData {
  numero_serie: string;
  tipo: string;
  modelo: string;
  estado: string;
  status: string;
  data_entrada: string;
  id_empresa: string;
}

export const useEquipmentForm = (
  equipment: Equipment | null | undefined,
  companies: Company[],
  onSave: () => void
) => {
  const [formData, setFormData] = useState<FormData>({
    numero_serie: '',
    tipo: '',
    modelo: '',
    estado: '',
    status: 'disponivel',
    data_entrada: '',
    id_empresa: ''
  });
  
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEquipmentTypes();
    
    if (equipment) {
      console.log('Carregando equipamento para edição:', equipment);
      const dataEntrada = equipment.data_entrada || getCurrentLocalDate();
      
      setFormData({
        numero_serie: equipment.numero_serie || '',
        tipo: equipment.tipo || '',
        modelo: equipment.modelo || '',
        estado: equipment.estado || '',
        status: equipment.status || 'disponivel',
        data_entrada: dataEntrada,
        id_empresa: equipment.id_empresa || ''
      });
      
      const company = companies.find(c => c.id === equipment.id_empresa);
      if (company) {
        setSelectedCompany(company);
      }
    } else {
      const dataAtual = getCurrentLocalDate();
      console.log('Data atual para novo equipamento:', dataAtual);
      
      setFormData(prev => ({
        ...prev,
        data_entrada: dataAtual
      }));
    }
  }, [equipment, companies]);

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
    console.log(`Alterando campo ${field} para:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCompanyChange = (companyId: string) => {
    console.log('Alterando empresa para ID:', companyId);
    const company = companies.find(c => c.id === companyId);
    setSelectedCompany(company || null);
    
    // Verificar se a empresa é TACOM
    const isTacom = company?.name?.toUpperCase().includes('TACOM') || false;
    
    setFormData(prev => ({
      ...prev,
      id_empresa: companyId,
      estado: company?.estado || '',
      // Se não for TACOM, definir status como "em_uso"
      status: !isTacom ? 'em_uso' : prev.status
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== SALVANDO EQUIPAMENTO ===');
    console.log('Dados do formulário:', formData);
    console.log('Equipamento existente:', equipment);
    
    if (!formData.numero_serie || !formData.tipo || !formData.id_empresa) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (equipment) {
        console.log('Atualizando equipamento existente com ID:', equipment.id);
        
        const updateData = {
          numero_serie: formData.numero_serie,
          tipo: formData.tipo,
          modelo: formData.modelo || null,
          estado: formData.estado || null,
          status: formData.status,
          data_entrada: formData.data_entrada,
          id_empresa: formData.id_empresa
        };
        
        console.log('Dados para atualização:', updateData);

        const { error } = await supabase
          .from('equipamentos')
          .update(updateData)
          .eq('id', equipment.id);

        if (error) {
          console.error('Erro na atualização:', error);
          throw error;
        }

        console.log('Equipamento atualizado com sucesso');
        
        toast({
          title: "Sucesso",
          description: "Equipamento atualizado com sucesso!",
        });
      } else {
        console.log('Criando novo equipamento');
        
        const insertData = {
          numero_serie: formData.numero_serie,
          tipo: formData.tipo,
          modelo: formData.modelo || null,
          estado: formData.estado || null,
          status: formData.status,
          data_entrada: formData.data_entrada,
          id_empresa: formData.id_empresa
        };
        
        console.log('Dados para inserção:', insertData);

        const { error } = await supabase
          .from('equipamentos')
          .insert(insertData);

        if (error) {
          console.error('Erro na inserção:', error);
          throw error;
        }

        console.log('Equipamento criado com sucesso');

        toast({
          title: "Sucesso",
          description: "Equipamento criado com sucesso!",
        });
      }

      onSave();
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      
      let errorMessage = "Erro desconhecido ao salvar equipamento.";
      
      if (error && typeof error === 'object') {
        if ('message' in error) {
          errorMessage = `Erro: ${error.message}`;
        } else if ('details' in error) {
          errorMessage = `Erro: ${error.details}`;
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    equipmentTypes,
    selectedCompany,
    loading,
    handleInputChange,
    handleCompanyChange,
    handleSubmit
  };
};
