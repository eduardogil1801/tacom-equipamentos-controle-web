import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useHybridAuth';
import FleetFormFields from './FleetForm/FleetFormFields';

interface Company {
  id: string;
  name: string;
  cnpj?: string;
  cod_operadora?: string; // Novo campo
}

interface FleetData {
  nome_empresa: string;
  cod_operadora: string;
  mes_referencia: string;
  simples_com_imagem: number;
  simples_sem_imagem: number;
  secao: number;
  telemetria: number;
  citgis: number;
  buszoom: number;
  nuvem: number;
}

interface FleetFormProps {
  editingData?: {
    id: string;
    nome_empresa: string;
    cod_operadora: string;
    mes_referencia: string;
    simples_sem_imagem: number;
    simples_com_imagem: number;
    secao: number;
    nuvem: number;
    telemetria: number;
    citgis: number;
    buszoom: number;
    total: number;
    usuario_responsavel: string;
    created_at: string;
  } | null;
  onSaveSuccess?: () => void;
}

const FleetForm: React.FC<FleetFormProps> = ({ editingData, onSaveSuccess }) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FleetData>({
    nome_empresa: '',
    cod_operadora: '',
    mes_referencia: '', // Deixar em branco inicialmente
    simples_com_imagem: 0,
    simples_sem_imagem: 0,
    secao: 0,
    telemetria: 0,
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
  }, []);

  // Carregar dados para edição quando editingData mudar
  useEffect(() => {
    if (editingData) {
      console.log('Carregando dados para edição:', editingData);
      setEditingId(editingData.id);
      
      // Formatar o mês de referência para o formato do input
      let mesRef = editingData.mes_referencia;
      if (mesRef && mesRef.length === 10) {
        mesRef = mesRef.substring(0, 7); // YYYY-MM-DD -> YYYY-MM
      }
      
      setFormData({
        nome_empresa: editingData.nome_empresa || '',
        cod_operadora: editingData.cod_operadora || '',
        mes_referencia: mesRef || '',
        simples_com_imagem: editingData.simples_com_imagem || 0,
        simples_sem_imagem: editingData.simples_sem_imagem || 0,
        secao: editingData.secao || 0,
        telemetria: editingData.telemetria || 0,
        citgis: editingData.citgis || 0,
        buszoom: editingData.buszoom || 0,
        nuvem: editingData.nuvem || 0
      });
    } else {
      setEditingId(null);
    }
  }, [editingData]);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, name, cnpj, cod_operadora') // Incluir cod_operadora
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
      
      // Se estamos em modo de edição e a empresa é a mesma, não buscar novamente
      if (editingData && editingData.nome_empresa === companyName && formData.cod_operadora) {
        console.log('Modo edição - mantendo dados existentes');
        return;
      }
      
      // Buscar informações da empresa selecionada no banco de dados
      const { data: companyData, error } = await supabase
        .from('empresas')
        .select('id, name, cnpj, cod_operadora')
        .eq('name', companyName)
        .maybeSingle();

      if (error) {
        console.error('Error fetching company data:', error);
        // Não mostrar erro se estamos em modo de edição
        if (!editingData) {
          toast({
            title: "Erro",
            description: "Erro ao buscar dados da empresa",
            variant: "destructive",
          });
        }
        return;
      }

      if (!companyData) {
        console.log('Empresa não encontrada no banco, usando nome diretamente');
        // Se empresa não encontrada, manter os dados atuais (útil para edição)
        if (!editingData) {
          setFormData(prev => ({ 
            ...prev, 
            nome_empresa: companyName
          }));
        }
        return;
      }

      console.log('Dados da empresa:', companyData);

      // Usar o cod_operadora da empresa ao invés do ID
      const codOperadora = companyData.cod_operadora || companyData.id || '';
      
      if (!companyData.cod_operadora) {
        console.warn('Empresa não possui cod_operadora, usando ID como fallback');
        toast({
          title: "Aviso",
          description: "Esta empresa não possui código de operadora cadastrado.",
          variant: "default",
        });
      }
      
      setFormData(prev => ({ 
        ...prev, 
        nome_empresa: companyName,
        cod_operadora: codOperadora
      }));

    } catch (error) {
      console.error('Error handling company change:', error);
      if (!editingData) {
        toast({
          title: "Erro",
          description: "Erro ao processar seleção da empresa",
          variant: "destructive",
        });
      }
    }
  };

  const loadPreviousData = async (companyName: string) => {
    try {
      // Buscar o último registro da empresa para preencher os campos
      const { data, error } = await supabase
        .from('frota')
        .select('*')
        .eq('nome_empresa', companyName)
        .order('mes_referencia', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error loading previous data:', error);
        return;
      }

      if (data && data.length > 0) {
        const lastRecord = data[0];
        console.log('Dados do mês anterior encontrados:', lastRecord);
        
        // Preencher campos com dados do mês anterior (exceto mês de referência)
        setFormData(prev => ({
          ...prev,
          simples_com_imagem: lastRecord.simples_com_imagem || 0,
          simples_sem_imagem: lastRecord.simples_sem_imagem || 0,
          secao: lastRecord.secao || 0,
          telemetria: lastRecord.telemetria || 0,
          citgis: lastRecord.citgis || 0,
          buszoom: lastRecord.buszoom || 0,
          nuvem: (lastRecord.simples_com_imagem || 0) + (lastRecord.simples_sem_imagem || 0) + (lastRecord.secao || 0)
        }));

        toast({
          title: "Dados Carregados",
          description: "Dados do mês anterior foram carregados. Você pode alterar conforme necessário.",
        });
      }
    } catch (error) {
      console.error('Error loading previous data:', error);
    }
  };

  const calculateTotal = () => {
    return formData.simples_com_imagem + 
           formData.simples_sem_imagem + 
           formData.secao + 
           formData.telemetria +
           formData.citgis + 
           formData.buszoom;
  };

  const formatMesReferenciaForDatabase = (mes: string) => {
    console.log('Mês recebido para conversão:', mes);
    
    // Se o mês está no formato YYYY-MM (do input type="month")
    if (mes && mes.includes('-') && mes.length === 7) {
      const result = mes + '-01';
      console.log('Mês convertido para banco:', result);
      return result;
    }
    
    // Se está no formato MM/YYYY, converter para YYYY-MM-01
    if (mes && mes.includes('/')) {
      const [month, year] = mes.split('/');
      const result = `${year}-${month.padStart(2, '0')}-01`;
      console.log('Mês MM/YYYY convertido para banco:', result);
      return result;
    }
    
    console.log('Mês retornado sem conversão:', mes);
    return mes;
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
      
      console.log('=== DEBUG SALVAMENTO ===');
      console.log('Mês original do formData:', formData.mes_referencia);
      
      const mesFormatado = formatMesReferenciaForDatabase(formData.mes_referencia);
      console.log('Mês formatado para banco:', mesFormatado);
      
      const fleetData = {
        ...formData,
        total,
        mes_referencia: mesFormatado,
        usuario_responsavel: getUserResponsibleName()
      };

      console.log('Dados finais para salvar:', fleetData);

      // Verificar se já existe registro para a empresa e mês
      console.log('Verificando registros existentes para:', {
        empresa: formData.nome_empresa,
        mes: fleetData.mes_referencia
      });

      const { data: existing, error: checkError } = await supabase
        .from('frota')
        .select('id, mes_referencia, nome_empresa')
        .eq('nome_empresa', formData.nome_empresa)
        .eq('mes_referencia', fleetData.mes_referencia);

      if (checkError) throw checkError;

      console.log('Registros encontrados:', existing);

      if (existing && existing.length > 0) {
        // Atualizar registro existente
        console.log('Atualizando registro existente:', existing[0]);
        
        // Perguntar ao usuário se quer sobrescrever
        const confirmUpdate = confirm(
          `Já existe um registro para ${formData.nome_empresa} em ${formData.mes_referencia}. Deseja sobrescrever?`
        );
        
        if (!confirmUpdate) {
          setLoading(false);
          return;
        }

        const { error: updateError } = await supabase
          .from('frota')
          .update(fleetData)
          .eq('id', existing[0].id);

        if (updateError) throw updateError;

        toast({
          title: "Sucesso",
          description: `Dados da frota de ${formData.mes_referencia} atualizados com sucesso!`,
        });
      } else {
        // Criar novo registro
        console.log('Criando novo registro para:', fleetData);
        const { error: insertError, data: insertData } = await supabase
          .from('frota')
          .insert([fleetData])
          .select();

        if (insertError) {
          console.error('Erro ao inserir:', insertError);
          throw insertError;
        }

        console.log('Registro criado com sucesso:', insertData);

      toast({
        title: "Sucesso",
        description: `Dados da frota de ${formData.mes_referencia} salvos com sucesso!`,
      });
    }

    // Se tiver callback de sucesso, chamar
    if (onSaveSuccess) {
      onSaveSuccess();
    } else {
      // Resetar formulário apenas se não houver callback
      setFormData({
        nome_empresa: '',
        cod_operadora: '',
        mes_referencia: '',
        simples_com_imagem: 0,
        simples_sem_imagem: 0,
        secao: 0,
        telemetria: 0,
        citgis: 0,
        buszoom: 0,
        nuvem: 0
      });
      setEditingId(null);
    }

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
          <form onSubmit={handleSubmit} className="space-y-6">
            <FleetFormFields
              companies={companies}
              formData={formData}
              userResponsibleName={getUserResponsibleName()}
              onCompanyChange={handleCompanyChange}
              onInputChange={handleInputChange}
              onLoadPreviousData={loadPreviousData}
            />

            {/* Resumo/Total */}
            <div className="border-t pt-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Resumo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Total Bilhetagem (Nuvem):</strong> {formData.nuvem.toLocaleString()}</p>
                    <p><strong>Total Geral:</strong> {calculateTotal().toLocaleString()}</p>
                  </div>
                  <div>
                    <p><strong>Empresa:</strong> {formData.nome_empresa || 'Não selecionada'}</p>
                    <p><strong>Responsável:</strong> {getUserResponsibleName()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    nome_empresa: '',
                    cod_operadora: '',
                    mes_referencia: '',
                    simples_com_imagem: 0,
                    simples_sem_imagem: 0,
                    secao: 0,
                    telemetria: 0,
                    citgis: 0,
                    buszoom: 0,
                    nuvem: 0
                  });
                }}
                disabled={loading}
              >
                Limpar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetForm;