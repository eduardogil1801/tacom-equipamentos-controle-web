
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Users, Shield, FileText, Package } from 'lucide-react';
import UserManagement from '@/components/Users/UserManagement';
import PermissionManagement from '@/components/Users/PermissionManagement';
import ReportPermissionManagement from '@/components/Users/ReportPermissionManagement';
import StateManager from '@/components/Settings/StateManager';
import MaintenanceTypeManager from '@/components/Maintenance/MaintenanceTypeManager';
import { useAuth } from '@/hooks/useAuth';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('states');

  // Se não for administrador, não mostrar a página
  if (user?.userType !== 'administrador') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Acesso Restrito
              </h3>
              <p className="text-gray-500">
                Você não tem permissão para acessar as configurações do sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-8 w-8 text-gray-600" />
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="states" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Estados
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Manutenção
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissões
          </TabsTrigger>
          <TabsTrigger value="report-permissions" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="states">
          <StateManager />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceTypeManager />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionManagement />
        </TabsContent>

        <TabsContent value="report-permissions">
          <ReportPermissionManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
