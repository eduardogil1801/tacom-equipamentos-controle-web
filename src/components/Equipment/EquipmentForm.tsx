
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
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
}

interface Company {
  id: string;
  name: string;
}

interface EquipmentFormProps {
  equipment?: Equipment | null;
  companies: Company[];
  onSave: () => void;
  onCancel: () => void;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({
  equipment,
  companies,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    numero_serie: '',
    tipo: '',
    modelo: '',
    id_empresa: '',
    data_entrada: ''
  });
  const [loading, setLoading] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);

  const equipmentTypes = [
    'CCIT 4.0',
    'CCIT 5.0',
    'PM (Painel de Motorista)',
    'UPEX',
    'Connections 4.0',
    'Connections 5.0'
  ];

  useEffect(() => {
    if (equipment) {
      setFormData({
        numero_serie: equipment.numero_serie,
        tipo: equipment.tipo,
        modelo: equipment.modelo || '',
        id_empresa: equipment.id_empresa,
        data_entrada: equipment.data_entrada
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, data_entrada: today }));
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
      // Buscar dados da empresa para auto-preencher estado e status
      const { data: companyData, error: companyError } = await supabase
        .from('empresas')
        .select('name, estado')
        .eq('id', formData.id_empresa)
        .single();

      if (companyError) throw companyError;

      const equipmentData = {
        numero_serie: formData.numero_serie,
        tipo: formData.tipo,
        modelo: formData.modelo,
        id_empresa: formData.id_empresa,
        data_entrada: formData.data_entrada,
        estado: companyData?.estado || 'Rio Grande do Sul',
        status: companyData?.name?.toLowerCase().includes('tacom') ? 'disponivel' : 'em_uso'
      };

      if (equipment) {
        const { error } = await supabase
          .from('equipamentos')
          .update(equipmentData)
          .eq('id', equipment.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Equipamento atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('equipamentos')
          .insert([equipmentData]);

        if (error) throw error;

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
              <div className="space-y-2">
                <Label htmlFor="numero_serie">Número de Série *</Label>
                <Input
                  id="numero_serie"
                  placeholder="Ex: ABC123456"
                  value={formData.numero_serie}
                  onChange={(e) => handleChange('numero_serie', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Equipamento *</Label>
                <Select value={formData.tipo || 'placeholder-tipo'} onValueChange={(value) => {
                  if (value !== 'placeholder-tipo') {
                    handleChange('tipo', value);
                  }
                }}>
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
                  value={formData.modelo}
                  onChange={(e) => handleChange('modelo', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa *</Label>
                <Select value={formData.id_empresa || 'placeholder-empresa'} onValueChange={(value) => {
                  if (value !== 'placeholder-empresa') {
                    handleChange('id_empresa', value);
                  }
                }}>
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
                  value={formData.data_entrada}
                  onChange={(e) => handleChange('data_entrada', e.target.value)}
                  required
                />
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
