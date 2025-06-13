
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, AlertTriangle, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Equipment {
  id: string;
  tipo: string;
  modelo?: string;
  numero_serie: string;
  data_entrada: string;
  data_saida?: string;
  id_empresa: string;
  estado?: string;
  status?: string;
}

interface Company {
  id: string;
  name: string;
}

interface EquipmentType {
  id: string;
  nome: string;
  ativo: boolean;
}

interface EquipmentFormProps {
  equipment?: Equipment | null;
  companies: Company[];
  onSave: () => void;
  onCancel: () => void;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({
  equipment,
  companies: initialCompanies,
  onSave,
  onCancel
}) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [formData, setFormData] = useState({
    numero_serie: '',
    tipo: '',
    modelo: '',
    id_empresa: '',
    data_entrada: '',
    status: ''
  });
  const [loading, setLoading] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);

  const statusOptions = [
    { value: 'disponivel', label: 'Disponível' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'em_uso', label: 'Em Uso' },
    { value: 'aguardando_manutencao', label: 'Aguardando Manutenção' },
    { value: 'danificado', label: 'Danificado' }
  ];

  const isOperational = user?.userType === 'operacional';

  // Função CORRIGIDA para obter a data atual no fuso horário brasileiro
  const getCurrentDate = () => {
    // Criar data com fuso horário brasileiro
    const now = new Date();
    const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    
    const year = brazilTime.getFullYear();
    const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
    const day = String(brazilTime.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    console.log('Data atual Brasil:', dateString, 'Hora completa Brasil:', brazilTime.toString());
    return dateString;
  };

  const loadCompanies = useCallback(async () => {
    try {
      console.log('Carregando empresas no formulário...');
      setCompaniesLoading(true);
      
      const { data, error } = await supabase
        .from('empresas')
        .select('id, name')
        .order('name');

      if (error) throw error;
      
      console.log('Empresas carregadas no formulário:', data?.length || 0);
      setCompanies(data || []);
      
    } catch (error) {
      console.error('Erro ao carregar empresas no formulário:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar empresas",
        variant: "destructive",
      });
    } finally {
      setCompaniesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!companies || companies.length === 0) {
      loadCompanies();
    }
  }, [companies, loadCompanies]);

  useEffect(() => {
    fetchEquipmentTypes();
  }, []);

  const fetchEquipmentTypes = async () => {
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
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de equipamento",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (equipment) {
      setFormData({
        numero_serie: equipment.numero_serie,
        tipo: equipment.tipo,
        modelo: equipment.modelo || '',
        id_empresa: equipment.id_empresa,
        data_entrada: equipment.data_entrada,
        status: equipment.status || 'disponivel'
      });
    } else {
      // Para novos equipamentos, definir data atual do Brasil
      const todayDate = getCurrentDate();
      console.log('Definindo data atual brasileira para novo equipamento:', todayDate);
      setFormData(prev => ({ 
        ...prev, 
        data_entrada: todayDate,
        status: 'disponivel'
      }));
    }
  }, [equipment]);

  // Verificar equipamentos duplicados
  useEffect(() => {
    if (formData.numero_serie) {
      checkForDuplicateSerial(formData.numero_serie);
    }
  }, [formData.numero_serie]);

  const checkForDuplicateSerial = async (numeroSerie: string) => {
    if (!numeroSerie) {
      setDuplicateAlert(null);
      return;
    }

    try {
      const { data: existingEquipments, error } = await supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name
          )
        `)
        .eq('numero_serie', numeroSerie);

      if (error) throw error;

      if (existingEquipments && existingEquipments.length > 0) {
        // Se estamos editando, ignorar o próprio equipamento
        const filtered = existingEquipments.filter(eq => eq.id !== equipment?.id);
        
        if (filtered.length > 0) {
          const companiesWithEquipment = filtered.map(eq => eq.empresas?.name).join(', ');
          setDuplicateAlert(`Este equipamento está cadastrado para: ${companiesWithEquipment}`);
        } else {
          setDuplicateAlert(null);
        }
      } else {
        setDuplicateAlert(null);
      }
    } catch (error) {
      console.error('Error checking duplicate serial:', error);
    }
  };

  const getStatusByCompany = (companyId: string): string => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return 'disponivel';

    const companyName = company.name.toLowerCase();
    
    if (companyName.includes('tacom sistemas poa') || companyName.includes('tacom projetos sc')) {
      return 'disponivel';
    } else if (companyName.includes('tacom projetos ctg')) {
      return 'manutencao';
    } else {
      return 'em_uso';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numero_serie || !formData.tipo || !formData.data_entrada || !formData.id_empresa) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Buscar dados da empresa para auto-preencher estado
      const { data: companyData, error: companyError } = await supabase
        .from('empresas')
        .select('name, estado')
        .eq('id', formData.id_empresa)
        .single();

      if (companyError) throw companyError;

      let finalStatus = formData.status;
      
      // Se não estamos editando (novo equipamento) ou não é usuário operacional, aplicar regras de status
      if (!equipment || !isOperational) {
        finalStatus = getStatusByCompany(formData.id_empresa);
      }

      const equipmentData = {
        numero_serie: formData.numero_serie,
        tipo: formData.tipo,
        modelo: formData.modelo,
        id_empresa: formData.id_empresa,
        data_entrada: formData.data_entrada,
        estado: companyData?.estado || 'Rio Grande do Sul',
        status: finalStatus
      };

      if (equipment) {
        // Se é usuário operacional, só pode atualizar o status
        if (isOperational) {
          const { error } = await supabase
            .from('equipamentos')
            .update({ status: formData.status })
            .eq('id', equipment.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('equipamentos')
            .update(equipmentData)
            .eq('id', equipment.id);

          if (error) throw error;
        }

        // Registrar movimentação de atualização
        await supabase
          .from('movimentacoes')
          .insert([{
            id_equipamento: equipment.id,
            tipo_movimento: 'entrada',
            data_movimento: formData.data_entrada,
            observacoes: isOperational ? 'Status atualizado por usuário operacional' : 'Equipamento atualizado',
            usuario_responsavel: user?.username || user?.name
          }]);

        toast({
          title: "Sucesso",
          description: "Equipamento atualizado com sucesso!",
        });
      } else {
        const { data: newEquipment, error } = await supabase
          .from('equipamentos')
          .insert([equipmentData])
          .select()
          .single();

        if (error) throw error;

        // Registrar movimentação de entrada automática
        if (newEquipment) {
          await supabase
            .from('movimentacoes')
            .insert([{
              id_equipamento: newEquipment.id,
              tipo_movimento: 'entrada',
              data_movimento: formData.data_entrada,
              observacoes: 'Entrada automática do equipamento',
              usuario_responsavel: user?.username || user?.name
            }]);
        }

        toast({
          title: "Sucesso",
          description: "Equipamento cadastrado com sucesso!",
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving equipment:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar equipamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {equipment ? 'Editar Equipamento' : 'Cadastrar Novo Equipamento'}
        </h1>
      </div>

      {duplicateAlert && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div>
            <h3 className="font-medium text-yellow-800">Equipamento cadastrado em múltiplas empresas</h3>
            <p className="text-yellow-700">{duplicateAlert}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informações do Equipamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primeira coluna */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_serie">Número de Série *</Label>
                  <Input
                    id="numero_serie"
                    placeholder="Ex: ABC123456"
                    value={formData.numero_serie}
                    onChange={(e) => handleChange('numero_serie', e.target.value)}
                    required
                    readOnly={isOperational}
                    className={isOperational ? "bg-gray-100 cursor-not-allowed" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Equipamento *</Label>
                  <Select 
                    value={formData.tipo || ''} 
                    onValueChange={(value) => handleChange('tipo', value)}
                    disabled={isOperational}
                  >
                    <SelectTrigger className={isOperational ? "bg-gray-100 cursor-not-allowed" : ""}>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {equipmentTypes.map(tipo => (
                        <SelectItem key={tipo.id} value={tipo.nome}>
                          {tipo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Empresa *</Label>
                  {companiesLoading ? (
                    <div className="flex items-center gap-2 p-2 text-sm text-gray-500">
                      <AlertCircle className="h-4 w-4 animate-spin" />
                      Carregando empresas...
                    </div>
                  ) : companies.length === 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 text-sm text-yellow-600 bg-yellow-50 rounded">
                        <AlertCircle className="h-4 w-4" />
                        Nenhuma empresa encontrada
                      </div>
                      <Button
                        onClick={loadCompanies}
                        variant="outline"
                        size="sm"
                        className="w-full"
                        type="button"
                      >
                        Carregar Empresas
                      </Button>
                    </div>
                  ) : (
                    <Select 
                      value={formData.id_empresa || ''} 
                      onValueChange={(value) => handleChange('id_empresa', value)}
                      disabled={isOperational}
                    >
                      <SelectTrigger className={isOperational ? "bg-gray-100 cursor-not-allowed" : ""}>
                        <SelectValue placeholder={`Selecione uma empresa (${companies.length} disponíveis)`} />
                      </SelectTrigger>
                      <SelectContent>
                        {companies.map(company => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Campo Status para usuários operacionais */}
                {isOperational && equipment && (
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select 
                      value={formData.status || ''} 
                      onValueChange={(value) => handleChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Segunda coluna */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    placeholder="Ex: H2, DMX200, V2000..."
                    value={formData.modelo}
                    onChange={(e) => handleChange('modelo', e.target.value)}
                    readOnly={isOperational}
                    className={isOperational ? "bg-gray-100 cursor-not-allowed" : ""}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_entrada">Data de Cadastro *</Label>
                  <Input
                    id="data_entrada"
                    type="date"
                    value={formData.data_entrada}
                    onChange={(e) => handleChange('data_entrada', e.target.value)}
                    required
                    readOnly={isOperational}
                    className={isOperational ? "bg-gray-100 cursor-not-allowed" : ""}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? 'Salvando...' : (equipment ? 'Atualizar' : 'Cadastrar')} Equipamento
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentForm;
