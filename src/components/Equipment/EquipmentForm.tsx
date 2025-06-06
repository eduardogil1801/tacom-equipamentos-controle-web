import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Equipment {
  id: string;
  tipo: string;
  numero_serie: string;
  data_entrada: string;
  data_saida?: string;
  id_empresa: string;
  estado?: string;
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
    tipo: '',
    numero_serie: '',
    data_entrada: '',
    data_saida: '',
    id_empresa: '',
    estado: ''
  });
  const [isInStock, setIsInStock] = useState(true);
  const [loading, setLoading] = useState(false);

  const estados = [
    'Acre',
    'Alagoas',
    'Amapá',
    'Amazonas',
    'Bahia',
    'Ceará',
    'Distrito Federal',
    'Espírito Santo',
    'Goiás',
    'Maranhão',
    'Mato Grosso',
    'Mato Grosso do Sul',
    'Minas Gerais',
    'Pará',
    'Paraíba',
    'Paraná',
    'Pernambuco',
    'Piauí',
    'Rio de Janeiro',
    'Rio Grande do Norte',
    'Rio Grande do Sul',
    'Rondônia',
    'Roraima',
    'Santa Catarina',
    'São Paulo',
    'Sergipe',
    'Tocantins'
  ];

  useEffect(() => {
    if (equipment) {
      setFormData({
        tipo: equipment.tipo,
        numero_serie: equipment.numero_serie,
        data_entrada: equipment.data_entrada,
        data_saida: equipment.data_saida || '',
        id_empresa: equipment.id_empresa,
        estado: equipment.estado || ''
      });
      setIsInStock(!equipment.data_saida);
    } else {
      // Set today as default entry date
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, data_entrada: today }));
    }
  }, [equipment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tipo || !formData.numero_serie || !formData.data_entrada || !formData.id_empresa || !formData.estado) {
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
      const equipmentData = {
        tipo: formData.tipo,
        numero_serie: formData.numero_serie,
        data_entrada: formData.data_entrada,
        data_saida: isInStock ? null : formData.data_saida || null,
        id_empresa: formData.id_empresa,
        estado: formData.estado
      };

      if (equipment) {
        // Update existing equipment
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
        // Create new equipment
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

  const handleStockStatusChange = (inStock: boolean) => {
    setIsInStock(inStock);
    if (inStock) {
      setFormData(prev => ({ ...prev, data_saida: '' }));
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
          {equipment ? 'Editar Equipamento' : 'Cadastrar Novo Equipamento'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Equipamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Equipamento *</Label>
                <Input
                  id="tipo"
                  placeholder="Ex: Notebook, Monitor, Impressora..."
                  value={formData.tipo}
                  onChange={(e) => handleChange('tipo', e.target.value)}
                  required
                />
              </div>

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
                <Label htmlFor="company">Empresa *</Label>
                <Select value={formData.id_empresa || 'placeholder'} onValueChange={(value) => handleChange('id_empresa', value === 'placeholder' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled>Selecione uma empresa</SelectItem>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado do Estoque *</Label>
                <Select value={formData.estado || 'placeholder'} onValueChange={(value) => handleChange('estado', value === 'placeholder' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled>Selecione um estado</SelectItem>
                    {estados.map(estado => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
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
                  onChange={(e) => handleChange('data_entrada', e.target.value)}
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
                      onCheckedChange={(checked) => handleStockStatusChange(checked as boolean)}
                    />
                    <Label htmlFor="inStock" className="text-sm font-normal">
                      Em Estoque
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="outOfStock"
                      checked={!isInStock}
                      onCheckedChange={(checked) => handleStockStatusChange(!(checked as boolean))}
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
                    onChange={(e) => handleChange('data_saida', e.target.value)}
                    required={!isInStock}
                  />
                </div>
              )}
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
