
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  TrendingUp, 
  Package, 
  Users, 
  BarChart3, 
  Activity,
  Settings,
  Truck,
  ArrowUpDown,
  Wrench
} from 'lucide-react';
import InventoryReport from './InventoryReport';
import InventoryStockReport from './InventoryStockReport';
import EquipmentStatusReport from './EquipmentStatusReport';
import EquipmentDistributionReport from './EquipmentDistributionReport';
import EquipmentHistoryReport from './EquipmentHistoryReport';
import EquipmentHistoryDetailReport from './EquipmentHistoryDetailReport';
import CompaniesReport from './CompaniesReport';
import FleetReport from './FleetReport';
import MonthlyReport from './MonthlyReport';
import MaintenanceReport from './MaintenanceReport';
import MovementsReport from './MovementsReport';
import FleetForm from './FleetForm';
import MaintenanceTypeManager from '../Maintenance/MaintenanceTypeManager';

type ReportType = 
  | 'menu' 
  | 'inventory' 
  | 'stock' 
  | 'status' 
  | 'distribution' 
  | 'history' 
  | 'history-detail' 
  | 'companies'
  | 'fleet'
  | 'monthly'
  | 'maintenance'
  | 'movements'
  | 'fleet-form'
  | 'maintenance-types';

const ReportsPage = () => {
  const [currentView, setCurrentView] = useState<ReportType>('menu');

  const renderContent = () => {
    switch (currentView) {
      case 'inventory':
        return <InventoryReport />;
      case 'stock':
        return <InventoryStockReport />;
      case 'status':
        return <EquipmentStatusReport />;
      case 'distribution':
        return <EquipmentDistributionReport />;
      case 'history':
        return <EquipmentHistoryReport />;
      case 'history-detail':
        return <EquipmentHistoryDetailReport />;
      case 'companies':
        return <CompaniesReport />;
      case 'fleet':
        return <FleetReport />;
      case 'monthly':
        return <MonthlyReport />;
      case 'maintenance':
        return <MaintenanceReport />;
      case 'movements':
        return <MovementsReport />;
      case 'fleet-form':
        return <FleetForm />;
      case 'maintenance-types':
        return <MaintenanceTypeManager />;
      default:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios e Cadastros</h1>
              <p className="text-gray-600">Selecione um relatório ou cadastro para visualizar</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Relatórios de Equipamentos */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('inventory')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Relatório de Inventário</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Visualize o inventário completo de equipamentos com filtros avançados</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('stock')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Estoque de Equipamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Relatório detalhado do estoque atual por empresa e status</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('status')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                    <Activity className="h-4 w-4 text-yellow-600" />
                  </div>
                  <CardTitle className="text-lg">Status dos Equipamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Acompanhe o status atual de todos os equipamentos</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('distribution')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Distribuição de Equipamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Análise da distribuição por empresa e tipo</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('history')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="h-4 w-4 text-indigo-600" />
                  </div>
                  <CardTitle className="text-lg">Histórico de Equipamentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Histórico completo de movimentações</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('history-detail')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
                    <FileText className="h-4 w-4 text-teal-600" />
                  </div>
                  <CardTitle className="text-lg">Histórico Detalhado</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Histórico detalhado com análises avançadas</p>
                </CardContent>
              </Card>

              {/* Relatórios de Manutenção */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('maintenance')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <Wrench className="h-4 w-4 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">Relatório de Manutenção</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Equipamentos por tipo, empresa e status de manutenção</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('movements')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                    <ArrowUpDown className="h-4 w-4 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">Movimentações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Todas as movimentações de equipamentos com filtros</p>
                </CardContent>
              </Card>

              {/* Relatórios de Empresas */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('companies')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <Users className="h-4 w-4 text-gray-600" />
                  </div>
                  <CardTitle className="text-lg">Relatório de Empresas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Informações detalhadas sobre as empresas cadastradas</p>
                </CardContent>
              </Card>

              {/* Relatórios de Frota */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('fleet')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mr-3">
                    <Truck className="h-4 w-4 text-emerald-600" />
                  </div>
                  <CardTitle className="text-lg">Relatório de Frota</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Análise da frota por empresa e sistema</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('monthly')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center mr-3">
                    <BarChart3 className="h-4 w-4 text-cyan-600" />
                  </div>
                  <CardTitle className="text-lg">Relatório Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Relatórios mensais consolidados</p>
                </CardContent>
              </Card>

              {/* Cadastros */}
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('fleet-form')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Truck className="h-4 w-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Cadastro de Frota</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Adicionar informações de frota por empresa</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setCurrentView('maintenance-types')}>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <Settings className="h-4 w-4 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">Tipos de Manutenção</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Gerenciar tipos e códigos de manutenção</p>
                </CardContent>
              </Card>
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

export default ReportsPage;
