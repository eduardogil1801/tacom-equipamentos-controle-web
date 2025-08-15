
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Database, TrendingUp, Package, Wrench } from 'lucide-react';

interface DashboardStatsProps {
  isCompanyFiltered: boolean;
  isTacomFiltered: boolean;
  totalEquipments: number;
  inStockEquipments: number;
  equipmentsInMaintenanceCount: number;
  filteredCompanyTotal: number;
  filteredCompanyInStock: number;
  filteredCompanyWithdrawn: number;
  selectedCompanyName?: string;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  isCompanyFiltered,
  isTacomFiltered,
  totalEquipments,
  inStockEquipments,
  equipmentsInMaintenanceCount,
  filteredCompanyTotal,
  filteredCompanyInStock,
  filteredCompanyWithdrawn,
  selectedCompanyName
}) => {
  if (!isCompanyFiltered) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Equipamentos</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalEquipments.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              Equipamentos cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Estoque</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{inStockEquipments.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              Equipamentos na TACOM SISTEMAS POA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{equipmentsInMaintenanceCount.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">Equipamentos em manutenção</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total da Empresa</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{filteredCompanyTotal.toLocaleString('pt-BR')}</div>
          <p className="text-xs text-muted-foreground">
            Equipamentos de {selectedCompanyName}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Em Estoque</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{filteredCompanyInStock.toLocaleString('pt-BR')}</div>
          <p className="text-xs text-muted-foreground">
            Equipamentos em estoque
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Retirados</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{filteredCompanyWithdrawn.toLocaleString('pt-BR')}</div>
          <p className="text-xs text-muted-foreground">
            Equipamentos retirados
          </p>
        </CardContent>
      </Card>

      {isTacomFiltered && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Manutenção</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{equipmentsInMaintenanceCount.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">Equipamentos em manutenção</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardStats;
