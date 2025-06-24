import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getCurrentLocalMonth } from '@/utils/dateUtils';
import { useAuth } from '@/hooks/useAuth';

interface Company {
  id: string;
  name: string;
  cod_operadora?: string;
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
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar operadoras",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof FleetData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCompanyChange = async (companyName: string) => {
    try {
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

      // Usar o ID da empresa como código da operadora (ou CNPJ se preferir)
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
        usuario_responsavel: user?.name && user?.surname ? `${user.name} ${user.surname}` : user?.username || 'N/A'
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="empresa">Operadora *</Label>
                <Select 
                  value={formData.nome_empresa} 
                  onValueChange={handleCompanyChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma operadora" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.name}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cod_operadora">Código da Operadora *</Label>
                <Input
                  id="cod_operadora"
                  placeholder="Código automático"
                  value={formData.cod_operadora}
                  readOnly
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mes_referencia">Mês de Referência *</Label>
                <Input
                  id="mes_referencia"
                  type="month"
                  value={formData.mes_referencia}
                  onChange={(e) => handleInputChange('mes_referencia', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="simples_com_imagem">Simples C/Imagem</Label>
                <Input
                  id="simples_com_imagem"
                  type="number"
                  min="0"
                  value={formData.simples_com_imagem}
                  onChange={(e) => handleInputChange('simples_com_imagem', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="simples_sem_imagem">Simples S/Imagem</Label>
                <Input
                  id="simples_sem_imagem"
                  type="number"
                  min="0"
                  value={formData.simples_sem_imagem}
                  onChange={(e) => handleInputChange('simples_sem_imagem', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secao">Seção</Label>
                <Input
                  id="secao"
                  type="number"
                  min="0"
                  value={formData.secao}
                  onChange={(e) => handleInputChange('secao', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="citgis">CITGIS</Label>
                <Input
                  id="citgis"
                  type="number"
                  min="0"
                  value={formData.citgis}
                  onChange={(e) => handleInputChange('citgis', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buszoom">BUSZOOM</Label>
                <Input
                  id="buszoom"
                  type="number"
                  min="0"
                  value={formData.buszoom}
                  onChange={(e) => handleInputChange('buszoom', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nuvem">Telemetria</Label>
                <Input
                  id="nuvem"
                  type="number"
                  min="0"
                  value={formData.nuvem}
                  onChange={(e) => handleInputChange('nuvem', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usuario_responsavel">Usuário Responsável</Label>
              <Input
                id="usuario_responsavel"
                value={user?.name && user?.surname ? `${user.name} ${user.surname}` : user?.username || 'N/A'}
                readOnly
                className="bg-gray-100"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded">
              <div className="text-lg font-semibold text-blue-800">
                Total da Frota: {calculateTotal()}
              </div>
              <div className="text-sm text-blue-600 mt-1">
                Soma automática de todos os tipos de sistema
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90 flex items-center gap-2" 
                disabled={loading}
              >
                {loading ? (
                  'Salvando...'
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Frota
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetForm;
