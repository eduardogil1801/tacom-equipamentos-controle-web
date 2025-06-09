
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Shield, Save } from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  sobrenome: string;
  username: string;
  user_profiles: {
    user_type: 'administrador' | 'operacional';
  };
}

interface Permission {
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const modules = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'equipments', label: 'Equipamentos' },
  { key: 'companies', label: 'Empresas' },
  { key: 'reports', label: 'Relatórios' },
  { key: 'fleet', label: 'Frota' },
  { key: 'protocol', label: 'Protocolo' },
  { key: 'users', label: 'Usuários' },
  { key: 'settings', label: 'Configurações' }
];

const PermissionManagement: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadUserPermissions(selectedUserId);
    }
  }, [selectedUserId]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select(`
          id,
          nome,
          sobrenome,
          username,
          user_profiles!inner(user_type)
        `)
        .eq('user_profiles.user_type', 'operacional')
        .eq('ativo', true)
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
    }
  };

  const loadUserPermissions = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Criar array de permissões com todos os módulos
      const userPermissions = modules.map(module => {
        const existingPermission = data?.find(p => p.module_name === module.key);
        return {
          module_name: module.key,
          can_view: existingPermission?.can_view || false,
          can_create: existingPermission?.can_create || false,
          can_edit: existingPermission?.can_edit || false,
          can_delete: existingPermission?.can_delete || false
        };
      });

      setPermissions(userPermissions);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar permissões.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = (moduleName: string, action: string, value: boolean) => {
    setPermissions(prev => prev.map(permission => 
      permission.module_name === moduleName
        ? { ...permission, [action]: value }
        : permission
    ));
  };

  const savePermissions = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    try {
      // Deletar permissões existentes
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', selectedUserId);

      // Inserir novas permissões
      const permissionsToInsert = permissions.map(permission => ({
        user_id: selectedUserId,
        module_name: permission.module_name,
        can_view: permission.can_view,
        can_create: permission.can_create,
        can_edit: permission.can_edit,
        can_delete: permission.can_delete
      }));

      const { error } = await supabase
        .from('user_permissions')
        .insert(permissionsToInsert);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Permissões salvas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar permissões.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Shield className="h-6 w-6" />
        Gerenciamento de Permissões
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Configurar Permissões de Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecionar Usuário</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um usuário operacional" />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.nome} {user.sobrenome} ({user.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedUserId && (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Módulo</TableHead>
                      <TableHead className="text-center">Visualizar</TableHead>
                      <TableHead className="text-center">Criar</TableHead>
                      <TableHead className="text-center">Editar</TableHead>
                      <TableHead className="text-center">Excluir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map(module => {
                      const permission = permissions.find(p => p.module_name === module.key);
                      if (!permission) return null;

                      return (
                        <TableRow key={module.key}>
                          <TableCell className="font-medium">{module.label}</TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={permission.can_view}
                              onCheckedChange={(checked) => 
                                updatePermission(module.key, 'can_view', checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={permission.can_create}
                              onCheckedChange={(checked) => 
                                updatePermission(module.key, 'can_create', checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={permission.can_edit}
                              onCheckedChange={(checked) => 
                                updatePermission(module.key, 'can_edit', checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={permission.can_delete}
                              onCheckedChange={(checked) => 
                                updatePermission(module.key, 'can_delete', checked as boolean)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={savePermissions} 
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Permissões'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PermissionManagement;
