
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EquipmentType {
  id: string;
  nome: string;
  ativo: boolean;
  created_at: string;
}

const EquipmentTypeManager: React.FC = () => {
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<EquipmentType | null>(null);
  const [formData, setFormData] = useState({ nome: '' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchEquipmentTypes();
  }, []);

  const fetchEquipmentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('tipos_equipamento')
        .select('*')
        .order('nome');

      if (error) throw error;
      setEquipmentTypes(data || []);
    } catch (error) {
      console.error('Erro ao buscar tipos de equipamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar tipos de equipamento",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingType) {
        const { error } = await supabase
          .from('tipos_equipamento')
          .update({ nome: formData.nome })
          .eq('id', editingType.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Tipo de equipamento atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('tipos_equipamento')
          .insert({ nome: formData.nome });

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Tipo de equipamento criado com sucesso!",
        });
      }

      setFormData({ nome: '' });
      setEditingType(null);
      setIsDialogOpen(false);
      fetchEquipmentTypes();
    } catch (error) {
      console.error('Erro ao salvar tipo de equipamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar tipo de equipamento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (equipmentType: EquipmentType) => {
    setEditingType(equipmentType);
    setFormData({ nome: equipmentType.nome });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de equipamento?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tipos_equipamento')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de equipamento excluído com sucesso!",
      });

      fetchEquipmentTypes();
    } catch (error) {
      console.error('Erro ao excluir tipo de equipamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir tipo de equipamento",
        variant: "destructive",
      });
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('tipos_equipamento')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Status do tipo de equipamento atualizado!",
      });

      fetchEquipmentTypes();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do tipo de equipamento",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ nome: '' });
    setEditingType(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Tipos de Equipamento</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Tipo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingType ? 'Editar Tipo de Equipamento' : 'Novo Tipo de Equipamento'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Tipo</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Validador, GPS, Câmera..."
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : editingType ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipmentTypes.map((equipmentType) => (
                <TableRow key={equipmentType.id}>
                  <TableCell className="font-medium">{equipmentType.nome}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleStatus(equipmentType.id, equipmentType.ativo)}
                      className={equipmentType.ativo ? 'text-green-600' : 'text-red-600'}
                    >
                      {equipmentType.ativo ? 'Ativo' : 'Inativo'}
                    </Button>
                  </TableCell>
                  <TableCell>
                    {new Date(equipmentType.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(equipmentType)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(equipmentType.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EquipmentTypeManager;
