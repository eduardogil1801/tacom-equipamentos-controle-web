
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/Auth/LoginForm';
import RegisterForm from '@/components/Auth/RegisterForm';
import Header from '@/components/Layout/Header';
import Dashboard from '@/components/Dashboard/Dashboard';
import EquipmentList from '@/components/Equipment/EquipmentList';
import CompanyList from '@/components/Company/CompanyList';

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
      case 'equipments':
        return <EquipmentList />;
      case 'companies':
        return <CompanyList />;
      case 'dashboard':
        return <Dashboard />;
      case 'reports':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
            <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
              <p className="text-gray-600">Funcionalidade de relatórios em desenvolvimento</p>
              <p className="text-sm text-gray-500 mt-2">Em breve: Exportação para Excel e CSV</p>
            </div>
          </div>
        );
      case 'protocol':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Protocolo de Entrega</h1>
            <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
              <p className="text-gray-600">Funcionalidade de protocolo em desenvolvimento</p>
              <p className="text-sm text-gray-500 mt-2">Em breve: Geração e impressão de protocolos</p>
            </div>
          </div>
        );
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
