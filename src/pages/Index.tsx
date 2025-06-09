
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/Auth/LoginForm';
import RegisterForm from '@/components/Auth/RegisterForm';
import Header from '@/components/Layout/Header';
import Dashboard from '@/components/Dashboard/Dashboard';
import EquipmentList from '@/components/Equipment/EquipmentList';
import CompanyList from '@/components/Company/CompanyList';
import ProtocolPage from '@/components/Protocol/ProtocolPage';
import SettingsPage from '@/components/Settings/SettingsPage';
import InventoryStockReport from '@/components/Reports/InventoryStockReport';
import MovementsReport from '@/components/Reports/MovementsReport';
import EquipmentHistoryDetailReport from '@/components/Reports/EquipmentHistoryDetailReport';
import FleetManagement from '@/components/Fleet/FleetManagement';

const Index = () => {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        {isLogin ? (
          <LoginForm onToggleForm={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onToggleForm={() => setIsLogin(true)} />
        )}
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'equipments':
        return <EquipmentList />;
      case 'companies':
        return <CompanyList />;
      case 'settings':
        return <SettingsPage />;
      case 'reports-inventory':
        return <InventoryStockReport />;
      case 'reports-movements':
        return <MovementsReport />;
      case 'reports-equipment-history':
        return <EquipmentHistoryDetailReport />;
      case 'fleet-management':
        return <FleetManagement />;
      case 'protocol':
        return <ProtocolPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderPage()}
      </main>
    </div>
  );
};

export default Index;
