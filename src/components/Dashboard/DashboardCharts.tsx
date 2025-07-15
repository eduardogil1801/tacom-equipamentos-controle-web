import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
  // Convert chart data to format suitable for bar chart
  const barChartData = pieChartData.map(item => ({
    tipo: item.name,
    quantidade: ensureValidNumber(item.value),
    fill: item.color
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Equipment Types in Stock Bar Chart */}
      <Card className="p-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Distribuição por Tipo</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="tipo" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={11}
                  interval={0}
                />
                <YAxis 
                  tickFormatter={(value) => ensureValidNumber(value).toLocaleString('pt-BR')}
                />
                <Tooltip 
                  formatter={(value) => [ensureValidNumber(value).toLocaleString('pt-BR'), 'Quantidade']}
                  labelFormatter={(label) => String(label || '')}
                />
                <Bar 
                  dataKey="quantidade" 
                  radius={[4, 4, 0, 0]}
                  fill="#3B82F6"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-500">
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
        <Card className="p-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Equipamentos em Manutenção por Tipo</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {maintenanceTypesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={maintenanceTypesData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
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
              <div className="flex items-center justify-center h-[250px] text-gray-500">
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