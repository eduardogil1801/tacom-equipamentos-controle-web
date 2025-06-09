
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Package, 
  Building2, 
  Activity, 
  TrendingUp, 
  Clock, 
  BarChart3,
  Archive,
  Wrench,
  Users,
  Truck,
  Calendar
} from 'lucide-react';

// Import all report components
import CompaniesReport from './CompaniesReport';
import EquipmentStatusReport from './EquipmentStatusReport';
import EquipmentDistributionReport from './EquipmentDistributionReport';
import MovementsReport from './MovementsReport';
import InventoryReport from './InventoryReport';
import EquipmentHistoryReport from './EquipmentHistoryReport';
import FleetReport from './FleetReport';
import MaintenanceReport from './MaintenanceReport';
import MonthlyReport from './MonthlyReport';
import InventoryStockReport from './InventoryStockReport';
import EquipmentHistoryDetailReport from './EquipmentHistoryDetailReport';

interface ReportItem {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  component: React.ComponentType;
}

const reports: ReportItem[] = [
  {
    key: 'companies',
    title: 'Empresas',
    description: 'Relatório detalhado das empresas cadastradas no sistema',
    icon: <Building2 className="h-6 w-6" />,
    component: CompaniesReport
  },
  {
    key: 'equipment-status',
    title: 'Status dos Equipamentos',
    description: 'Visualização do status atual de todos os equipamentos',
    icon: <Package className="h-6 w-6" />,
    component: EquipmentStatusReport
  },
  {
    key: 'equipment-distribution',
    title: 'Distribuição de Equipamentos',
    description: 'Análise da distribuição de equipamentos por empresa e região',
    icon: <BarChart3 className="h-6 w-6" />,
    component: EquipmentDistributionReport
  },
  {
    key: 'movements',
    title: 'Movimentações',
    description: 'Histórico completo de movimentações de equipamentos',
    icon: <Activity className="h-6 w-6" />,
    component: MovementsReport
  },
  {
    key: 'inventory',
    title: 'Inventário',
    description: 'Controle de estoque e disponibilidade de equipamentos',
    icon: <Archive className="h-6 w-6" />,
    component: InventoryReport
  },
  {
    key: 'equipment-history',
    title: 'Histórico de Equipamentos',
    description: 'Rastreamento detalhado do histórico de cada equipamento',
    icon: <Clock className="h-6 w-6" />,
    component: EquipmentHistoryReport
  },
  {
    key: 'fleet',
    title: 'Frota',
    description: 'Relatório consolidado da frota de equipamentos por operadora',
    icon: <Truck className="h-6 w-6" />,
    component: FleetReport
  },
  {
    key: 'maintenance',
    title: 'Manutenções',
    description: 'Controle e acompanhamento das manutenções realizadas',
    icon: <Wrench className="h-6 w-6" />,
    component: MaintenanceReport
  },
  {
    key: 'monthly',
    title: 'Relatório Mensal',
    description: 'Consolidação mensal de dados e estatísticas do sistema',
    icon: <Calendar className="h-6 w-6" />,
    component: MonthlyReport
  },
  {
    key: 'inventory-stock',
    title: 'Estoque Detalhado',
    description: 'Análise detalhada do estoque com níveis críticos',
    icon: <TrendingUp className="h-6 w-6" />,
    component: InventoryStockReport
  },
  {
    key: 'equipment-history-detail',
    title: 'Histórico Detalhado',
    description: 'Análise aprofundada do histórico de equipamentos específicos',
    icon: <FileText className="h-6 w-6" />,
    component: EquipmentHistoryDetailReport
  }
];

const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<string | null>(null);

  const handleReportSelect = (reportKey: string) => {
    setActiveReport(reportKey);
  };

  const handleBackToMenu = () => {
    setActiveReport(null);
  };

  if (activeReport) {
    const report = reports.find(r => r.key === activeReport);
    if (report) {
      const ReportComponent = report.component;
      return (
        <div className="space-y-4">
          <Button 
            variant="outline" 
            onClick={handleBackToMenu}
            className="mb-4"
          >
            ← Voltar aos Relatórios
          </Button>
          <ReportComponent />
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios</h1>
        <p className="text-gray-600">Selecione um relatório para visualizar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <Card 
            key={report.key} 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-300"
            onClick={() => handleReportSelect(report.key)}
          >
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                  {report.icon}
                </div>
              </div>
              <CardTitle className="text-lg font-semibold">
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                {report.description}
              </p>
              <Button 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReportSelect(report.key);
                }}
              >
                Acessar Relatório
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;
