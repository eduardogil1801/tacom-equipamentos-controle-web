
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MaintenanceType {
  id: string;
  codigo: string;
  descricao: string;
  ativo: boolean;
}

const MaintenanceTypeManager = () => {
  const [types, setTypes] = useState<MaintenanceType[]>([]);
  const [newType, setNewType] = useState({ codigo: '', descricao: '' });
  const [editingType, setEditingType] = useState<MaintenanceType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaintenanceTypes();
  }, []);

  const loadMaintenanceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_manutencao')
        .select('*')
        .order('codigo');

      if (error) throw error;
      
      // Ordenar os tipos de manutenção numericamente pelo código
      const sortedTypes = (data || []).sort((a, b) => {
        const numA = parseInt(a.codigo);
        const numB = parseInt(b.codigo);
        return numA - numB;
      });
      
      setTypes(sortedTypes);
    } catch (error) {
      console.error('Error loading maintenance types:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de manutenção",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNextCode = () => {
    const maxCode = types.reduce((max, type) => {
      const num = parseInt(type.codigo);
      return num > max ? num : max;
    }, 0);
    return (maxCode + 1).toString().padStart(2, '0');
  };

  const handleSave = async () => {
    if (!newType.descricao.trim()) {
      toast({
        title: "Erro",
        description: "Descrição é obrigatória",
        variant: "destructive",
      });
      return;
    }

    try {
      const codigo = newType.codigo || generateNextCode();
      
      const { error } = await supabase
        .from('tipos_manutencao')
        .insert([{ codigo, descricao: newType.descricao }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de manutenção criado com sucesso!",
      });

      setNewType({ codigo: '', descricao: '' });
      loadMaintenanceTypes();
    } catch (error) {
      console.error('Error saving maintenance type:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar tipo de manutenção",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (type: MaintenanceType) => {
    try {
      const { error } = await supabase
        .from('tipos_manutencao')
        .update({ descricao: type.descricao })
        .eq('id', type.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de manutenção atualizado com sucesso!",
      });

      setEditingType(null);
      loadMaintenanceTypes();
    } catch (error) {
      console.error('Error updating maintenance type:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar tipo de manutenção",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tipos_manutencao')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de manutenção excluído com sucesso!",
      });

      loadMaintenanceTypes();
    } catch (error) {
      console.error('Error deleting maintenance type:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir tipo de manutenção",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Novo Tipo de Manutenção</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                placeholder={`Próximo: ${generateNextCode()}`}
                value={newType.codigo}
                onChange={(e) => setNewType({ ...newType, codigo: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                placeholder="Ex: Tela Quebrada"
                value={newType.descricao}
                onChange={(e) => setNewType({ ...newType, descricao: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSave} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de Manutenção Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {types.map((type) => (
              <div key={type.id} className="flex items-center justify-between p-3 border rounded">
                {editingType?.id === type.id ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                      {type.codigo}
                    </span>
                    <Input
                      value={editingType.descricao}
                      onChange={(e) => setEditingType({ ...editingType, descricao: e.target.value })}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={() => handleUpdate(editingType)}>
                      Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingType(null)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      <span className="font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {type.codigo}
                      </span>
                      <span>{type.descricao}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingType(type)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(type.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceTypeManager;
