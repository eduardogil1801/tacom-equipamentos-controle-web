
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface State {
  id: string;
  nome: string;
  ativo: boolean;
}

const StateManager: React.FC = () => {
  const { user, checkPermission } = useAuth();
  const [states, setStates] = useState<State[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingState, setEditingState] = useState<State | null>(null);
  const [formData, setFormData] = useState({ nome: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStates();
  }, []);

  const loadStates = async () => {
    try {
      const { data, error } = await supabase
        .from('estados')
        .select('*')
        .order('nome');

      if (error) throw error;
      setStates(data || []);
    } catch (error) {
      console.error('Erro ao carregar estados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar estados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome) {
      toast({
        title: "Erro",
        description: "Nome do estado é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingState) {
        const { error } = await supabase
          .from('estados')
          .update({ nome: formData.nome })
          .eq('id', editingState.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Estado atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('estados')
          .insert([{ nome: formData.nome }]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Estado criado com sucesso!",
        });
      }

      resetForm();
      loadStates();
    } catch (error) {
      console.error('Erro ao salvar estado:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar estado",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (state: State) => {
    setEditingState(state);
    setFormData({ nome: state.nome });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('estados')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Estado excluído com sucesso!",
      });
      
      loadStates();
    } catch (error) {
      console.error('Erro ao excluir estado:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir estado",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ nome: '' });
    setEditingState(null);
    setShowForm(false);
  };

  if (!checkPermission('settings', 'create')) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Acesso negado. Apenas administradores podem gerenciar estados.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando estados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Gerenciar Estados</h2>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Estado
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingState ? 'Editar' : 'Adicionar'} Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome do Estado *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ nome: e.target.value })}
                  placeholder="Ex: Rio Grande do Sul"
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit">
                  {editingState ? 'Atualizar' : 'Criar'} Estado
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
          <CardTitle>Estados Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {states.map(state => (
                  <tr key={state.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{state.nome}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        state.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {state.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(state)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(state.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StateManager;
