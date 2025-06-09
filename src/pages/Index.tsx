import React, { useState } from 'react';
import LoginForm from '@/components/Auth/LoginForm';
import Dashboard from '@/components/Dashboard/Dashboard';
import EquipmentList from '@/components/Equipment/EquipmentList';
import FleetManagement from '@/components/Fleet/FleetManagement';
import ReportsPage from '@/components/Reports/ReportsPage';
import SettingsPage from '@/components/Settings/SettingsPage';
import Header from '@/components/Layout/Header';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!isAuthenticated) {
    return <LoginForm />;
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
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage={currentPage} onPageChange={handlePageChange} />
      <main className="flex-1">
        {renderPage()}
      </main>
    </div>
  );
};

export default Index;
