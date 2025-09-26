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
  CheckCircle2
} from 'lucide-react';
import MovementTypeManager from '@/components/Settings/MovementTypeManager';
// Importar outros componentes de configuração conforme necessário

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('movement-types');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="movement-types" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Tipos de Movimentação
          </TabsTrigger>
          <TabsTrigger value="equipment-types" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Tipos de Equipamento
          </TabsTrigger>
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Empresas
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movement-types" className="space-y-6">
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

        <TabsContent value="equipment-types" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Package className="h-6 w-6" />
                Tipos de Equipamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Componente para gerenciar tipos de equipamento */}
              <p className="text-gray-500">Configuração de tipos de equipamento em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Building2 className="h-6 w-6" />
                Empresas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Componente para gerenciar empresas */}
              <p className="text-gray-500">Configuração de empresas em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Users className="h-6 w-6" />
                Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Componente para gerenciar usuários */}
              <p className="text-gray-500">Configuração de usuários em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Settings className="h-6 w-6" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Outras configurações do sistema */}
              <p className="text-gray-500">Configurações gerais do sistema em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;