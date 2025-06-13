
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  modelo?: string;
  estado?: string;
  status?: string;
  data_entrada: string;
  data_saida?: string;
  id_empresa: string;
}

interface Company {
  id: string;
  name: string;
}

interface EquipmentFormProps {
  equipment?: Equipment | null;
  companies: Company[];
  onCancel: () => void;
  onSave: () => void;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({
  equipment,
  companies,
  onCancel,
  onSave
}) => {
  const [formData, setFormData] = useState({
    numero_serie: '',
    tipo: '',
    modelo: '',
    estado: '',
    status: 'disponivel',
    data_entrada: '',
    id_empresa: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (equipment) {
      // Para edição, usar os dados existentes
      setFormData({
        numero_serie: equipment.numero_serie || '',
        tipo: equipment.tipo || '',
        modelo: equipment.modelo || '',
        estado: equipment.estado || '',
        status: equipment.status || 'disponivel',
        data_entrada: equipment.data_entrada || '',
        id_empresa: equipment.id_empresa || ''
      });
    } else {
      // Para novo equipamento, definir data atual
      const hoje = new Date();
      const dataFormatada = hoje.getFullYear() + '-' + 
                          String(hoje.getMonth() + 1).padStart(2, '0') + '-' + 
                          String(hoje.getDate()).padStart(2, '0');
      
      setFormData(prev => ({
        ...prev,
        data_entrada: dataFormatada
      }));
    }
  }, [equipment]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.numero_serie || !formData.tipo || !formData.id_empresa) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (equipment) {
        // Atualizar equipamento existente
        const { error } = await supabase
          .from('equipamentos')
          .update({
            numero_serie: formData.numero_serie,
            tipo: formData.tipo,
            modelo: formData.modelo || null,
            estado: formData.estado || null,
            status: formData.status,
            id_empresa: formData.id_empresa
          })
          .eq('id', equipment.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Equipamento atualizado com sucesso!",
        });
      } else {
        // Criar novo equipamento
        const { error } = await supabase
          .from('equipamentos')
          .insert({
            numero_serie: formData.numero_serie,
            tipo: formData.tipo,
            modelo: formData.modelo || null,
            estado: formData.estado || null,
            status: formData.status,
            data_entrada: formData.data_entrada,
            id_empresa: formData.id_empresa
          });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Equipamento criado com sucesso!",
        });
      }

      onSave();
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar equipamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">
          {equipment ? 'Editar Equipamento' : 'Novo Equipamento'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Equipamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numero_serie">Número de Série *</Label>
                <Input
                  id="numero_serie"
                  value={formData.numero_serie}
                  onChange={(e) => handleInputChange('numero_serie', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Input
                  id="tipo"
                  value={formData.tipo}
                  onChange={(e) => handleInputChange('tipo', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="modelo">Modelo</Label>
                <Input
                  id="modelo"
                  value={formData.modelo}
                  onChange={(e) => handleInputChange('modelo', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="empresa">Empresa *</Label>
                <Select
                  value={formData.id_empresa}
                  onValueChange={(value) => handleInputChange('id_empresa', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponivel">Disponível</SelectItem>
                    <SelectItem value="em_uso">Em Uso</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="aguardando_manutencao">Aguardando Manutenção</SelectItem>
                    <SelectItem value="danificado">Danificado</SelectItem>
                    <SelectItem value="indisponivel">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="data_entrada">Data de Entrada</Label>
                <Input
                  id="data_entrada"
                  type="date"
                  value={formData.data_entrada}
                  onChange={(e) => handleInputChange('data_entrada', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EquipmentForm;
