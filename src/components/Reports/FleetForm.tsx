
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FleetData {
  id: string;
  cod_operadora: string;
  nome_empresa: string;
  simples_com_imagem: number;
  simples_sem_imagem: number;
  secao: number;
  total: number;
  nuvem: number;
  citgis: number;
  buszoom: number;
  mes_referencia: string;
}

interface FleetFormProps {
  fleet?: FleetData | null;
  onSave: () => void;
  onCancel: () => void;
}

const FleetForm: React.FC<FleetFormProps> = ({
  fleet,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    cod_operadora: '',
    nome_empresa: '',
    simples_com_imagem: 0,
    simples_sem_imagem: 0,
    secao: 0,
    total: 0,
    nuvem: 0,
    citgis: 0,
    buszoom: 0,
    mes_referencia: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fleet) {
      setFormData({
        cod_operadora: fleet.cod_operadora,
        nome_empresa: fleet.nome_empresa,
        simples_com_imagem: fleet.simples_com_imagem || 0,
        simples_sem_imagem: fleet.simples_sem_imagem || 0,
        secao: fleet.secao || 0,
        total: fleet.total || 0,
        nuvem: fleet.nuvem || 0,
        citgis: fleet.citgis || 0,
        buszoom: fleet.buszoom || 0,
        mes_referencia: fleet.mes_referencia
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, mes_referencia: today }));
    }
  }, [fleet]);

  useEffect(() => {
    // Calcular total automaticamente
    const total = formData.simples_com_imagem + formData.simples_sem_imagem + formData.secao;
    setFormData(prev => ({ ...prev, total }));
  }, [formData.simples_com_imagem, formData.simples_sem_imagem, formData.secao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cod_operadora || !formData.nome_empresa || !formData.mes_referencia) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const fleetData = {
        cod_operadora: formData.cod_operadora,
        nome_empresa: formData.nome_empresa,
        simples_com_imagem: formData.simples_com_imagem,
        simples_sem_imagem: formData.simples_sem_imagem,
        secao: formData.secao,
        total: formData.total,
        nuvem: formData.nuvem,
        citgis: formData.citgis,
        buszoom: formData.buszoom,
        mes_referencia: formData.mes_referencia
      };

      if (fleet) {
        const { error } = await supabase
          .from('frota')
          .update(fleetData)
          .eq('id', fleet.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Registro da frota atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('frota')
          .insert([fleetData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Registro da frota cadastrado com sucesso!",
        });
      }

      onSave();
    } catch (error) {
      console.error('Error saving fleet data:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar registro da frota",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
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
          {fleet ? 'Editar Registro da Frota' : 'Novo Registro da Frota'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Frota</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cod_operadora">Código da Operadora *</Label>
                <Input
                  id="cod_operadora"
                  placeholder="Ex: 001"
                  value={formData.cod_operadora}
                  onChange={(e) => handleChange('cod_operadora', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome_empresa">Nome da Empresa *</Label>
                <Input
                  id="nome_empresa"
                  placeholder="Ex: Empresa ABC"
                  value={formData.nome_empresa}
                  onChange={(e) => handleChange('nome_empresa', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="simples_sem_imagem">Simples S/Imagem</Label>
                <Input
                  id="simples_sem_imagem"
                  type="number"
                  min="0"
                  value={formData.simples_sem_imagem}
                  onChange={(e) => handleChange('simples_sem_imagem', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="simples_com_imagem">Simples C/Imagem</Label>
                <Input
                  id="simples_com_imagem"
                  type="number"
                  min="0"
                  value={formData.simples_com_imagem}
                  onChange={(e) => handleChange('simples_com_imagem', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secao">Seção</Label>
                <Input
                  id="secao"
                  type="number"
                  min="0"
                  value={formData.secao}
                  onChange={(e) => handleChange('secao', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total">Total (Calculado)</Label>
                <Input
                  id="total"
                  type="number"
                  value={formData.total}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nuvem">Nuvem</Label>
                <Input
                  id="nuvem"
                  type="number"
                  min="0"
                  value={formData.nuvem}
                  onChange={(e) => handleChange('nuvem', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="citgis">CitGis</Label>
                <Input
                  id="citgis"
                  type="number"
                  min="0"
                  value={formData.citgis}
                  onChange={(e) => handleChange('citgis', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buszoom">BusZoom</Label>
                <Input
                  id="buszoom"
                  type="number"
                  min="0"
                  value={formData.buszoom}
                  onChange={(e) => handleChange('buszoom', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mes_referencia">Mês de Referência *</Label>
                <Input
                  id="mes_referencia"
                  type="date"
                  value={formData.mes_referencia}
                  onChange={(e) => handleChange('mes_referencia', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? 'Salvando...' : (fleet ? 'Atualizar' : 'Cadastrar')} Registro
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

export default FleetForm;
