import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
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
import { useReportPermissions } from '@/hooks/useReportPermissions';

// Import all report components
import CompaniesReport from './CompaniesReport';
import EquipmentStatusReport from './EquipmentStatusReport';
import EquipmentDistributionReport from './EquipmentDistributionReport';
import MovementsReport from './MovementsReport';
import InventoryReport from './InventoryReport';
import EquipmentHistoryReport from './EquipmentHistoryReport';
import BillingServicesReport from './BillingServicesReport';
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

const allReports: ReportItem[] = [
  {
    key: 'companies-report',
    title: 'Empresas',
    description: 'Relatório detalhado das empresas cadastradas no sistema',
    icon: <Building2 className="h-6 w-6" />,
    component: CompaniesReport
  },
  {
    key: 'equipment-status-report',
    title: 'Status dos Equipamentos',
    description: 'Visualização do status atual de todos os equipamentos',
    icon: <Package className="h-6 w-6" />,
    component: EquipmentStatusReport
  },
  {
    key: 'equipment-distribution-report',
    title: 'Distribuição de Equipamentos',
    description: 'Análise da distribuição de equipamentos por empresa e região',
    icon: <BarChart3 className="h-6 w-6" />,
    component: EquipmentDistributionReport
  },
  {
    key: 'movements-report',
    title: 'Movimentações',
    description: 'Histórico completo de movimentações de equipamentos',
    icon: <Activity className="h-6 w-6" />,
    component: MovementsReport
  },
  {
    key: 'inventory-report',
    title: 'Inventário',
    description: 'Controle de estoque e disponibilidade de equipamentos',
    icon: <Archive className="h-6 w-6" />,
    component: InventoryReport
  },
  {
    key: 'equipment-history-report',
    title: 'Histórico de Equipamentos',
    description: 'Rastreamento detalhado do histórico de cada equipamento',
    icon: <Clock className="h-6 w-6" />,
    component: EquipmentHistoryReport
  },
  {
    key: 'billing-services-report',
    title: 'Faturamento por Serviço',
    description: 'Relatório de faturamento consolidado por tipo de serviço',
    icon: <Truck className="h-6 w-6" />,
    component: BillingServicesReport
  },
  {
    key: 'maintenance-report',
    title: 'Manutenções',
    description: 'Controle e acompanhamento das manutenções realizadas',
    icon: <Wrench className="h-6 w-6" />,
    component: MaintenanceReport
  },
  {
    key: 'monthly-report',
    title: 'Relatório Mensal',
    description: 'Consolidação mensal de dados e estatísticas do sistema',
    icon: <Calendar className="h-6 w-6" />,
    component: MonthlyReport
  },
  {
    key: 'inventory-stock-report',
    title: 'Estoque Detalhado',
    description: 'Análise detalhada do estoque com níveis críticos',
    icon: <TrendingUp className="h-6 w-6" />,
    component: InventoryStockReport
  },
  {
    key: 'equipment-history-detail-report',
    title: 'Histórico Detalhado',
    description: 'Análise aprofundada do histórico de equipamentos específicos',
    icon: <FileText className="h-6 w-6" />,
    component: EquipmentHistoryDetailReport
  }
];

const ReportsPage: React.FC = () => {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const { hasReportPermission, loading } = useReportPermissions();
  const navigate = useNavigate();

  // Verificar se há um relatório selecionado via sessionStorage (navegação externa)
  useEffect(() => {
    const selectedReport = sessionStorage.getItem('selectedReport');
    if (selectedReport) {
      // Mapear nomes simples para keys completas
      const reportKeyMap: { [key: string]: string } = {
        'billing-services': 'billing-services-report',
        'companies': 'companies-report',
        'equipment-status': 'equipment-status-report',
        'equipment-distribution': 'equipment-distribution-report',
        'movements': 'movements-report',
        'inventory': 'inventory-report',
        'equipment-history': 'equipment-history-report',
        'maintenance': 'maintenance-report',
        'monthly': 'monthly-report',
        'inventory-stock': 'inventory-stock-report',
        'equipment-history-detail': 'equipment-history-detail-report'
      };
      
      const reportKey = reportKeyMap[selectedReport] || selectedReport;
      setActiveReport(reportKey);
      sessionStorage.removeItem('selectedReport');
    }
  }, []);

  // Filtrar relatórios baseado nas permissões do usuário
  const availableReports = allReports.filter(report => hasReportPermission(report.key));

  const handleReportSelect = (reportKey: string) => {
    setActiveReport(reportKey);
  };

  const handleBackToMenu = () => {
    setActiveReport(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
        <span className="ml-2">Carregando permissões...</span>
      </div>
    );
  }

  if (activeReport) {
    const report = allReports.find(r => r.key === activeReport);
    if (report && hasReportPermission(report.key)) {
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

  if (availableReports.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">Nenhum Relatório Disponível</h2>
        <p className="text-gray-500">
          Você não possui permissão para acessar nenhum relatório. 
          Entre em contato com o administrador do sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Relatórios</h1>
        <p className="text-gray-600">Selecione um relatório para visualizar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableReports.map((report) => (
          <Card 
            key={report.key} 
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleReportSelect(report.key)}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-blue-50 rounded-full w-fit">
                {report.icon}
              </div>
              <CardTitle className="text-lg">{report.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 text-sm mb-4">{report.description}</p>
              <Button 
                className="w-full bg-red-500 hover:bg-red-600 text-white"
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