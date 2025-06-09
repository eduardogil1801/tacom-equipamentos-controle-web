
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, X, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  status: string;
  empresas?: {
    name: string;
  };
}

interface MaintenanceType {
  id: string;
  codigo: string;
  descricao: string;
}

interface User {
  id: string;
  nome: string;
  username: string;
}

interface Company {
  id: string;
  name: string;
}

interface MovementData {
  tipo_movimento: string;
  data_movimento: string;
  observacoes: string;
  detalhes_manutencao: string;
  tipo_manutencao_id: string;
  fora_estoque: boolean;
  data_saida: string;
  empresa_id: string;
  selectedEquipments: string[];
  equipmentId: string;
  numero_serie: string;
}

interface EquipmentMovementProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const EquipmentMovement: React.FC<EquipmentMovementProps> = ({ onCancel, onSuccess }) => {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showEquipmentList, setShowEquipmentList] = useState(false);
  const [multipleSelection, setMultipleSelection] = useState(false);
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [responsibleUserSearch, setResponsibleUserSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showUserList, setShowUserList] = useState(false);

  const [formData, setFormData] = useState<MovementData>({
    tipo_movimento: '',
    data_movimento: new Date().toISOString().split('T')[0],
    observacoes: '',
    detalhes_manutencao: '',
    tipo_manutencao_id: '',
    fora_estoque: false,
    data_saida: '',
    empresa_id: '',
    selectedEquipments: [],
    equipmentId: '',
    numero_serie: ''
  });

  useEffect(() => {
    loadData();
    // Definir automaticamente o usuário logado como responsável
    if (user) {
      setResponsibleUserSearch(user.name || user.username || '');
    }
  }, [user]);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      const filtered = equipment.filter(eq => 
        eq.numero_serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.tipo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEquipment(filtered);
      setShowEquipmentList(true);
    } else {
      setFilteredEquipment([]);
      setShowEquipmentList(false);
    }
  }, [searchTerm, equipment]);

  useEffect(() => {
    if (responsibleUserSearch) {
      const filtered = users.filter(user => 
        user.nome.toLowerCase().includes(responsibleUserSearch.toLowerCase()) ||
        user.username.toLowerCase().includes(responsibleUserSearch.toLowerCase())
      );
      setFilteredUsers(filtered);
      setShowUserList(true);
    } else {
      setFilteredUsers([]);
      setShowUserList(false);
    }
  }, [responsibleUserSearch, users]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      
      // Carregar equipamentos
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name
          )
        `)
        .order('numero_serie');

      if (equipmentError) throw equipmentError;
      setEquipment(equipmentData || []);

      // Carregar tipos de manutenção
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('tipos_manutencao')
        .select('*')
        .eq('ativo', true)
        .order('descricao');

      if (maintenanceError) throw maintenanceError;
      setMaintenanceTypes(maintenanceData || []);

      // Carregar usuários
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id, nome, username')
        .eq('ativo', true)
        .order('nome');

      if (userError) throw userError;
      setUsers(userData || []);

      // Carregar empresas
      const { data: companyData, error: companyError } = await supabase
        .from('empresas')
        .select('id, name')
        .order('name');

      if (companyError) throw companyError;
      setCompanies(companyData || []);

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

  const handleEquipmentSelect = useCallback((equipment: Equipment) => {
    if (multipleSelection) {
      const isSelected = selectedEquipments.some(eq => eq.id === equipment.id);
      if (isSelected) {
        setSelectedEquipments(prev => prev.filter(eq => eq.id !== equipment.id));
      } else {
        setSelectedEquipments(prev => [...prev, equipment]);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        equipmentId: equipment.id,
        numero_serie: equipment.numero_serie
      }));
      setSearchTerm(equipment.numero_serie);
      setShowEquipmentList(false);
    }
  }, [multipleSelection, selectedEquipments]);

  const removeSelectedEquipment = (equipmentId: string) => {
    setSelectedEquipments(prev => prev.filter(eq => eq.id !== equipmentId));
  };

  const addSelectedEquipments = () => {
    if (selectedEquipments.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos um equipamento",
        variant: "destructive",
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      selectedEquipments: selectedEquipments.map(eq => eq.id)
    }));
    
    setShowEquipmentList(false);
    
    toast({
      title: "Sucesso",
      description: `${selectedEquipments.length} equipamento(s) adicionado(s)`,
    });
  };

  const handleApplyMovement = async () => {
    if (!formData.tipo_movimento) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de movimentação",
        variant: "destructive",
      });
      return;
    }

    const equipmentsToMove = multipleSelection && formData.selectedEquipments.length > 0 
      ? formData.selectedEquipments 
      : formData.equipmentId ? [formData.equipmentId] : [];

    if (equipmentsToMove.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um equipamento",
        variant: "destructive",
      });
      return;
    }

    // Validar campos obrigatórios para "Fora de Estoque"
    if (formData.fora_estoque && formData.tipo_movimento === 'saida') {
      if (!formData.data_saida) {
        toast({
          title: "Erro",
          description: "Data de saída é obrigatória quando 'Fora de Estoque' está selecionado",
          variant: "destructive",
        });
        return;
      }
      if (!formData.empresa_id) {
        toast({
          title: "Erro",
          description: "Empresa é obrigatória quando 'Fora de Estoque' está selecionado",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      const movements = equipmentsToMove.map(equipmentId => ({
        id_equipamento: equipmentId,
        tipo_movimento: formData.tipo_movimento,
        data_movimento: formData.data_movimento,
        observacoes: formData.observacoes,
        detalhes_manutencao: formData.detalhes_manutencao || null,
        tipo_manutencao_id: formData.tipo_manutencao_id || null,
        usuario_responsavel: responsibleUserSearch || user?.name || user?.username
      }));

      const { error: movementError } = await supabase
        .from('movimentacoes')
        .insert(movements);

      if (movementError) throw movementError;

      // Atualizar status dos equipamentos se necessário
      if (formData.tipo_movimento === 'saida') {
        const updateData: any = { 
          status: formData.fora_estoque ? 'fora_estoque' : 'em_uso',
          data_saida: formData.fora_estoque ? formData.data_saida : formData.data_movimento
        };

        if (formData.fora_estoque && formData.empresa_id) {
          updateData.id_empresa = formData.empresa_id;
        }

        const { error: updateError } = await supabase
          .from('equipamentos')
          .update(updateData)
          .in('id', equipmentsToMove);

        if (updateError) throw updateError;
      } else if (formData.tipo_movimento === 'entrada') {
        const { error: updateError } = await supabase
          .from('equipamentos')
          .update({ 
            status: 'disponivel',
            data_saida: null
          })
          .in('id', equipmentsToMove);

        if (updateError) throw updateError;
      }

      toast({
        title: "Sucesso",
        description: `Movimentação registrada para ${equipmentsToMove.length} equipamento(s)!`,
      });

      // Reset form
      setFormData({
        tipo_movimento: '',
        data_movimento: new Date().toISOString().split('T')[0],
        observacoes: '',
        detalhes_manutencao: '',
        tipo_manutencao_id: '',
        fora_estoque: false,
        data_saida: '',
        empresa_id: '',
        selectedEquipments: [],
        equipmentId: '',
        numero_serie: ''
      });
      setSearchTerm('');
      setSelectedEquipments([]);
      if (user) {
        setResponsibleUserSearch(user.name || user.username || '');
      }
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao registrar movimentação:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar movimentação",
        variant: "destructive",
      });
    }
  };

  const handleChange = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleMultipleSelectionChange = useCallback((checked: boolean) => {
    setMultipleSelection(checked);
    if (!checked) {
      setSelectedEquipments([]);
      setFormData(prev => ({ ...prev, selectedEquipments: [] }));
    }
  }, []);

  const handleForaEstoqueChange = useCallback((checked: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      fora_estoque: checked,
      data_saida: checked ? new Date().toISOString().split('T')[0] : '',
      empresa_id: checked ? '' : ''
    }));
  }, []);

  const handleUserSelect = (user: User) => {
    setResponsibleUserSearch(user.nome);
    setShowUserList(false);
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
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Movimentação de Equipamentos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Movimentação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="multipleSelection"
              checked={multipleSelection}
              onCheckedChange={handleMultipleSelectionChange}
            />
            <Label htmlFor="multipleSelection">Ativar seleção múltipla de equipamentos</Label>
          </div>

          <div className="relative">
            <Label htmlFor="numero_serie">Número de Série</Label>
            <div className="relative">
              <Input
                id="numero_serie"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite pelo menos 3 caracteres para buscar..."
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            {showEquipmentList && filteredEquipment.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {multipleSelection && (
                  <div className="p-2 border-b bg-gray-50">
                    <Button 
                      onClick={addSelectedEquipments}
                      size="sm"
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Selecionados ({selectedEquipments.length})
                    </Button>
                  </div>
                )}
                {filteredEquipment.map(equipment => (
                  <div 
                    key={equipment.id} 
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b flex items-center gap-3"
                    onClick={() => handleEquipmentSelect(equipment)}
                  >
                    {multipleSelection && (
                      <Checkbox
                        checked={selectedEquipments.some(eq => eq.id === equipment.id)}
                        onCheckedChange={() => handleEquipmentSelect(equipment)}
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{equipment.numero_serie}</div>
                      <div className="text-sm text-gray-500">
                        {equipment.tipo} - {equipment.status}
                      </div>
                      <div className="text-xs text-gray-400">
                        {equipment.empresas?.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {multipleSelection && selectedEquipments.length > 0 && (
            <div className="space-y-2">
              <Label>Equipamentos Selecionados:</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedEquipments.map(equipment => (
                  <div key={equipment.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm">{equipment.numero_serie} - {equipment.tipo}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSelectedEquipment(equipment.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo_movimento">Tipo de Movimentação *</Label>
              <Select 
                value={formData.tipo_movimento} 
                onValueChange={(value) => handleChange('tipo_movimento', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="data_movimento">Data da Movimentação *</Label>
              <Input
                id="data_movimento"
                type="date"
                value={formData.data_movimento}
                onChange={(e) => handleChange('data_movimento', e.target.value)}
                required
              />
            </div>
          </div>

          {formData.tipo_movimento === 'manutencao' && (
            <div>
              <Label htmlFor="tipo_manutencao_id">Tipo de Manutenção</Label>
              <Select 
                value={formData.tipo_manutencao_id} 
                onValueChange={(value) => handleChange('tipo_manutencao_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de manutenção" />
                </SelectTrigger>
                <SelectContent>
                  {maintenanceTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.codigo} - {type.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="relative">
            <Label htmlFor="usuario_responsavel">Usuário Responsável</Label>
            <div className="relative">
              <Input
                id="usuario_responsavel"
                value={responsibleUserSearch}
                onChange={(e) => setResponsibleUserSearch(e.target.value)}
                placeholder="Digite para buscar usuário..."
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            {showUserList && filteredUsers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                {filteredUsers.map(user => (
                  <div 
                    key={user.id} 
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="font-medium">{user.nome}</div>
                    <div className="text-sm text-gray-500">@{user.username}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {formData.tipo_movimento === 'saida' && (
            <>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="fora_estoque"
                  checked={formData.fora_estoque}
                  onCheckedChange={handleForaEstoqueChange}
                />
                <Label htmlFor="fora_estoque">Fora de Estoque</Label>
              </div>

              {formData.fora_estoque && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="data_saida">Data de Saída *</Label>
                    <Input
                      id="data_saida"
                      type="date"
                      value={formData.data_saida}
                      onChange={(e) => handleChange('data_saida', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="empresa_id">Empresa (Operadora) *</Label>
                    <Select 
                      value={formData.empresa_id} 
                      onValueChange={(value) => handleChange('empresa_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a empresa" />
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
                </div>
              )}
            </>
          )}

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
              placeholder="Observações sobre a movimentação"
              rows={3}
            />
          </div>

          {formData.tipo_movimento === 'manutencao' && (
            <div>
              <Label htmlFor="detalhes_manutencao">Detalhes da Manutenção</Label>
              <Textarea
                id="detalhes_manutencao"
                value={formData.detalhes_manutencao}
                onChange={(e) => handleChange('detalhes_manutencao', e.target.value)}
                placeholder="Detalhes específicos da manutenção"
                rows={3}
              />
            </div>
          )}

          <Button onClick={handleApplyMovement} className="w-full">
            Registrar Movimentação
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentMovement;
