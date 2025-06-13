import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Save, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import EquipmentSearchDialog from './EquipmentSearchDialog';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  modelo?: string;
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

interface EquipmentType {
  id: string;
  nome: string;
  ativo: boolean;
}

const MovementPage: React.FC = () => {
  const { user } = useAuth();
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [movementType, setMovementType] = useState('');
  const [destinationCompany, setDestinationCompany] = useState('');
  // Corrigir problema de data - usar data local atual
  const [movementDate, setMovementDate] = useState(() => {
    const today = new Date();
    const timezoneOffset = today.getTimezoneOffset() * 60000;
    const localDate = new Date(today.getTime() - timezoneOffset);
    return localDate.toISOString().split('T')[0];
  });
  const [observations, setObservations] = useState('');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('');
  const [selectedMaintenanceType, setSelectedMaintenanceType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const movementTypes = [
    { value: 'entrada', label: 'Entrada' },
    { value: 'saida', label: 'Saída' },
    { value: 'transferencia', label: 'Transferência' },
    { value: 'manutencao', label: 'Manutenção' }
  ];

  const statusOptions = [
    { value: 'disponivel', label: 'Disponível' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'em_uso', label: 'Em Uso' },
    { value: 'aguardando_manutencao', label: 'Aguardando Manutenção' },
    { value: 'danificado', label: 'Danificado' },
    { value: 'indisponivel', label: 'Indisponível' }
  ];

  const loadCompanies = useCallback(async () => {
    try {
      console.log('Iniciando carregamento de empresas...');
      setCompaniesLoading(true);
      setCompaniesError(null);
      
      const { data, error } = await supabase
        .from('empresas')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Erro na consulta de empresas:', error);
        throw error;
      }
      
      console.log('Empresas recebidas:', data?.length || 0, 'empresas');
      console.log('Lista de empresas:', data?.map(c => c.name));
      
      if (!data || data.length === 0) {
        setCompaniesError('Nenhuma empresa encontrada no banco de dados');
        setCompanies([]);
        return;
      }
      
      setCompanies(data);
      
      // Verificar empresas específicas
      const catsul = data.find(c => c.name.toLowerCase().includes('catsul'));
      const central = data.find(c => c.name.toLowerCase().includes('central'));
      
      console.log('Empresa CATSUL encontrada:', catsul ? 'SIM' : 'NÃO');
      console.log('Empresa CENTRAL encontrada:', central ? 'SIM' : 'NÃO');
      
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      setCompaniesError(`Erro ao carregar empresas: ${error.message}`);
      setCompanies([]);
      toast({
        title: "Erro",
        description: "Erro ao carregar empresas. Verifique se elas estão cadastradas.",
        variant: "destructive",
      });
    } finally {
      setCompaniesLoading(false);
    }
  }, []);

  const loadMaintenanceTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_manutencao')
        .select('id, codigo, descricao')
        .eq('ativo', true)
        .order('descricao');

      if (error) throw error;
      setMaintenanceTypes(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de manutenção:', error);
    }
  }, []);

  const loadEquipmentTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_equipamento')
        .select('id, nome, ativo')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setEquipmentTypes(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de equipamento:', error);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
    loadMaintenanceTypes();
    loadEquipmentTypes();
  }, [loadCompanies, loadMaintenanceTypes, loadEquipmentTypes]);

  // Auto-definir status quando selecionar tipo de manutenção
  useEffect(() => {
    const maintenanceType = maintenanceTypes.find(mt => mt.id === selectedMaintenanceType);
    if (maintenanceType && maintenanceType.descricao.toLowerCase().includes('tela quebrada')) {
      setSelectedStatus('indisponivel');
    }
  }, [selectedMaintenanceType, maintenanceTypes]);

  const handleEquipmentSelection = (equipments: Equipment[]) => {
    setSelectedEquipments(equipments);
  };

  const handleSaveMovement = async () => {
    if (!movementType || selectedEquipments.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o tipo de movimentação e pelo menos um equipamento.",
        variant: "destructive",
      });
      return;
    }

    // Verificar se é transferência e se tem empresa destino
    if (movementType === 'transferencia' && !destinationCompany) {
      toast({
        title: "Erro",
        description: "Para transferência, é obrigatório selecionar a empresa destino.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('=== SALVANDO MOVIMENTAÇÃO ===');
      console.log('Tipo:', movementType);
      console.log('Empresa destino:', destinationCompany);
      console.log('Equipamentos selecionados:', selectedEquipments.length);
      console.log('Status selecionado:', selectedStatus);

      // Registrar movimentações
      const movements = selectedEquipments.map(equipment => ({
        id_equipamento: equipment.id,
        tipo_movimento: movementType,
        data_movimento: movementDate,
        observacoes: observations || null,
        usuario_responsavel: user?.username || user?.name,
        tipo_manutencao_id: selectedMaintenanceType || null
      }));

      const { error } = await supabase
        .from('movimentacoes')
        .insert(movements);

      if (error) throw error;

      // Atualizações no equipamento baseadas no tipo de movimentação
      const equipmentUpdates: any = {};
      
      if (movementType === 'saida') {
        equipmentUpdates.data_saida = movementDate;
      }

      // CORREÇÃO PRINCIPAL: Se for transferência, atualizar a empresa do equipamento
      if (movementType === 'transferencia' && destinationCompany) {
        console.log('Atualizando empresa dos equipamentos para:', destinationCompany);
        equipmentUpdates.id_empresa = destinationCompany;
      }

      // Atualizar status se foi definido
      if (selectedStatus) {
        console.log('Atualizando status dos equipamentos para:', selectedStatus);
        equipmentUpdates.status = selectedStatus;
      }

      // Aplicar atualizações se houver
      if (Object.keys(equipmentUpdates).length > 0) {
        console.log('Aplicando atualizações:', equipmentUpdates);
        const { error: updateError } = await supabase
          .from('equipamentos')
          .update(equipmentUpdates)
          .in('id', selectedEquipments.map(eq => eq.id));

        if (updateError) {
          console.error('Erro ao atualizar equipamentos:', updateError);
          throw updateError;
        }
      }

      toast({
        title: "Sucesso",
        description: `Movimentação de ${selectedEquipments.length} equipamento(s) registrada com sucesso!`,
      });

      // Limpar formulário
      setSelectedEquipments([]);
      setMovementType('');
      setDestinationCompany('');
      setObservations('');
      setSelectedEquipmentType('');
      setSelectedMaintenanceType('');
      setSelectedStatus('');
      
      // Resetar data para hoje
      const today = new Date();
      const timezoneOffset = today.getTimezoneOffset() * 60000;
      const localDate = new Date(today.getTime() - timezoneOffset);
      setMovementDate(localDate.toISOString().split('T')[0]);
      
    } catch (error) {
      console.error('Erro ao salvar movimentação:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar movimentação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Movimentações de Equipamentos</h1>
        <Button
          onClick={loadCompanies}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          Recarregar Empresas
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nova Movimentação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="movementType">Tipo de Movimentação *</Label>
              <Select value={movementType} onValueChange={setMovementType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {movementTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
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

          <div>
            <Label htmlFor="destinationCompany">
              Empresa Destino {movementType === 'transferencia' ? '*' : ''}
            </Label>
            {companiesLoading ? (
              <div className="flex items-center gap-2 p-2 text-sm text-gray-500">
                <AlertCircle className="h-4 w-4 animate-spin" />
                Carregando empresas...
              </div>
            ) : companiesError ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 text-sm text-red-600 bg-red-50 rounded">
                  <AlertCircle className="h-4 w-4" />
                  {companiesError}
                </div>
                <Button
                  onClick={loadCompanies}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Tentar Novamente
                </Button>
              </div>
            ) : companies.length === 0 ? (
              <div className="flex items-center gap-2 p-2 text-sm text-yellow-600 bg-yellow-50 rounded">
                <AlertCircle className="h-4 w-4" />
                Nenhuma empresa encontrada
              </div>
            ) : (
              <Select value={destinationCompany} onValueChange={setDestinationCompany}>
                <SelectTrigger>
                  <SelectValue placeholder={`Selecione a empresa destino (${companies.length} disponíveis)`} />
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

          <div>
            <Label htmlFor="maintenanceType">Tipo de Manutenção</Label>
            <Select value={selectedMaintenanceType} onValueChange={setSelectedMaintenanceType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de manutenção" />
              </SelectTrigger>
              <SelectContent>
                {maintenanceTypes.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.descricao}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="equipmentType">Tipo de Equipamento</Label>
              <Select value={selectedEquipmentType} onValueChange={setSelectedEquipmentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map(type => (
                    <SelectItem key={type.id} value={type.nome}>
                      {type.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMaintenanceType && (
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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

          <div>
            <Label>Equipamentos Selecionados</Label>
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="outline"
                onClick={() => setShowSearchDialog(true)}
                className="flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                Buscar Equipamentos
              </Button>
              {selectedEquipments.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedEquipments.length} equipamento(s) selecionado(s)
                </span>
              )}
            </div>

            {selectedEquipments.length > 0 && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {selectedEquipments.map(equipment => (
                  <div key={equipment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">
                      {equipment.numero_serie} - {equipment.tipo} ({equipment.empresas?.name || 'N/A'})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              placeholder="Digite observações sobre a movimentação..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveMovement}
              disabled={loading || !movementType || selectedEquipments.length === 0}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Salvando...' : 'Registrar Movimentação'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <EquipmentSearchDialog
        isOpen={showSearchDialog}
        onClose={() => setShowSearchDialog(false)}
        onConfirm={handleEquipmentSelection}
        equipmentType={selectedEquipmentType}
      />
    </div>
  );
};

export default MovementPage;
