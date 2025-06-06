
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import { Equipment, Company } from '@/types';
import { toast } from '@/hooks/use-toast';

interface EquipmentFormProps {
  equipment?: Equipment | null;
  companies: Company[];
  onSave: (equipment: Omit<Equipment, 'id'>) => void;
  onCancel: () => void;
}

const EquipmentForm: React.FC<EquipmentFormProps> = ({
  equipment,
  companies,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    type: '',
    serialNumber: '',
    entryDate: '',
    exitDate: '',
    companyId: ''
  });
  const [isInStock, setIsInStock] = useState(true);

  useEffect(() => {
    if (equipment) {
      setFormData({
        type: equipment.type,
        serialNumber: equipment.serialNumber,
        entryDate: equipment.entryDate,
        exitDate: equipment.exitDate || '',
        companyId: equipment.companyId
      });
      setIsInStock(!equipment.exitDate);
    } else {
      // Set today as default entry date
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, entryDate: today }));
    }
  }, [equipment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.serialNumber || !formData.entryDate || !formData.companyId) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!isInStock && formData.exitDate && new Date(formData.exitDate) < new Date(formData.entryDate)) {
      toast({
        title: "Erro",
        description: "A data de saída não pode ser anterior à data de entrada.",
        variant: "destructive",
      });
      return;
    }

    onSave({
      type: formData.type,
      serialNumber: formData.serialNumber,
      entryDate: formData.entryDate,
      exitDate: isInStock ? undefined : formData.exitDate || undefined,
      companyId: formData.companyId
    });

    toast({
      title: "Sucesso",
      description: equipment ? "Equipamento atualizado com sucesso!" : "Equipamento cadastrado com sucesso!",
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStockStatusChange = (inStock: boolean) => {
    setIsInStock(inStock);
    if (inStock) {
      setFormData(prev => ({ ...prev, exitDate: '' }));
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
                <Label htmlFor="type">Tipo de Equipamento *</Label>
                <Input
                  id="type"
                  placeholder="Ex: Notebook, Monitor, Impressora..."
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Número de Série *</Label>
                <Input
                  id="serialNumber"
                  placeholder="Ex: ABC123456"
                  value={formData.serialNumber}
                  onChange={(e) => handleChange('serialNumber', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa *</Label>
                <Select value={formData.companyId} onValueChange={(value) => handleChange('companyId', value)}>
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
                <Label htmlFor="entryDate">Data de Entrada *</Label>
                <Input
                  id="entryDate"
                  type="date"
                  value={formData.entryDate}
                  onChange={(e) => handleChange('entryDate', e.target.value)}
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
                  <Label htmlFor="exitDate">Data de Saída *</Label>
                  <Input
                    id="exitDate"
                    type="date"
                    value={formData.exitDate}
                    onChange={(e) => handleChange('exitDate', e.target.value)}
                    required={!isInStock}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {equipment ? 'Atualizar' : 'Cadastrar'} Equipamento
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
