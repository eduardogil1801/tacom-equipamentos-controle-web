import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Users, 
  Building2, 
  Wrench, 
  Package,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  FileText,
  Shield
} from 'lucide-react';
import MovementTypeManager from '@/components/Settings/MovementTypeManager';
import StateManager from '@/components/Settings/StateManager';
import EquipmentTypeManager from '@/components/Settings/EquipmentTypeManager';
import MaintenanceRulesManager from '@/components/Settings/MaintenanceRulesManager';
import UserManagement from '@/components/Users/UserManagement';
import PermissionManagement from '@/components/Users/PermissionManagement';
import ReportPermissionManagement from '@/components/Users/ReportPermissionManagement';
import CompanyList from '@/components/Company/CompanyList';
import { useAuth } from '@/hooks/useHybridAuth';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('estados');

  // Verificar se é administrador
  if (user?.userType !== 'administrador') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-96">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <Shield className="h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">
                Acesso Restrito
              </h2>
              <p className="text-gray-500">
                Apenas administradores podem acessar as configurações do sistema.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7 mb-6">
          <TabsTrigger value="estados" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Estados
          </TabsTrigger>
          <TabsTrigger value="tipos-equipamento" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Tipos de Equipamento
          </TabsTrigger>
          <TabsTrigger value="tipos-movimentacao" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Tipos de Movimentação
          </TabsTrigger>
          <TabsTrigger value="empresas" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresas
          </TabsTrigger>
          <TabsTrigger value="manutencao" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Manutenção
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="estados" className="space-y-6">
          <StateManager />
        </TabsContent>

        <TabsContent value="tipos-equipamento" className="space-y-6">
          <EquipmentTypeManager />
        </TabsContent>

        <TabsContent value="tipos-movimentacao" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    <Wrench className="h-6 w-6" />
                    Gerenciamento de Tipos de Movimentação e Defeitos
                  </CardTitle>
                  <p className="text-gray-600 mt-2">
                    Configure os tipos de manutenção e defeitos para movimentações de equipamentos
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    Defeitos Reclamados
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-orange-500" />
                    Defeitos Encontrados
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <MovementTypeManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="empresas" className="space-y-6">
          <CompanyList />
        </TabsContent>

        <TabsContent value="manutencao" className="space-y-6">
          <MaintenanceRulesManager />
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="permissoes" className="space-y-6">
          <PermissionManagement />
          
          {/* Separar em uma seção própria para relatórios */}
          <ReportPermissionManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
