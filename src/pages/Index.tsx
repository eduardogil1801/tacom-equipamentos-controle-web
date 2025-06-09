
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/Auth/LoginForm';
import RegisterForm from '@/components/Auth/RegisterForm';
import ChangePasswordForm from '@/components/Auth/ChangePasswordForm';
import Header from '@/components/Layout/Header';
import Dashboard from '@/components/Dashboard/Dashboard';
import EquipmentList from '@/components/Equipment/EquipmentList';
import CompanyList from '@/components/Company/CompanyList';
import ProtocolPage from '@/components/Protocol/ProtocolPage';
import SettingsPage from '@/components/Settings/SettingsPage';
import UserManagement from '@/components/Users/UserManagement';
import PermissionManagement from '@/components/Users/PermissionManagement';
import InventoryStockReport from '@/components/Reports/InventoryStockReport';
import MovementsReport from '@/components/Reports/MovementsReport';
import EquipmentHistoryDetailReport from '@/components/Reports/EquipmentHistoryDetailReport';
import FleetManagement from '@/components/Fleet/FleetManagement';

const Index = () => {
  const { user, checkPermission } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Se não estiver logado, mostrar tela de login
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

  // Se usuário precisa alterar senha, mostrar tela de mudança de senha
  if (user.mustChangePassword || user.isTempPassword) {
    return <ChangePasswordForm />;
  }

  const renderPage = () => {
    // Verificar permissões antes de renderizar cada página
    switch (currentPage) {
      case 'dashboard':
        if (!checkPermission('dashboard', 'view')) {
          return <div className="text-center py-8">Acesso negado a esta seção.</div>;
        }
        return <Dashboard />;
      
      case 'equipments':
        if (!checkPermission('equipments', 'view')) {
          return <div className="text-center py-8">Acesso negado a esta seção.</div>;
        }
        return <EquipmentList />;
      
      case 'companies':
        if (!checkPermission('companies', 'view')) {
          return <div className="text-center py-8">Acesso negado a esta seção.</div>;
        }
        return <CompanyList />;
      
      case 'users':
        if (!checkPermission('users', 'view')) {
          return <div className="text-center py-8">Acesso negado a esta seção.</div>;
        }
        return <UserManagement />;
      
      case 'permissions':
        if (user.userType !== 'administrador') {
          return <div className="text-center py-8">Acesso negado a esta seção.</div>;
        }
        return <PermissionManagement />;
      
      case 'settings':
        if (!checkPermission('settings', 'view')) {
          return <div className="text-center py-8">Acesso negado a esta seção.</div>;
        }
        return <SettingsPage />;
      
      case 'reports-inventory':
        if (!checkPermission('reports', 'view')) {
          return <div className="text-center py-8">Acesso negado a esta seção.</div>;
        }
        return <InventoryStockReport />;
      
      case 'reports-movements':
        if (!checkPermission('reports', 'view')) {
          return <div className="text-center py-8">Acesso negado a esta seção.</div>;
        }
        return <MovementsReport />;
      
      case 'reports-equipment-history':
        if (!checkPermission('reports', 'view')) {
          return <div className="text-center py-8">Acesso negado a esta seção.</div>;
        }
        return <EquipmentHistoryDetailReport />;
      
      case 'fleet-management':
        if (!checkPermission('fleet', 'view')) {
          return <div className="text-center py-8">Acesso negado a esta seção.</div>;
        }
        return <FleetManagement />;
      
      case 'protocol':
        if (!checkPermission('protocol', 'view')) {
          return <div className="text-center py-8">Acesso negado a esta seção.</div>;
        }
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
