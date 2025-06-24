
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getCurrentLocalMonth } from '@/utils/dateUtils';
import { useAuth } from '@/hooks/useAuth';
import FleetFormFields from './FleetForm/FleetFormFields';
import FleetFormSummary from './FleetForm/FleetFormSummary';
import FleetFormActions from './FleetForm/FleetFormActions';

interface Company {
  id: string;
  name: string;
  cnpj?: string;
}

interface FleetData {
  nome_empresa: string;
  cod_operadora: string;
  mes_referencia: string;
  simples_com_imagem: number;
  simples_sem_imagem: number;
  secao: number;
  citgis: number;
  buszoom: number;
  nuvem: number;
}

const FleetForm = () => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState<FleetData>({
    nome_empresa: '',
    cod_operadora: '',
    mes_referencia: '',
    simples_com_imagem: 0,
    simples_sem_imagem: 0,
    secao: 0,
    citgis: 0,
    buszoom: 0,
    nuvem: 0
  });
  const [loading, setLoading] = useState(false);

  // Obter nome do usuário responsável
  const getUserResponsibleName = () => {
    if (user?.name && user?.surname) {
      return `${user.name} ${user.surname}`;
    }
    return user?.username || 'N/A';
  };

  useEffect(() => {
    loadCompanies();
    
    // Usar a função utilitária para obter o mês atual
    const mesAtual = getCurrentLocalMonth();
    console.log('Mês atual definido:', mesAtual);
    
    setFormData(prev => ({
      ...prev,
      mes_referencia: mesAtual
    }));
  }, []);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, name, cnpj')
        .order('name');

      if (error) throw error;
      
      console.log('Empresas carregadas:', data);
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

  const handleInputChange = (field: keyof FleetData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanyChange = async (companyName: string) => {
    try {
      console.log('Empresa selecionada:', companyName);
      
      // Buscar informações da empresa selecionada no banco de dados
      const { data: companyData, error } = await supabase
        .from('empresas')
        .select('id, name, cnpj')
        .eq('name', companyName)
        .single();

      if (error) {
        console.error('Error fetching company data:', error);
        toast({
          title: "Erro",
          description: "Erro ao buscar dados da empresa",
          variant: "destructive",
        });
        return;
      }

      console.log('Dados da empresa:', companyData);

      // Usar o ID da empresa como código da operadora
      const codOperadora = companyData.id || '';
      
      setFormData(prev => ({ 
        ...prev, 
        nome_empresa: companyName,
        cod_operadora: codOperadora
      }));

    } catch (error) {
      console.error('Error handling company change:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar seleção da empresa",
        variant: "destructive",
      });
    }
  };

  const calculateTotal = () => {
    return formData.simples_com_imagem + 
           formData.simples_sem_imagem + 
           formData.secao + 
           formData.citgis + 
           formData.buszoom + 
           formData.nuvem;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome_empresa || !formData.cod_operadora || !formData.mes_referencia) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const total = calculateTotal();
      
      const fleetData = {
        ...formData,
        total,
        mes_referencia: formData.mes_referencia + '-01', // Converter para formato DATE
        usuario_responsavel: getUserResponsibleName()
      };

      // Verificar se já existe registro para a empresa e mês
      const { data: existing, error: checkError } = await supabase
        .from('frota')
        .select('id')
        .eq('nome_empresa', formData.nome_empresa)
        .eq('mes_referencia', fleetData.mes_referencia);

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
        // Atualizar registro existente
        const { error: updateError } = await supabase
          .from('frota')
          .update(fleetData)
          .eq('id', existing[0].id);

        if (updateError) throw updateError;

        toast({
          title: "Sucesso",
          description: "Dados da frota atualizados com sucesso!",
        });
      } else {
        // Criar novo registro
        const { error: insertError } = await supabase
          .from('frota')
          .insert([fleetData]);

        if (insertError) throw insertError;

        toast({
          title: "Sucesso",
          description: "Dados da frota salvos com sucesso!",
        });
      }

      // Resetar formulário com mês atual
      const mesAtual = getCurrentLocalMonth();
      setFormData({
        nome_empresa: '',
        cod_operadora: '',
        mes_referencia: mesAtual,
        simples_com_imagem: 0,
        simples_sem_imagem: 0,
        secao: 0,
        citgis: 0,
        buszoom: 0,
        nuvem: 0
      });

    } catch (error) {
      console.error('Error saving fleet data:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar dados da frota",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Cadastro de Frota
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Frota</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FleetFormFields
              companies={companies}
              formData={formData}
              userResponsibleName={getUserResponsibleName()}
              onCompanyChange={handleCompanyChange}
              onInputChange={handleInputChange}
            />

            <FleetFormSummary total={calculateTotal()} />

            <FleetFormActions loading={loading} />
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetForm;
