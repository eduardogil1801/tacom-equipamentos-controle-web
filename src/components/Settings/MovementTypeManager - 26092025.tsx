
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MovementType {
  id?: string;
  codigo: string;
  descricao: string;
  ativo?: boolean;
}

const MovementTypeManager: React.FC = () => {
  const [movementTypes, setMovementTypes] = useState<MovementType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<MovementType | null>(null);
  const [formData, setFormData] = useState<MovementType>({
    codigo: '',
    descricao: '',
    ativo: true
  });

  useEffect(() => {
    loadMovementTypes();
  }, []);

  const loadMovementTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tipos_manutencao')
        .select('*')
        .order('descricao');

      if (error) throw error;
      setMovementTypes(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de movimentação:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de movimentação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.codigo || !formData.descricao) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingType && editingType.id) {
        const { error } = await supabase
          .from('tipos_manutencao')
          .update({
            codigo: formData.codigo,
            descricao: formData.descricao,
            ativo: formData.ativo
          })
          .eq('id', editingType.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Tipo de movimentação atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('tipos_manutencao')
          .insert([{
            codigo: formData.codigo,
            descricao: formData.descricao,
            ativo: formData.ativo
          }]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Tipo de movimentação criado com sucesso!",
        });
      }

      resetForm();
      loadMovementTypes();
    } catch (error) {
      console.error('Erro ao salvar tipo de movimentação:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar tipo de movimentação",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (type: MovementType) => {
    setEditingType(type);
    setFormData(type);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de movimentação?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tipos_manutencao')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de movimentação excluído com sucesso!",
      });
      
      loadMovementTypes();
    } catch (error) {
      console.error('Erro ao excluir tipo de movimentação:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir tipo de movimentação",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      descricao: '',
      ativo: true
    });
    setEditingType(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando tipos de movimentação...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tipos de Movimentação</h2>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingType ? 'Editar' : 'Criar'} Tipo de Movimentação</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                    placeholder="Ex: TQ01"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Ex: Tela Quebrada"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {editingType ? 'Atualizar' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tipos de Movimentação Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movementTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.codigo}</TableCell>
                  <TableCell>{type.descricao}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${type.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {type.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(type)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => type.id && handleDelete(type.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MovementTypeManager;
