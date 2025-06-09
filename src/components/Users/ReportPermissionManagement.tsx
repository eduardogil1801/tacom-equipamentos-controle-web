
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { FileText, Save } from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  sobrenome: string;
  username: string;
  user_profiles: {
    user_type: 'administrador' | 'operacional';
  };
}

interface ReportPermission {
  module_name: string;
  can_view: boolean;
}

const reportModules = [
  { key: 'companies-report', label: 'Relatório de Empresas' },
  { key: 'equipment-distribution-report', label: 'Relatório de Distribuição de Equipamentos' },
  { key: 'equipment-history-report', label: 'Relatório de Histórico de Equipamentos' },
  { key: 'equipment-status-report', label: 'Relatório de Status de Equipamentos' },
  { key: 'fleet-report', label: 'Relatório de Frota' },
  { key: 'inventory-report', label: 'Relatório de Inventário' },
  { key: 'inventory-stock-report', label: 'Relatório de Estoque' },
  { key: 'maintenance-report', label: 'Relatório de Manutenção' },
  { key: 'monthly-report', label: 'Relatório Mensal' },
  { key: 'movements-report', label: 'Relatório de Movimentações' }
];

const ReportPermissionManagement: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [permissions, setPermissions] = useState<ReportPermission[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadUserReportPermissions(selectedUserId);
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

  const loadUserReportPermissions = async (userId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', userId)
        .in('module_name', reportModules.map(r => r.key));

      if (error) throw error;

      // Criar array de permissões com todos os módulos de relatório
      const userPermissions = reportModules.map(module => {
        const existingPermission = data?.find(p => p.module_name === module.key);
        return {
          module_name: module.key,
          can_view: existingPermission?.can_view || false
        };
      });

      setPermissions(userPermissions);
    } catch (error) {
      console.error('Erro ao carregar permissões de relatórios:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar permissões de relatórios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePermission = (moduleName: string, value: boolean) => {
    setPermissions(prev => prev.map(permission => 
      permission.module_name === moduleName
        ? { ...permission, can_view: value }
        : permission
    ));
  };

  const saveReportPermissions = async () => {
    if (!selectedUserId) return;

    setLoading(true);
    try {
      // Deletar permissões de relatórios existentes
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', selectedUserId)
        .in('module_name', reportModules.map(r => r.key));

      // Inserir novas permissões de relatórios
      const permissionsToInsert = permissions
        .filter(permission => permission.can_view) // Só inserir se tiver permissão
        .map(permission => ({
          user_id: selectedUserId,
          module_name: permission.module_name,
          can_view: permission.can_view,
          can_create: false,
          can_edit: false,
          can_delete: false
        }));

      if (permissionsToInsert.length > 0) {
        const { error } = await supabase
          .from('user_permissions')
          .insert(permissionsToInsert);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: "Permissões de relatórios salvas com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar permissões de relatórios:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar permissões de relatórios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <FileText className="h-6 w-6" />
        Permissões Específicas de Relatórios
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Configurar Acesso a Relatórios por Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Selecionar Usuário Operacional</label>
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
                      <TableHead>Relatório</TableHead>
                      <TableHead className="text-center">Pode Visualizar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportModules.map(module => {
                      const permission = permissions.find(p => p.module_name === module.key);
                      if (!permission) return null;

                      return (
                        <TableRow key={module.key}>
                          <TableCell className="font-medium">{module.label}</TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={permission.can_view}
                              onCheckedChange={(checked) => 
                                updatePermission(module.key, checked as boolean)
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
                  onClick={saveReportPermissions} 
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Permissões de Relatórios'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportPermissionManagement;
