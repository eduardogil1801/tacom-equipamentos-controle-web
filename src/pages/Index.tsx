
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/Auth/LoginForm';
import RegisterForm from '@/components/Auth/RegisterForm';
import Header from '@/components/Layout/Header';
import Dashboard from '@/components/Dashboard/Dashboard';
import EquipmentList from '@/components/Equipment/EquipmentList';
import CompanyList from '@/components/Company/CompanyList';
import ProtocolPage from '@/components/Protocol/ProtocolPage';
import InventoryReport from '@/components/Reports/InventoryReport';
import MovementsReport from '@/components/Reports/MovementsReport';
import CompaniesReport from '@/components/Reports/CompaniesReport';
import EquipmentStatusReport from '@/components/Reports/EquipmentStatusReport';
import EquipmentDistributionReport from '@/components/Reports/EquipmentDistributionReport';
import FleetReport from '@/components/Reports/FleetReport';
import MonthlyReport from '@/components/Reports/MonthlyReport';
import EquipmentHistoryReport from '@/components/Reports/EquipmentHistoryReport';

const Index = () => {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [currentPage, setCurrentPage] = useState('equipments');

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
      case 'equipments':
        return <EquipmentList />;
      case 'companies':
        return <CompanyList />;
      case 'dashboard':
        return <Dashboard />;
      case 'reports-inventory':
        return <InventoryReport />;
      case 'reports-movements':
        return <MovementsReport />;
      case 'reports-companies':
        return <CompaniesReport />;
      case 'reports-equipment-status':
        return <EquipmentStatusReport />;
      case 'reports-equipment-distribution':
        return <EquipmentDistributionReport />;
      case 'reports-fleet':
        return <FleetReport />;
      case 'reports-monthly':
        return <MonthlyReport />;
      case 'reports-equipment-history':
        return <EquipmentHistoryReport />;
      case 'protocol':
        return <ProtocolPage />;
      default:
        return <EquipmentList />;
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
