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

// Componentes placeholder para as outras abas
const EstadosManager = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-3">
        <MapPin className="h-6 w-6" />
        Gerenciar Estados
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-500">Gerenciamento de estados em desenvolvimento...</p>
    </CardContent>
  </Card>
);

const TiposEquipamentoManager = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-3">
        <Package className="h-6 w-6" />
        Tipos de Equipamento
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-500">Configuração de tipos de equipamento em desenvolvimento...</p>
    </CardContent>
  </Card>
);

const EmpresasManager = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-3">
        <Building2 className="h-6 w-6" />
        Empresas
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-500">Configuração de empresas em desenvolvimento...</p>
    </CardContent>
  </Card>
);

const ManutencaoManager = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-3">
        <Wrench className="h-6 w-6" />
        Manutenção
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-500">Configuração de manutenção em desenvolvimento...</p>
    </CardContent>
  </Card>
);

const UsuariosManager = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-3">
        <Users className="h-6 w-6" />
        Gerenciamento de Usuários
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-500">Gerenciamento de usuários em desenvolvimento...</p>
    </CardContent>
  </Card>
);

const PermissoesManager = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-3">
        <Shield className="h-6 w-6" />
        Gerenciamento de Permissões
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-500">Gerenciamento de permissões em desenvolvimento...</p>
    </CardContent>
  </Card>
);

const RelatoriosManager = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-3">
        <FileText className="h-6 w-6" />
        Permissões Específicas de Relatórios
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-gray-500">Configuração de relatórios em desenvolvimento...</p>
    </CardContent>
  </Card>
);

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tipos-movimentacao');

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
          <EstadosManager />
        </TabsContent>

        <TabsContent value="tipos-equipamento" className="space-y-6">
          <TiposEquipamentoManager />
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
          <EmpresasManager />
        </TabsContent>

        <TabsContent value="manutencao" className="space-y-6">
          <ManutencaoManager />
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-6">
          <UsuariosManager />
        </TabsContent>

        <TabsContent value="permissoes" className="space-y-6">
          <PermissoesManager />
          
          {/* Separar em uma seção própria para relatórios */}
          <RelatoriosManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;