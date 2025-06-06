
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  empresas?: {
    name: string;
    estado?: string;
  };
}

interface Company {
  id: string;
  name: string;
  estado?: string;
}

interface MovementFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const EquipmentMovement: React.FC<MovementFormProps> = ({ onCancel, onSuccess }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [serialNumbers, setSerialNumbers] = useState<string[]>(['']);
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [formData, setFormData] = useState({
    id_empresa: '',
    estado: '',
    status: 'em_uso',
    data_entrada: '',
    data_saida: '',
    tipo: ''
  });
  const [isInStock, setIsInStock] = useState(true);
  const [loading, setLoading] = useState(false);
  const [multipleSeries, setMultipleSeries] = useState(false);

  const estados = ['Rio Grande do Sul', 'Santa Catarina', 'Minas Gerais'];
  const statusOptions = [
    'disponivel',
    'recuperados',
    'aguardando_despacho_contagem',
    'enviados_manutencao_contagem',
    'aguardando_manutencao',
    'em_uso',
    'danificado'
  ];

  useEffect(() => {
    loadCompanies();
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, data_entrada: today }));
  }, []);

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
      toast({
        title: "Erro",
        description: "Erro ao carregar empresas",
        variant: "destructive",
      });
    }
  };

  const handleSerialNumberChange = async (index: number, value: string) => {
    const newSerialNumbers = [...serialNumbers];
    newSerialNumbers[index] = value;
    setSerialNumbers(newSerialNumbers);

    if (value.length > 0) {
      try {
        const { data: equipments, error } = await supabase
          .from('equipamentos')
          .select(`
            *,
            empresas (
              name,
              estado
            )
          `)
          .eq('numero_serie', value);

        if (error) throw error;

        if (equipments && equipments.length > 0) {
          setSelectedEquipments(equipments);
          
          // Se há mais de um equipamento com o mesmo número de série, não preenche automaticamente o tipo
          if (equipments.length === 1) {
            setFormData(prev => ({ ...prev, tipo: equipments[0].tipo }));
          } else {
            setFormData(prev => ({ ...prev, tipo: '' }));
          }
        } else {
          setSelectedEquipments([]);
          setFormData(prev => ({ ...prev, tipo: '' }));
        }
      } catch (error) {
        console.error('Error searching equipment:', error);
      }
    }
  };

  const handleCompanyChange = (companyId: string) => {
    const selectedCompany = companies.find(c => c.id === companyId);
    setFormData(prev => ({
      ...prev,
      id_empresa: companyId,
      estado: selectedCompany?.estado || '',
      status: isCompanyTacom(selectedCompany?.name) ? prev.status : 'em_uso'
    }));
  };

  const isCompanyTacom = (companyName?: string) => {
    if (!companyName) return false;
    return companyName.toLowerCase().includes('tacom projetos sc') || 
           companyName.toLowerCase().includes('tacom sistemas poa');
  };

  const addSerialNumber = () => {
    setSerialNumbers([...serialNumbers, '']);
  };

  const removeSerialNumber = (index: number) => {
    if (serialNumbers.length > 1) {
      const newSerialNumbers = serialNumbers.filter((_, i) => i !== index);
      setSerialNumbers(newSerialNumbers);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validSerialNumbers = serialNumbers.filter(s => s.trim().length > 0);
    
    if (validSerialNumbers.length === 0 || !formData.id_empresa || !formData.estado || !formData.data_entrada) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!isInStock && formData.data_saida && new Date(formData.data_saida) < new Date(formData.data_entrada)) {
      toast({
        title: "Erro",
        description: "A data de saída não pode ser anterior à data de entrada.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      for (const numeroSerie of validSerialNumbers) {
        // Verificar se o equipamento existe
        const { data: existingEquipment } = await supabase
          .from('equipamentos')
          .select('*')
          .eq('numero_serie', numeroSerie)
          .single();

        if (existingEquipment) {
          // Atualizar equipamento existente
          const updateData = {
            id_empresa: formData.id_empresa,
            estado: formData.estado,
            status: formData.status,
            data_saida: isInStock ? null : formData.data_saida || null,
          };

          const { error } = await supabase
            .from('equipamentos')
            .update(updateData)
            .eq('numero_serie', numeroSerie);

          if (error) throw error;

          // Registrar movimentação
          await supabase
            .from('movimentacoes')
            .insert({
              id_equipamento: existingEquipment.id,
              tipo_movimento: isInStock ? 'entrada' : 'saida',
              data_movimento: isInStock ? formData.data_entrada : formData.data_saida,
              observacoes: `Movimentação - ${isInStock ? 'Entrada' : 'Saída'} de equipamento`
            });
        } else {
          // Criar novo equipamento
          const equipmentData = {
            tipo: formData.tipo,
            numero_serie: numeroSerie,
            data_entrada: formData.data_entrada,
            data_saida: isInStock ? null : formData.data_saida || null,
            id_empresa: formData.id_empresa,
            estado: formData.estado,
            status: formData.status
          };

          const { error } = await supabase
            .from('equipamentos')
            .insert([equipmentData]);

          if (error) throw error;
        }
      }

      toast({
        title: "Sucesso",
        description: `${validSerialNumbers.length} equipamento(s) movimentado(s) com sucesso!`,
      });

      // Manter dados do formulário, exceto números de série
      setSerialNumbers(['']);
      setSelectedEquipments([]);
      onSuccess();
    } catch (error) {
      console.error('Error moving equipment:', error);
      toast({
        title: "Erro",
        description: "Erro ao movimentar equipamento(s)",
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
        <h1 className="text-2xl font-bold text-gray-900">Movimentação de Equipamentos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Movimentação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="multipleSeries"
                  checked={multipleSeries}
                  onCheckedChange={(checked) => {
                    setMultipleSeries(checked as boolean);
                    if (!checked) {
                      setSerialNumbers(['']);
                    }
                  }}
                />
                <Label htmlFor="multipleSeries" className="text-sm font-normal">
                  Movimentar múltiplos equipamentos
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Números de Série *</Label>
                {serialNumbers.map((serial, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Ex: ABC123456"
                      value={serial}
                      onChange={(e) => handleSerialNumberChange(index, e.target.value)}
                      required
                    />
                    {multipleSeries && (
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={addSerialNumber}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        {serialNumbers.length > 1 && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeSerialNumber(index)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {selectedEquipments.length > 1 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Encontrados {selectedEquipments.length} equipamentos com este número de série em empresas diferentes:
                  </p>
                  <ul className="text-sm text-yellow-700 mt-1">
                    {selectedEquipments.map((eq, idx) => (
                      <li key={idx}>• {eq.empresas?.name} - {eq.tipo}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Equipamento *</Label>
                  <Input
                    id="tipo"
                    placeholder="Ex: CCIT 5.0"
                    value={formData.tipo}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">Empresa *</Label>
                  <Select value={formData.id_empresa} onValueChange={handleCompanyChange}>
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

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Select value={formData.estado} onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map(estado => (
                        <SelectItem key={estado} value={estado}>
                          {estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    disabled={!isCompanyTacom(companies.find(c => c.id === formData.id_empresa)?.name)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_entrada">Data de Entrada *</Label>
                  <Input
                    id="data_entrada"
                    type="date"
                    value={formData.data_entrada}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_entrada: e.target.value }))}
                    required
                  />
                </div>

                <div className="col-span-full space-y-3">
                  <Label>Status do Equipamento *</Label>
                  <div className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inStock"
                        checked={isInStock}
                        onCheckedChange={(checked) => setIsInStock(checked as boolean)}
                      />
                      <Label htmlFor="inStock" className="text-sm font-normal">
                        Em Estoque
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="outOfStock"
                        checked={!isInStock}
                        onCheckedChange={(checked) => setIsInStock(!(checked as boolean))}
                      />
                      <Label htmlFor="outOfStock" className="text-sm font-normal">
                        Fora de Estoque
                      </Label>
                    </div>
                  </div>
                </div>

                {!isInStock && (
                  <div className="space-y-2">
                    <Label htmlFor="data_saida">Data de Saída *</Label>
                    <Input
                      id="data_saida"
                      type="date"
                      value={formData.data_saida}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_saida: e.target.value }))}
                      required={!isInStock}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? 'Movimentando...' : 'Registrar Movimentação'}
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

export default EquipmentMovement;
