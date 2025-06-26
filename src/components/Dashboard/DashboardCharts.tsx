
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Package, Wrench } from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface DashboardChartsProps {
  pieChartData: ChartData[];
  maintenanceTypesData: ChartData[];
  isCompanyFiltered: boolean;
  isTacomFiltered: boolean;
  ensureValidNumber: (value: any) => number;
}

const DashboardCharts: React.FC<DashboardChartsProps> = ({
  pieChartData,
  maintenanceTypesData,
  isCompanyFiltered,
  isTacomFiltered,
  ensureValidNumber
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Equipment Types in Stock Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          {pieChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${ensureValidNumber(value).toLocaleString('pt-BR')}`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [ensureValidNumber(value).toLocaleString('pt-BR'), '']} 
                  labelFormatter={(label) => String(label || '')}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum equipamento encontrado</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Types Chart - Only show for TACOM or when no filter is applied */}
      {(!isCompanyFiltered || isTacomFiltered) && (
        <Card>
          <CardHeader>
            <CardTitle>Equipamentos em Manutenção por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {maintenanceTypesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={maintenanceTypesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${ensureValidNumber(value)}`}
                  >
                    {maintenanceTypesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [ensureValidNumber(value), '']} 
                    labelFormatter={(label) => String(label || '')}
                  />
                </PieChart>
                </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum equipamento em manutenção</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardCharts;
