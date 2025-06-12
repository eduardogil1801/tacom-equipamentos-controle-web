
import React, { useState, useEffect } from 'react';
import AuthPage from '@/components/Auth/AuthPage';
import Dashboard from '@/components/Dashboard/Dashboard';
import EquipmentList from '@/components/Equipment/EquipmentList';
import EquipmentMovement from '@/components/Equipment/EquipmentMovement';
import MovementPage from '@/components/Equipment/MovementPage';
import FleetManagement from '@/components/Fleet/FleetManagement';
import CompanyManager from '@/components/Company/CompanyManager';
import ReportsPage from '@/components/Reports/ReportsPage';
import SettingsPage from '@/components/Settings/SettingsPage';
import ProtocolPage from '@/components/Protocol/ProtocolPage';
import ResponsiveHeader from '@/components/Layout/ResponsiveHeader';
import ChatFloat from '@/components/Chat/ChatFloat';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Shield } from 'lucide-react';

const Index = () => {
  const { user, isAuthenticated, checkPermission } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Prevenir mudanças de página não intencionais
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Não mostrar aviso se estiver navegando normalmente
      return;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handlePageChange = (page: string) => {
    // Verificar se o usuário tem permissão para acessar a página
    const modulePermissions = {
      'dashboard': 'dashboard',
      'equipment': 'equipments',
      'movements': 'equipments',
      'new-movement': 'equipments',
      'fleet': 'fleet',
      'companies': 'companies',
      'protocol': 'protocol',
      'reports': 'reports',
      'settings': 'settings'
    };

    const moduleKey = modulePermissions[page as keyof typeof modulePermissions];
    
    // Administradores têm acesso a tudo
    if (user?.userType === 'administrador' || !moduleKey) {
      setCurrentPage(page);
      return;
    }
    
    // Verificar permissão para usuários operacionais
    if (checkPermission(moduleKey, 'view')) {
      setCurrentPage(page);
    } else {
      // Se não tem permissão, redirecionar para dashboard
      setCurrentPage('dashboard');
    }
  };

  const renderPage = () => {
    // Verificar permissões antes de renderizar cada página
    const hasPermission = (module: string) => {
      return user?.userType === 'administrador' || checkPermission(module, 'view');
    };

    switch (currentPage) {
      case 'equipment':
        if (!hasPermission('equipments')) {
          return renderNoPermission();
        }
        return <EquipmentList />;
      case 'movements':
        if (!hasPermission('equipments')) {
          return renderNoPermission();
        }
        return <EquipmentMovement />;
      case 'new-movement':
        if (!hasPermission('equipments')) {
          return renderNoPermission();
        }
        return <MovementPage />;
      case 'fleet':
        if (!hasPermission('fleet')) {
          return renderNoPermission();
        }
        return <FleetManagement />;
      case 'companies':
        if (!hasPermission('companies')) {
          return renderNoPermission();
        }
        return <CompanyManager />;
      case 'protocol':
        if (!hasPermission('protocol')) {
          return renderNoPermission();
        }
        return <ProtocolPage />;
      case 'reports':
        if (!hasPermission('reports')) {
          return renderNoPermission();
        }
        return <ReportsPage />;
      case 'settings':
        if (!hasPermission('settings')) {
          return renderNoPermission();
        }
        return <SettingsPage />;
      default:
        // Dashboard sempre é acessível
        return <Dashboard />;
    }
  };

  const renderNoPermission = () => (
    <div className="flex items-center justify-center min-h-96 p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <Shield className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Acesso Negado
          </h2>
          <p className="text-gray-500">
            Você não possui permissão para acessar esta página. 
            Entre em contato com o administrador do sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <ResponsiveHeader currentPage={currentPage} onPageChange={handlePageChange} />
      <main className="flex-1 w-full">
        <div className="w-full overflow-x-auto">
          {renderPage()}
        </div>
      </main>
      <ChatFloat />
    </div>
  );
};

export default Index;
