
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Users, Plus, Edit, Trash2, Key } from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  username: string;
  ativo: boolean;
  must_change_password: boolean;
  is_temp_password: boolean;
  user_profiles: {
    user_type: 'administrador' | 'operacional';
  };
}

const UserManagement: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    username: '',
    user_type: 'operacional' as 'administrador' | 'operacional'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          *,
          user_profiles!inner(user_type)
        `)
        .order('nome');

      if (error) throw error;
      setUsuarios(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.sobrenome || !formData.email || !formData.username) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingUser) {
        // Atualizar usuário existente
        const { error: userError } = await supabase
          .from('usuarios')
          .update({
            nome: formData.nome,
            sobrenome: formData.sobrenome,
            email: formData.email,
            username: formData.username
          })
          .eq('id', editingUser.id);

        if (userError) throw userError;

        // Atualizar tipo de usuário
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            user_type: formData.user_type
          })
          .eq('user_id', editingUser.id);

        if (profileError) throw profileError;

        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso!",
        });
      } else {
        // Criar novo usuário
        const { data: newUser, error: userError } = await supabase
          .from('usuarios')
          .insert({
            nome: formData.nome,
            sobrenome: formData.sobrenome,
            email: formData.email,
            username: formData.username,
            senha: '12345678', // Senha temporária
            must_change_password: true,
            is_temp_password: true
          })
          .select()
          .single();

        if (userError) throw userError;

        // Criar perfil do usuário
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: newUser.id,
            user_type: formData.user_type
          });

        if (profileError) throw profileError;

        toast({
          title: "Sucesso",
          description: "Usuário criado com sucesso! Senha temporária: 12345678",
        });
      }

      setIsDialogOpen(false);
      setEditingUser(null);
      setFormData({
        nome: '',
        sobrenome: '',
        email: '',
        username: '',
        user_type: 'operacional'
      });
      loadUsers();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar usuário.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (user: Usuario) => {
    setEditingUser(user);
    setFormData({
      nome: user.nome,
      sobrenome: user.sobrenome,
      email: user.email,
      username: user.username,
      user_type: user.user_profiles.user_type
    });
    setIsDialogOpen(true);
  };

  const handleResetPassword = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          senha: '12345678',
          must_change_password: true,
          is_temp_password: true
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Senha resetada para: 12345678",
      });
      loadUsers();
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      toast({
        title: "Erro",
        description: "Erro ao resetar senha.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          ativo: !currentStatus
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`,
      });
      loadUsers();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar status do usuário.",
        variant: "destructive",
      });
    }
  };

  const openNewUserDialog = () => {
    setEditingUser(null);
    setFormData({
      nome: '',
      sobrenome: '',
      email: '',
      username: '',
      user_type: 'operacional'
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="h-6 w-6" />
          Gerenciamento de Usuários
        </h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewUserDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sobrenome">Sobrenome *</Label>
                  <Input
                    id="sobrenome"
                    value={formData.sobrenome}
                    onChange={(e) => setFormData(prev => ({ ...prev, sobrenome: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user_type">Tipo de Usuário *</Label>
                <Select value={formData.user_type} onValueChange={(value: 'administrador' | 'operacional') => setFormData(prev => ({ ...prev, user_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operacional">Operacional</SelectItem>
                    <SelectItem value="administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">
                  {editingUser ? 'Atualizar' : 'Criar'} Usuário
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Carregando usuários...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.nome} {user.sobrenome}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.user_profiles.user_type === 'administrador' ? 'default' : 'secondary'}>
                        {user.user_profiles.user_type === 'administrador' ? 'Administrador' : 'Operacional'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.ativo ? 'default' : 'destructive'}>
                          {user.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {user.must_change_password && (
                          <Badge variant="outline">Precisa alterar senha</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResetPassword(user.id)}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={user.ativo ? "destructive" : "default"}
                          size="sm"
                          onClick={() => handleToggleStatus(user.id, user.ativo)}
                        >
                          {user.ativo ? <Trash2 className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
