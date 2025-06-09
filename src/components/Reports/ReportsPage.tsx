
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Calendar, Building, Package, Truck, Wrench, BarChart3, TrendingUp, ArrowLeft } from 'lucide-react';
import CompaniesReport from './CompaniesReport';
import EquipmentDistributionReport from './EquipmentDistributionReport';
import EquipmentStatusReport from './EquipmentStatusReport';
import InventoryReport from './InventoryReport';
import InventoryStockReport from './InventoryStockReport';
import MaintenanceReport from './MaintenanceReport';
import MonthlyReport from './MonthlyReport';
import MovementsReport from './MovementsReport';
import FleetReport from './FleetReport';
import EquipmentHistoryReport from './EquipmentHistoryReport';
import { useReportPermissions } from '@/hooks/useReportPermissions';

const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const { hasReportPermission, loading } = useReportPermissions();

  const reports = [
    {
      id: 'companies-report',
      title: 'Relatório de Empresas',
      description: 'Visualize informações detalhadas sobre as empresas cadastradas',
      icon: Building,
      component: CompaniesReport
    },
    {
      id: 'equipment-distribution-report',
      title: 'Distribuição de Equipamentos',
      description: 'Análise da distribuição de equipamentos por empresa',
      icon: Package,
      component: EquipmentDistributionReport
    },
    {
      id: 'equipment-history-report',
      title: 'Histórico de Equipamentos',
      description: 'Histórico completo de movimentações dos equipamentos',
      icon: FileText,
      component: EquipmentHistoryReport
    },
    {
      id: 'equipment-status-report',
      title: 'Status dos Equipamentos',
      description: 'Relatório sobre o status atual dos equipamentos',
      icon: BarChart3,
      component: EquipmentStatusReport
    },
    {
      id: 'fleet-report',
      title: 'Relatório de Frota',
      description: 'Informações detalhadas sobre a frota de equipamentos',
      icon: Truck,
      component: FleetReport
    },
    {
      id: 'inventory-report',
      title: 'Relatório de Inventário',
      description: 'Controle de inventário e equipamentos disponíveis',
      icon: Package,
      component: InventoryReport
    },
    {
      id: 'inventory-stock-report',
      title: 'Estoque de Equipamentos',
      description: 'Controle de estoque e disponibilidade',
      icon: TrendingUp,
      component: InventoryStockReport
    },
    {
      id: 'maintenance-report',
      title: 'Relatório de Manutenção',
      description: 'Acompanhamento de manutenções realizadas',
      icon: Wrench,
      component: MaintenanceReport
    },
    {
      id: 'monthly-report',
      title: 'Relatório Mensal',
      description: 'Resumo mensal das atividades e estatísticas',
      icon: Calendar,
      component: MonthlyReport
    },
    {
      id: 'movements-report',
      title: 'Relatório de Movimentações',
      description: 'Histórico de todas as movimentações de equipamentos',
      icon: FileText,
      component: MovementsReport
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando permissões de relatórios...</p>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar relatórios baseado nas permissões
  const availableReports = reports.filter(report => hasReportPermission(report.id));

  if (activeReport) {
    const report = reports.find(r => r.id === activeReport);
    if (report) {
      const ReportComponent = report.component;
      return (
        <div className="space-y-6 p-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => setActiveReport(null)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar aos Relatórios</span>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
          </div>
          <ReportComponent />
        </div>
      );
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-2">
        <FileText className="h-8 w-8 text-gray-600" />
        <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
      </div>

      {availableReports.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum Relatório Disponível
              </h3>
              <p className="text-gray-500">
                Você não tem permissão para acessar nenhum relatório ou o administrador ainda não configurou suas permissões.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableReports.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-red-500" />
                    <span>{report.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm">{report.description}</p>
                  <Button
                    onClick={() => setActiveReport(report.id)}
                    className="w-full flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Gerar Relatório</span>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
