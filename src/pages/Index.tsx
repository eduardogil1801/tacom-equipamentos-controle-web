
import React, { useState } from 'react';
import AuthPage from '@/components/Auth/AuthPage';
import Dashboard from '@/components/Dashboard/Dashboard';
import EquipmentList from '@/components/Equipment/EquipmentList';
import FleetManagement from '@/components/Fleet/FleetManagement';
import CompanyManager from '@/components/Company/CompanyManager';
import ReportsPage from '@/components/Reports/ReportsPage';
import SettingsPage from '@/components/Settings/SettingsPage';
import ResponsiveHeader from '@/components/Layout/ResponsiveHeader';
import ChatFloat from '@/components/Chat/ChatFloat';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'equipment':
        return <EquipmentList />;
      case 'fleet':
        return <FleetManagement />;
      case 'companies':
        return <CompanyManager />;
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
