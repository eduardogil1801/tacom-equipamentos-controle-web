import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash, Save, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MovementType {
  id?: string;
  codigo: string;
  descricao: string;
  categoria_defeito?: string | null;
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
    categoria_defeito: 'outro',
    ativo: true
  });
  const [hasNewFields, setHasNewFields] = useState(false);

  useEffect(() => {
    loadMovementTypes();
  }, []);

  // Auto-categorizar baseado no código
  const autoCategorizeCodigo = (codigo: string): 'defeito_reclamado' | 'defeito_encontrado' | 'outro' => {
    const codigoUpper = codigo.toUpperCase();
    if (codigoUpper.startsWith('DR')) {
      return 'defeito_reclamado';
    } else if (codigoUpper.startsWith('DE') || codigoUpper.startsWith('ER')) {
      return 'defeito_encontrado';
    }
    return 'outro';
  };

  // Atualizar categoria quando código muda
  const handleCodigoChange = (codigo: string) => {
    setFormData(prev => ({
      ...prev,
      codigo,
      categoria_defeito: autoCategorizeCodigo(codigo)
    }));
  };

  const loadMovementTypes = async () => {
    try {
      setLoading(true);
      
      // Primeiro, tentar carregar com o novo campo
      const { data, error } = await supabase
        .from('tipos_manutencao')
        .select('*')
        .order('categoria_defeito', { ascending: true })
        .order('descricao', { ascending: true });

      if (error) {
        console.warn('Erro ao carregar tipos (possivelmente campo categoria_defeito não existe):', error);
        // Fallback: carregar sem o campo categoria_defeito
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('tipos_manutencao')
          .select('id, codigo, descricao, ativo')
          .order('descricao', { ascending: true });
        
        if (fallbackError) throw fallbackError;
        
        const dataWithCategoria = (fallbackData || []).map(item => ({
          ...item,
          categoria_defeito: autoCategorizeCodigo(item.codigo)
        }));
        
        setMovementTypes(dataWithCategoria);
        setHasNewFields(false);
      } else {
        // Verificar se o campo categoria_defeito existe nos dados
        const hasCategoria = data && data.length > 0 && 'categoria_defeito' in data[0];
        setHasNewFields(hasCategoria);
        
        if (hasCategoria) {
          setMovementTypes(data || []);
        } else {
          // Adicionar categoria automaticamente baseada no código
          const dataWithCategoria = (data || []).map(item => ({
            ...item,
            categoria_defeito: autoCategorizeCodigo(item.codigo)
          }));
          setMovementTypes(dataWithCategoria);
        }
      }
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
      const dataToSave = {
        codigo: formData.codigo,
        descricao: formData.descricao,
        ativo: formData.ativo,
        ...(hasNewFields && { categoria_defeito: formData.categoria_defeito })
      };

      if (editingType && editingType.id) {
        const { error } = await supabase
          .from('tipos_manutencao')
          .update(dataToSave)
          .eq('id', editingType.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Tipo de movimentação atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('tipos_manutencao')
          .insert([dataToSave]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Tipo de movimentação criado com sucesso!",
        });
      }

      resetForm();
      loadMovementTypes();
    } catch (error: any) {
      console.error('Erro ao salvar tipo de movimentação:', error);
      
      // Verificar se é erro de código duplicado
      if (error?.code === '23505' && error?.message?.includes('codigo')) {
        toast({
          title: "Erro",
          description: "Já existe um tipo de movimentação com este código.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao salvar tipo de movimentação: " + (error.message || 'Erro desconhecido'),
          variant: "destructive",
        });
      }
    }
  };

  const handleEdit = (type: MovementType) => {
    setEditingType(type);
    setFormData({
      codigo: type.codigo,
      descricao: type.descricao,
      categoria_defeito: type.categoria_defeito || autoCategorizeCodigo(type.codigo),
      ativo: type.ativo ?? true
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Verificar se o tipo está sendo usado
      const { data: movimentacoes, error: checkError } = await supabase
        .from('movimentacoes')
        .select('id')
        .or(`tipo_manutencao_id.eq.${id}${hasNewFields ? `,defeito_reclamado_id.eq.${id},defeito_encontrado_id.eq.${id}` : ''}`)
        .limit(1);

      if (checkError) {
        console.warn('Erro ao verificar uso do tipo:', checkError);
        // Continuar com a exclusão mesmo com erro de verificação
      } else if (movimentacoes && movimentacoes.length > 0) {
        toast({
          title: "Erro",
          description: "Não é possível excluir este tipo pois ele está sendo usado em movimentações.",
          variant: "destructive",
        });
        return;
      }

      // Tentar excluir
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
    } catch (error: any) {
      console.error('Erro ao excluir tipo de movimentação:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir tipo de movimentação: " + (error.message || 'Erro desconhecido'),
        variant: "destructive",
      });
    }
  };

  const updateAllCategories = async () => {
    try {
      setLoading(true);
      
      // Atualizar todas as categorias baseado no código
      for (const type of movementTypes) {
        if (type.id) {
          const newCategoria = autoCategorizeCodigo(type.codigo);
          
          if (hasNewFields) {
            await supabase
              .from('tipos_manutencao')
              .update({ categoria_defeito: newCategoria })
              .eq('id', type.id);
          }
        }
      }

      toast({
        title: "Sucesso",
        description: "Categorias atualizadas automaticamente!",
      });
      
      loadMovementTypes();
    } catch (error) {
      console.error('Erro ao atualizar categorias:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar categorias automaticamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: '',
      descricao: '',
      categoria_defeito: 'outro',
      ativo: true
    });
    setEditingType(null);
    setShowForm(false);
  };

  const getCategoriaLabel = (categoria: string | undefined) => {
    switch (categoria) {
      case 'defeito_reclamado':
        return 'Defeito Reclamado (DR)';
      case 'defeito_encontrado':
        return 'Defeito Encontrado (DE/ER)';
      default:
        return 'Outro Defeito';
    }
  };

  const getCategoriaColor = (categoria: string | undefined) => {
    switch (categoria) {
      case 'defeito_reclamado':
        return 'bg-red-100 text-red-800';
      case 'defeito_encontrado':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        <h2 className="text-xl font-semibold">Tipos de Movimentação Cadastrados</h2>
        <div className="flex gap-2">
          {!hasNewFields && (
            <Button
              variant="outline"
              onClick={updateAllCategories}
              className="flex items-center gap-2"
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Auto-Categorizar
            </Button>
          )}
          <Button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Tipo
          </Button>
        </div>
      </div>

      {/* Aviso sobre migração */}
      {!hasNewFields && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">
                Migração Pendente
              </h3>
              <p className="text-sm text-yellow-700 mb-2">
                Execute a migração SQL para ativar os campos de "Defeito Reclamado" e "Defeito Encontrado".
              </p>
              <p className="text-xs text-yellow-600">
                Enquanto isso, as categorias são determinadas automaticamente pelo código: DR = Defeito Reclamado, DE/ER = Defeito Encontrado.
              </p>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingType ? 'Editar Tipo de Movimentação' : 'Novo Tipo de Movimentação'}
              <Button variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="codigo">Código *</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => handleCodigoChange(e.target.value)}
                    placeholder="Ex: DR001, DE001, ER001"
                    required
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    DR = Defeito Reclamado, DE/ER = Defeito Encontrado
                  </p>
                </div>

                <div>
                  <Label htmlFor="categoria_defeito">
                    Categoria do Defeito *
                    {!hasNewFields && (
                      <span className="text-blue-600 ml-2">(Auto)</span>
                    )}
                  </Label>
                  <Select
                    value={formData.categoria_defeito}
                    onValueChange={(value) => setFormData({...formData, categoria_defeito: value as any})}
                    disabled={!hasNewFields}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Categoria será definida automaticamente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="defeito_reclamado">Defeito Reclamado (DR)</SelectItem>
                      <SelectItem value="defeito_encontrado">Defeito Encontrado (DE/ER)</SelectItem>
                      <SelectItem value="outro">Outro Defeito</SelectItem>
                    </SelectContent>
                  </Select>
                  {!hasNewFields && (
                    <p className="text-xs text-blue-600 mt-1">
                      Categoria definida automaticamente pelo código
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Ex: Não liga, Placa principal danificada"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({...formData, ativo: e.target.checked})}
                />
                <Label htmlFor="ativo">Ativo</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex items-center gap-2" disabled={loading}>
                  <Save className="h-4 w-4" />
                  {editingType ? 'Atualizar' : 'Salvar'}
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
          <CardTitle>Lista de Tipos ({movementTypes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {movementTypes.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              Nenhum tipo de movimentação cadastrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movementTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-mono font-semibold">{type.codigo}</TableCell>
                    <TableCell>{type.descricao}</TableCell>
                    <TableCell>
                      <Badge className={getCategoriaColor(type.categoria_defeito)}>
                        {getCategoriaLabel(type.categoria_defeito)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={type.ativo ? "default" : "secondary"}>
                        {type.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Confirmar Exclusão
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o tipo "{type.descricao} ({type.codigo})"?
                                <br />
                                <strong>Esta ação não pode ser desfeita.</strong>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => type.id && handleDelete(type.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Seção de Ajuda */}
      <Card>
        <CardHeader>
          <CardTitle>Como usar as categorias de defeitos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge className="bg-red-100 text-red-800">Defeito Reclamado (DR)</Badge>
            <p className="text-sm">
              Defeitos reportados inicialmente pelo cliente. Use códigos <strong>DR001, DR002, etc.</strong>
              Aparecem no campo "Defeito Reclamado" nas movimentações.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge className="bg-orange-100 text-orange-800">Defeito Encontrado (DE/ER)</Badge>
            <p className="text-sm">
              Defeitos realmente identificados durante a manutenção. Use códigos <strong>DE001, ER001, etc.</strong>
              Aparecem no campo "Defeito Encontrado" nas movimentações.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge className="bg-gray-100 text-gray-800">Outro Defeito</Badge>
            <p className="text-sm">
              Outros tipos de manutenção que não se enquadram nas categorias acima.
              Use qualquer código que não comece com DR, DE ou ER.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MovementTypeManager;
        