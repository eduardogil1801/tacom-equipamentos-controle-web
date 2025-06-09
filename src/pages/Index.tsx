
import React, { useState, useEffect } from 'react';
import AuthPage from '@/components/Auth/AuthPage';
import Dashboard from '@/components/Dashboard/Dashboard';
import EquipmentList from '@/components/Equipment/EquipmentList';
import FleetManagement from '@/components/Fleet/FleetManagement';
import CompanyManager from '@/components/Company/CompanyManager';
import ReportsPage from '@/components/Reports/ReportsPage';
import SettingsPage from '@/components/Settings/SettingsPage';
import MaintenanceTypeManager from '@/components/Maintenance/MaintenanceTypeManager';
import ProtocolPage from '@/components/Protocol/ProtocolPage';
import ResponsiveHeader from '@/components/Layout/ResponsiveHeader';
import ChatFloat from '@/components/Chat/ChatFloat';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, isAuthenticated } = useAuth();
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
    // Prevenir mudanças de página desnecessárias
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'equipment':
        return <EquipmentList />;
      case 'fleet':
        return <FleetManagement />;
      case 'companies':
        return <CompanyManager />;
      case 'maintenance':
        return <MaintenanceTypeManager />;
      case 'protocol':
        return <ProtocolPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

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
