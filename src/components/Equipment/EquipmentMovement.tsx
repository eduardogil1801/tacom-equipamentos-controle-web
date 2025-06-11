
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
      if (user) {
        setResponsibleUser(`${user.name || ''} ${user.surname || ''}`.trim());
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadEquipments = async () => {
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name
          )
        `)
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
        .sort((a, b) => {
          const aNum = parseInt(a.codigo);
          const bNum = parseInt(b.codigo);
          return aNum - bNum;
        });
      
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
  };

  const handleEquipmentSelect = (equipment: Equipment, checked: boolean) => {
    if (checked) {
      if (!selectedEquipments.find(item => item.id === equipment.id)) {
        setSelectedEquipments(prev => [...prev, equipment]);
      }
    } else {
      setSelectedEquipments(prev => prev.filter(item => item.id !== equipment.id));
    }
  };

  const handleSelectEquipments = () => {
    if (selectedEquipments.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos um equipamento",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Equipamentos selecionados",
      description: `${selectedEquipments.length} equipamento(s) selecionado(s) para movimentação`,
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
      console.log('Registrando movimentação em lote para:', selectedEquipments.length, 'equipamentos');

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

        console.log('Dados da movimentação:', movementData);

        const { data, error } = await supabase
          .from('movimentacoes')
          .insert([movementData])
          .select();

        if (error) {
          console.error('Erro ao inserir movimentação:', error);
          throw error;
        }

        console.log('Movimentação registrada:', data);

        if (movementType === 'manutencao') {
          const { error: updateError } = await supabase
            .from('equipamentos')
            .update({ 
              em_manutencao: true,
              status: 'aguardando_manutencao'
            })
            .eq('id', equipment.id);

          if (updateError) {
            console.error('Erro ao atualizar status do equipamento:', updateError);
            throw updateError;
          }
        } else if (movementType === 'saida') {
          const { error: updateError } = await supabase
            .from('equipamentos')
            .update({ 
              data_saida: movementDate,
              status: 'em_uso',
              id_empresa: targetCompany
            })
            .eq('id', equipment.id);

          if (updateError) {
            console.error('Erro ao atualizar data de saída:', updateError);
            throw updateError;
          }
        }
      }

      toast({
        title: "Sucesso",
        description: `Movimentação registrada com sucesso para ${selectedEquipments.length} equipamento(s)!`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error registering movement:', error);
      toast({
        title: "Erro",
        description: `Erro ao registrar movimentação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Movimentação de Equipamentos</h1>
      </div>

      {/* Card para Busca e Seleção de Equipamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Buscar e Selecionar Equipamentos
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSelectionExpanded(!isSelectionExpanded)}
              className="flex items-center gap-2"
            >
              {isSelectionExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Recolher Seleção
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Expandir Seleção
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        {isSelectionExpanded && (
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="multipleSelection"
                checked={enableMultipleSelection}
                onCheckedChange={handleMultipleSelectionChange}
              />
              <Label htmlFor="multipleSelection">Ativar seleção múltipla de equipamentos</Label>
            </div>

            <div>
              <Label htmlFor="serialNumber">Número de Série *</Label>
              <Input
                id="serialNumber"
                placeholder="Digite o número de série..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {searchTerm && filteredEquipments.length > 0 && (
              <div className="border rounded-md p-4 max-h-64 overflow-y-auto bg-gray-50">
                <div className="space-y-2">
                  {filteredEquipments.map(equipment => (
                    <div key={equipment.id} className="flex items-center space-x-3 p-2 bg-white rounded border">
                      <Checkbox
                        checked={selectedEquipments.some(item => item.id === equipment.id)}
                        onCheckedChange={(checked) => {
                          if (enableMultipleSelection) {
                            handleEquipmentSelect(equipment, checked === true);
                          } else {
                            if (checked) {
                              setSelectedEquipments([equipment]);
                            } else {
                              setSelectedEquipments([]);
                            }
                          }
                        }}
                      />
                      <div className="flex-1">
                        <div className="font-semibold">{equipment.numero_serie}</div>
                        <div className="text-sm text-gray-600">
                          {equipment.tipo} - {equipment.empresas?.name || 'Sem empresa'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {enableMultipleSelection && (
                  <Button 
                    onClick={handleSelectEquipments}
                    className="w-full mt-3"
                    variant="outline"
                  >
                    Selecionar Equipamentos ({selectedEquipments.length})
                  </Button>
                )}
              </div>
            )}

            {selectedEquipments.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <h4 className="font-medium mb-2">Equipamentos Selecionados ({selectedEquipments.length}):</h4>
                <div className="space-y-1">
                  {selectedEquipments.map(equipment => (
                    <div key={equipment.id} className="flex items-center justify-between text-sm">
                      <span>{equipment.numero_serie} - {equipment.tipo}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedEquipments(prev => prev.filter(item => item.id !== equipment.id))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Card para Formulário de Movimentação */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Movimentação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="movementType">Tipo de Movimentação *</Label>
                <Select value={movementType} onValueChange={setMovementType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="movementDate">Data da Movimentação *</Label>
                <Input
                  id="movementDate"
                  type="date"
                  value={movementDate}
                  onChange={(e) => setMovementDate(e.target.value)}
                />
              </div>
            </div>

            {movementType === 'saida' && (
              <div>
                <Label htmlFor="targetCompany">Empresa de Destino *</Label>
                <Select value={targetCompany} onValueChange={setTargetCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa de destino" />
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
            )}

            {movementType === 'manutencao' && (
              <div>
                <Label htmlFor="maintenanceType">Tipo de Manutenção *</Label>
                <Select value={maintenanceType} onValueChange={setMaintenanceType}>
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

            <div>
              <Label htmlFor="responsibleUser">Usuário Responsável</Label>
              <Input
                id="responsibleUser"
                value={responsibleUser}
                onChange={(e) => setResponsibleUser(e.target.value)}
                placeholder="Nome do usuário responsável"
              />
            </div>

            <div>
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Observações sobre a movimentação"
                rows={3}
              />
            </div>

            {movementType === 'manutencao' && (
              <div>
                <Label htmlFor="maintenanceDetails">Detalhes da Manutenção</Label>
                <Textarea
                  id="maintenanceDetails"
                  value={maintenanceDetails}
                  onChange={(e) => setMaintenanceDetails(e.target.value)}
                  placeholder="Detalhes específicos da manutenção"
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={loading || selectedEquipments.length === 0}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Registrando...' : 'Registrar Movimentação'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
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
