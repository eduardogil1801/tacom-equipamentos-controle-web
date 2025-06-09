
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Search, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  modelo?: string;
  status: string;
  estado?: string;
  empresas: {
    id: string;
    name: string;
    estado?: string;
  };
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
  const [isMultiple, setIsMultiple] = useState(false);
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [searchSerial, setSearchSerial] = useState('');
  const [searchResults, setSearchResults] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [movementType, setMovementType] = useState('');
  const [movementDate, setMovementDate] = useState(new Date().toISOString().split('T')[0]);
  const [observations, setObservations] = useState('');
  const [maintenanceTypeId, setMaintenanceTypeId] = useState('');
  const [maintenanceDetails, setMaintenanceDetails] = useState('');
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Estados para o novo formulário
  const [newEquipmentData, setNewEquipmentData] = useState({
    numero_serie: '',
    tipo: '',
    modelo: '',
    id_empresa: '',
    estado: '',
    status: 'disponivel',
    isInStock: true,
    data_saida: ''
  });

  const equipmentTypes = [
    'CCIT 4.0',
    'CCIT 5.0',
    'PM (Painel de Motorista)',
    'UPEX',
    'Connections 4.0',
    'Connections 5.0'
  ];

  useEffect(() => {
    loadMaintenanceTypes();
    loadCompanies();
  }, []);

  useEffect(() => {
    if (searchSerial.length >= 1 && isMultiple) {
      searchEquipments();
    } else {
      setSearchResults([]);
    }
  }, [searchSerial, isMultiple]);

  useEffect(() => {
    // Auto-preencher estado baseado na empresa selecionada
    if (newEquipmentData.id_empresa) {
      const selectedCompany = companies.find(c => c.id === newEquipmentData.id_empresa);
      if (selectedCompany?.estado) {
        setNewEquipmentData(prev => ({ ...prev, estado: selectedCompany.estado || '' }));
      }
      
      // Auto-definir status baseado no nome da empresa
      if (selectedCompany && !selectedCompany.name.toLowerCase().includes('tacom')) {
        setNewEquipmentData(prev => ({ ...prev, status: 'em_uso' }));
      } else {
        setNewEquipmentData(prev => ({ ...prev, status: 'disponivel' }));
      }
    }
  }, [newEquipmentData.id_empresa, companies]);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
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
      setMaintenanceTypes(data || []);
    } catch (error) {
      console.error('Error loading maintenance types:', error);
    }
  };

  const searchEquipments = async () => {
    try {
      setSearchLoading(true);
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          id,
          numero_serie,
          tipo,
          modelo,
          status,
          estado,
          empresas (
            id,
            name,
            estado
          )
        `)
        .ilike('numero_serie', `%${searchSerial}%`)
        .limit(10);

      if (error) throw error;
      
      // Filtrar equipamentos já selecionados
      const filtered = (data || []).filter(eq => 
        !selectedEquipments.some(selected => selected.id === eq.id)
      );
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching equipments:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar equipamentos",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const toggleEquipmentSelection = (equipment: Equipment) => {
    const isSelected = selectedEquipments.some(eq => eq.id === equipment.id);
    
    if (isSelected) {
      setSelectedEquipments(selectedEquipments.filter(eq => eq.id !== equipment.id));
    } else {
      setSelectedEquipments([...selectedEquipments, equipment]);
    }
  };

  const removeEquipment = (equipmentId: string) => {
    setSelectedEquipments(selectedEquipments.filter(eq => eq.id !== equipmentId));
  };

  const handleNewEquipmentSubmit = async () => {
    if (!newEquipmentData.numero_serie || !newEquipmentData.tipo || !newEquipmentData.id_empresa) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const equipmentData = {
        numero_serie: newEquipmentData.numero_serie,
        tipo: newEquipmentData.tipo,
        modelo: newEquipmentData.modelo,
        id_empresa: newEquipmentData.id_empresa,
        estado: newEquipmentData.estado,
        status: newEquipmentData.status,
        data_entrada: movementDate,
        data_saida: newEquipmentData.isInStock ? null : newEquipmentData.data_saida || null
      };

      const { error } = await supabase
        .from('equipamentos')
        .insert([equipmentData]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Equipamento cadastrado com sucesso!",
      });

      // Limpar formulário
      setNewEquipmentData({
        numero_serie: '',
        tipo: '',
        modelo: '',
        id_empresa: '',
        estado: '',
        status: 'disponivel',
        isInStock: true,
        data_saida: ''
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving equipment:', error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar equipamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedEquipments.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um equipamento",
        variant: "destructive",
      });
      return;
    }

    if (!movementType) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de movimentação",
        variant: "destructive",
      });
      return;
    }

    if (movementType === 'manutencao' && !maintenanceTypeId) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de manutenção",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Criar movimentações para cada equipamento
      const movements = selectedEquipments.map(equipment => ({
        id_equipamento: equipment.id,
        tipo_movimento: movementType,
        data_movimento: movementDate,
        observacoes: observations,
        tipo_manutencao_id: movementType === 'manutencao' ? maintenanceTypeId : null,
        detalhes_manutencao: movementType === 'manutencao' ? maintenanceDetails : null,
        usuario_responsavel: 'Sistema'
      }));

      const { error: movementError } = await supabase
        .from('movimentacoes')
        .insert(movements);

      if (movementError) throw movementError;

      // Atualizar status dos equipamentos se necessário
      if (movementType === 'manutencao') {
        const { error: updateError } = await supabase
          .from('equipamentos')
          .update({ 
            em_manutencao: true,
            status: 'aguardando_manutencao'
          })
          .in('id', selectedEquipments.map(eq => eq.id));

        if (updateError) throw updateError;
      } else if (movementType === 'retorno_manutencao') {
        const { error: updateError } = await supabase
          .from('equipamentos')
          .update({ 
            em_manutencao: false,
            status: 'disponivel'
          })
          .in('id', selectedEquipments.map(eq => eq.id));

        if (updateError) throw updateError;
      }

      toast({
        title: "Sucesso",
        description: `Movimentação registrada para ${selectedEquipments.length} equipamento(s)!`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving movement:', error);
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          Movimentação de Equipamentos
        </h1>
      </div>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Movimentação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="multiple"
              checked={isMultiple}
              onCheckedChange={(checked) => setIsMultiple(checked as boolean)}
            />
            <Label htmlFor="multiple">Movimentar múltiplos equipamentos</Label>
          </div>
        </CardContent>
      </Card>

      {/* Formulário para novos equipamentos ou busca */}
      {isMultiple ? (
        <Card>
          <CardHeader>
            <CardTitle>Buscar e Selecionar Equipamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar por Número de Série</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Digite o número de série..."
                  value={searchSerial}
                  onChange={(e) => setSearchSerial(e.target.value)}
                  className="pl-10"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Resultados da busca */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label>Resultados da Busca</Label>
                <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-2">
                  {searchResults.map(equipment => (
                    <div key={equipment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={selectedEquipments.some(eq => eq.id === equipment.id)}
                          onCheckedChange={() => toggleEquipmentSelection(equipment)}
                        />
                        <div className="flex-1">
                          <div className="font-mono text-sm font-bold">{equipment.numero_serie}</div>
                          <div className="text-xs text-gray-600">
                            {equipment.tipo} {equipment.modelo && `- ${equipment.modelo}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {equipment.empresas?.name} ({equipment.estado})
                          </div>
                          <div className="text-xs">
                            <span className={`px-2 py-1 rounded ${
                              equipment.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                              equipment.status === 'em_uso' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {equipment.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipamentos selecionados */}
            {selectedEquipments.length > 0 && (
              <div className="space-y-2">
                <Label>Equipamentos Selecionados ({selectedEquipments.length})</Label>
                <div className="space-y-2">
                  {selectedEquipments.map(equipment => (
                    <div key={equipment.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <div className="flex-1">
                        <div className="font-mono text-sm font-bold">{equipment.numero_serie}</div>
                        <div className="text-xs text-gray-600">
                          {equipment.tipo} {equipment.modelo && `- ${equipment.modelo}`} - {equipment.empresas?.name}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeEquipment(equipment.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Informações do Equipamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero_serie">Número de Série *</Label>
                <Input
                  id="numero_serie"
                  placeholder="Ex: ABC123456"
                  value={newEquipmentData.numero_serie}
                  onChange={(e) => setNewEquipmentData(prev => ({ ...prev, numero_serie: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Equipamento *</Label>
                <Select 
                  value={newEquipmentData.tipo || 'placeholder-tipo'} 
                  onValueChange={(value) => setNewEquipmentData(prev => ({ 
                    ...prev, 
                    tipo: value === 'placeholder-tipo' ? '' : value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder-tipo" disabled>Selecione o tipo</SelectItem>
                    {equipmentTypes.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  placeholder="Ex: H2, DMX200, V2000..."
                  value={newEquipmentData.modelo}
                  onChange={(e) => setNewEquipmentData(prev => ({ ...prev, modelo: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa *</Label>
                <Select 
                  value={newEquipmentData.id_empresa || 'placeholder-empresa'} 
                  onValueChange={(value) => setNewEquipmentData(prev => ({ 
                    ...prev, 
                    id_empresa: value === 'placeholder-empresa' ? '' : value 
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder-empresa" disabled>Selecione uma empresa</SelectItem>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_entrada">Data de Cadastro *</Label>
                <Input
                  id="data_entrada"
                  type="date"
                  value={movementDate}
                  onChange={(e) => setMovementDate(e.target.value)}
                  required
                />
              </div>

              <div className="col-span-full space-y-3">
                <Label>Status do Equipamento *</Label>
                <div className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="inStock"
                      checked={newEquipmentData.isInStock}
                      onCheckedChange={(checked) => setNewEquipmentData(prev => ({ 
                        ...prev, 
                        isInStock: checked as boolean,
                        data_saida: checked ? '' : prev.data_saida
                      }))}
                    />
                    <Label htmlFor="inStock" className="text-sm font-normal">
                      Em Estoque
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="outOfStock"
                      checked={!newEquipmentData.isInStock}
                      onCheckedChange={(checked) => setNewEquipmentData(prev => ({ 
                        ...prev, 
                        isInStock: !(checked as boolean)
                      }))}
                    />
                    <Label htmlFor="outOfStock" className="text-sm font-normal">
                      Fora de Estoque
                    </Label>
                  </div>
                </div>
              </div>

              {!newEquipmentData.isInStock && (
                <div className="space-y-2">
                  <Label htmlFor="data_saida">Data de Saída *</Label>
                  <Input
                    id="data_saida"
                    type="date"
                    value={newEquipmentData.data_saida}
                    onChange={(e) => setNewEquipmentData(prev => ({ ...prev, data_saida: e.target.value }))}
                    required={!newEquipmentData.isInStock}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                onClick={handleNewEquipmentSubmit}
                className="bg-primary hover:bg-primary/90" 
                disabled={loading}
              >
                {loading ? 'Cadastrando...' : 'Cadastrar Equipamento'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dados da Movimentação - só aparece se houver equipamentos selecionados */}
      {isMultiple && selectedEquipments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Dados da Movimentação</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="movementType">Tipo de Movimentação *</Label>
                  <Select value={movementType} onValueChange={setMovementType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                      <SelectItem value="manutencao">Envio para Manutenção</SelectItem>
                      <SelectItem value="retorno_manutencao">Retorno da Manutenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="movementDate">Data da Movimentação *</Label>
                  <Input
                    id="movementDate"
                    type="date"
                    value={movementDate}
                    onChange={(e) => setMovementDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Campos específicos para manutenção */}
              {movementType === 'manutencao' && (
                <div className="space-y-4 p-4 bg-yellow-50 rounded">
                  <h3 className="font-medium text-yellow-800">Informações de Manutenção</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="maintenanceType">Tipo de Manutenção *</Label>
                    <Select value={maintenanceTypeId} onValueChange={setMaintenanceTypeId}>
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

                  <div className="space-y-2">
                    <Label htmlFor="maintenanceDetails">Detalhes da Manutenção</Label>
                    <Textarea
                      id="maintenanceDetails"
                      placeholder="Descreva detalhes adicionais sobre a manutenção..."
                      value={maintenanceDetails}
                      onChange={(e) => setMaintenanceDetails(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90" 
                  disabled={loading || selectedEquipments.length === 0}
                >
                  {loading ? 'Registrando...' : 'Registrar Movimentação'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EquipmentMovement;
