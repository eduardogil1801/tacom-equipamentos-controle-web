
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Users, 
  Shield, 
  Upload,
  Download
} from 'lucide-react';
import UserManagement from '../Users/UserManagement';
import PermissionManagement from '../Users/PermissionManagement';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type SettingsView = 'menu' | 'users' | 'import-export';

const SettingsPage = () => {
  const [currentView, setCurrentView] = useState<SettingsView>('menu');
  const { user, checkPermission } = useAuth();

  const handleBulkImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Verificar se as colunas estão corretas
        const requiredColumns = ['tipo', 'numero_serie', 'data_entrada', 'id_empresa', 'status', 'estado'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
          toast({
            title: "Erro no arquivo CSV",
            description: `Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}`,
            variant: "destructive",
          });
          return;
        }

        try {
          const equipments = [];
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(',').map(v => v.trim());
              const equipment: any = {};
              
              headers.forEach((header, index) => {
                equipment[header] = values[index];
              });
              
              equipments.push(equipment);
            }
          }

          const { error } = await supabase
            .from('equipamentos')
            .insert(equipments);

          if (error) throw error;

          toast({
            title: "Sucesso",
            description: `${equipments.length} equipamentos importados com sucesso!`,
          });
        } catch (error) {
          console.error('Erro na importação:', error);
          toast({
            title: "Erro",
            description: "Erro ao importar equipamentos",
            variant: "destructive",
          });
        }
      }
    };
    input.click();
  };

  const handleExportTemplate = () => {
    const headers = ['tipo', 'numero_serie', 'data_entrada', 'id_empresa', 'status', 'estado', 'modelo'];
    const csvContent = headers.join(',') + '\n';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_equipamentos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'users':
        return (
          <div className="space-y-6">
            <UserManagement />
            <PermissionManagement />
          </div>
        );
      case 'import-export':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Importação e Exportação de Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Importar Equipamentos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Importe equipamentos em massa através de um arquivo CSV.
                        O arquivo deve conter as colunas: tipo, numero_serie, data_entrada, id_empresa, status, estado, modelo
                      </p>
                      <div className="space-y-2">
                        <Button 
                          onClick={handleExportTemplate}
                          variant="outline" 
                          className="w-full"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Template CSV
                        </Button>
                        <Button 
                          onClick={handleBulkImport}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Importar CSV
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Instruções</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600 space-y-2">
                        <p><strong>Colunas obrigatórias:</strong></p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>tipo: Tipo do equipamento</li>
                          <li>numero_serie: Número de série único</li>
                          <li>data_entrada: Data no formato YYYY-MM-DD</li>
                          <li>id_empresa: ID da operadora (UUID)</li>
                          <li>status: disponivel, em_uso, manutencao, defeito</li>
                          <li>estado: novo, usado, recondicionado</li>
                          <li>modelo: Modelo do equipamento (opcional)</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
              <p className="text-gray-600">Gerencie as configurações do sistema</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user?.userType === 'administrador' && (
                <>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('users')}>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg">Usuários e Permissões</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">Gerencie usuários, perfis e permissões do sistema</p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('import-export')}>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <Upload className="h-4 w-4 text-green-600" />
                      </div>
                      <CardTitle className="text-lg">Importação de Dados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">Importe dados em massa através de arquivos CSV</p>
                    </CardContent>
                  </Card>
                </>
              )}

              {user?.userType !== 'administrador' && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Você não tem permissão para acessar as configurações do sistema.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {currentView !== 'menu' && (
          <div className="mb-6">
            <Button 
              variant="outline" 
              onClick={() => setCurrentView('menu')}
              className="mb-4"
            >
              ← Voltar ao Menu
            </Button>
          </div>
        )}
        {renderContent()}
      </div>
    </div>
  );
};

export default SettingsPage;
