
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Search, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  modelo?: string;
  empresas?: {
    name: string;
    estado?: string;
  };
  status?: string;
}

interface Company {
  id: string;
  name: string;
  estado?: string;
}

interface MaintenanceType {
  id: string;
  codigo: string;
  descricao: string;
}

interface EquipmentMovementProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const EquipmentMovement: React.FC<EquipmentMovementProps> = ({ onCancel, onSuccess }) => {
  const { user } = useAuth();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [formData, setFormData] = useState({
    numero_serie: '',
    selectedEquipments: [] as string[],
    tipo_equipamento: '',
    modelo: '',
    id_empresa: '',
    estado: '',
    status: 'disponivel',
    data_entrada: new Date().toISOString().split('T')[0],
    data_saida: '',
    fora_estoque: false,
    tipo_movimento: '',
    observacoes: '',
    tipo_manutencao_id: '',
    detalhes_manutencao: ''
  });
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [showEquipmentList, setShowEquipmentList] = useState(false);
  const [multipleEquipments, setMultipleEquipments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.numero_serie.length > 0) {
      const filtered = equipments.filter(eq => 
        eq.numero_serie.toLowerCase().includes(formData.numero_serie.toLowerCase())
      );
      setFilteredEquipments(filtered);
      setShowEquipmentList(filtered.length > 0 && multipleEquipments);
    } else {
      setFilteredEquipments([]);
      setShowEquipmentList(false);
    }
  }, [formData.numero_serie, equipments, multipleEquipments]);

  useEffect(() => {
    if (formData.id_empresa) {
      const company = companies.find(c => c.id === formData.id_empresa);
      if (company) {
        setFormData(prev => ({ 
          ...prev, 
          estado: company.estado || '',
          status: company.name.toLowerCase().includes('tacom') ? 'disponivel' : 'em_uso'
        }));
      }
    }
  }, [formData.id_empresa, companies]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      
      // Carregar equipamentos
      const { data: equipmentsData, error: equipmentsError } = await supabase
        .from('equipamentos')
        .select(`
          id,
          numero_serie,
          tipo,
          modelo,
          status,
          empresas (
            name,
            estado
          )
        `)
        .order('numero_serie');

      if (equipmentsError) throw equipmentsError;
      setEquipments(equipmentsData || []);

      // Carregar empresas
      const { data: companiesData, error: companiesError } = await supabase
        .from('empresas')
        .select('*')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Carregar tipos de manutenção
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('tipos_manutencao')
        .select('*')
        .eq('ativo', true)
        .order('codigo');

      if (maintenanceError) throw maintenanceError;
      setMaintenanceTypes(maintenanceData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleEquipmentToggle = (equipmentId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedEquipments: checked 
        ? [...prev.selectedEquipments, equipmentId]
        : prev.selectedEquipments.filter(id => id !== equipmentId)
    }));
  };

  const handleEquipmentSelect = (equipment: Equipment) => {
    setFormData(prev => ({
      ...prev,
      numero_serie: equipment.numero_serie,
      tipo_equipamento: equipment.tipo,
      modelo: equipment.modelo || ''
    }));
    setShowEquipmentList(false);
  };

  const handleApplyMovement = async () => {
    if (!formData.tipo_movimento) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o tipo de movimento.",
        variant: "destructive",
      });
      return;
    }

    if (multipleEquipments && formData.selectedEquipments.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione pelo menos um equipamento.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const equipmentIds = multipleEquipments 
        ? formData.selectedEquipments 
        : [filteredEquipments.find(eq => eq.numero_serie === formData.numero_serie)?.id].filter(Boolean);

      if (equipmentIds.length === 0) {
        throw new Error('Nenhum equipamento encontrado para movimentação');
      }

      // Registrar movimentações
      const movimentacoes = equipmentIds.map(equipmentId => ({
        id_equipamento: equipmentId,
        tipo_movimento: formData.tipo_movimento,
        data_movimento: new Date().toISOString().split('T')[0],
        observacoes: formData.observacoes || null,
        usuario_responsavel: `${user?.name} ${user?.surname}`,
        tipo_manutencao_id: formData.tipo_manutencao_id || null,
        detalhes_manutencao: formData.detalhes_manutencao || null
      }));

      const { error: movementError } = await supabase
        .from('movimentacoes')
        .insert(movimentacoes);

      if (movementError) throw movementError;

      toast({
        title: "Sucesso",
        description: `Movimentação registrada para ${equipmentIds.length} equipamento(s)!`,
      });

      onSuccess();
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar movimentação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numero_serie || !formData.tipo_equipamento || !formData.id_empresa) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const equipmentData = {
        numero_serie: formData.numero_serie,
        tipo: formData.tipo_equipamento,
        modelo: formData.modelo || null,
        id_empresa: formData.id_empresa,
        estado: formData.estado,
        status: formData.status,
        data_entrada: formData.data_entrada,
        data_saida: formData.fora_estoque ? formData.data_saida : null
      };

      const { error: equipmentError } = await supabase
        .from('equipamentos')
        .insert([equipmentData]);

      if (equipmentError) throw equipmentError;

      toast({
        title: "Sucesso",
        description: "Equipamento registrado com sucesso!",
      });

      onSuccess();
    } catch (error) {
      console.error('Erro ao registrar equipamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar equipamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Movimentação de Equipamento</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Ativação de múltiplos equipamentos */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="multipleEquipments"
                checked={multipleEquipments}
                onCheckedChange={(checked) => setMultipleEquipments(checked === true)}
              />
              <Label htmlFor="multipleEquipments">Ativar busca para múltiplos equipamentos</Label>
            </div>

            {/* Número de Série */}
            <div className="space-y-2">
              <Label htmlFor="numero_serie">Número de Série *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="numero_serie"
                  placeholder="Ex: ABC123456"
                  value={formData.numero_serie}
                  onChange={(e) => handleChange('numero_serie', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Lista de equipamentos para seleção */}
            {showEquipmentList && multipleEquipments && (
              <Card className="max-h-60 overflow-y-auto">
                <CardContent className="p-4">
                  <Label className="text-sm font-medium mb-3 block">
                    Selecione os equipamentos:
                  </Label>
                  <div className="space-y-2">
                    {filteredEquipments.map(equipment => (
                      <div key={equipment.id} className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50">
                        <Checkbox
                          id={equipment.id}
                          checked={formData.selectedEquipments.includes(equipment.id)}
                          onCheckedChange={(checked) => handleEquipmentToggle(equipment.id, checked === true)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{equipment.numero_serie}</p>
                          <p className="text-sm text-gray-600">{equipment.tipo} - {equipment.modelo}</p>
                          <p className="text-xs text-gray-500">{equipment.empresas?.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tipo de Equipamento */}
              <div className="space-y-2">
                <Label htmlFor="tipo_equipamento">Tipo de Equipamento *</Label>
                <Select value={formData.tipo_equipamento || ''} onValueChange={(value) => handleChange('tipo_equipamento', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CCIT 5.0">CCIT 5.0</SelectItem>
                    <SelectItem value="CONNECTIONS">CONNECTIONS</SelectItem>
                    <SelectItem value="Terminal">Terminal</SelectItem>
                    <SelectItem value="Validador">Validador</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Modelo */}
              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  placeholder="Ex: H2, DMX200, V2000..."
                  value={formData.modelo}
                  onChange={(e) => handleChange('modelo', e.target.value)}
                />
              </div>

              {/* Empresa */}
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa *</Label>
                <Select value={formData.id_empresa || ''} onValueChange={(value) => handleChange('id_empresa', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label htmlFor="estado">Estado do Estoque</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => handleChange('estado', e.target.value)}
                  placeholder="Preenchido automaticamente"
                  disabled
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status || ''} onValueChange={(value) => handleChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="em_uso">Em Uso</SelectItem>
                    <SelectItem value="aguardando_manutencao">Aguardando Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data de Entrada */}
              <div className="space-y-2">
                <Label htmlFor="data_entrada">Data de Entrada *</Label>
                <Input
                  id="data_entrada"
                  type="date"
                  value={formData.data_entrada}
                  onChange={(e) => handleChange('data_entrada', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Fora de Estoque */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="fora_estoque"
                checked={formData.fora_estoque}
                onCheckedChange={(checked) => handleChange('fora_estoque', checked === true)}
              />
              <Label htmlFor="fora_estoque">Fora de Estoque</Label>
            </div>

            {/* Data de Saída - só aparece se "Fora de Estoque" estiver marcado */}
            {formData.fora_estoque && (
              <div className="space-y-2">
                <Label htmlFor="data_saida">Data de Saída *</Label>
                <Input
                  id="data_saida"
                  type="date"
                  value={formData.data_saida}
                  onChange={(e) => handleChange('data_saida', e.target.value)}
                  required
                />
              </div>
            )}

            {/* Tipo de Movimento */}
            <div className="space-y-2">
              <Label htmlFor="tipo_movimento">Tipo de Movimento</Label>
              <Select value={formData.tipo_movimento || ''} onValueChange={(value) => handleChange('tipo_movimento', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="retorno_manutencao">Retorno Manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campo de Observação - aparece quando seleciona tipo de movimento */}
            {formData.tipo_movimento && (
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Digite as observações sobre a movimentação..."
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Equipamento'}
              </Button>
              
              {/* Botão para aplicar movimentação */}
              {formData.tipo_movimento && (multipleEquipments ? formData.selectedEquipments.length > 0 : formData.numero_serie) && (
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={handleApplyMovement}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {loading ? 'Aplicando...' : 'Aplicar Movimentação'}
                </Button>
              )}
              
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

export default EquipmentMovement;
