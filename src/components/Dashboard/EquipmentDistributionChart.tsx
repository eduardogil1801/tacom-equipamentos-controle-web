import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  tipo: string;
  quantidade: number;
}

interface EquipmentDistributionChartProps {
  data: ChartData[];
  title?: string;
}

const EquipmentDistributionChart: React.FC<EquipmentDistributionChartProps> = ({ 
  data, 
  title = "Distribuição por Tipo de Equipamento" 
}) => {
  // Ensure all data is valid
  const validData = data.filter(item => 
    item && 
    typeof item === 'object' && 
    typeof item.quantidade === 'number' && 
    !isNaN(item.quantidade) && 
    isFinite(item.quantidade) &&
    item.quantidade > 0 &&
    item.tipo
  );

  if (validData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-gray-500">
            <div className="text-center">
              <p>Nenhum equipamento encontrado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={validData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="tipo" 
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={12}
              interval={0}
            />
            <YAxis 
              tickFormatter={(value) => Number(value || 0).toLocaleString('pt-BR')}
            />
            <Tooltip 
              formatter={(value) => [Number(value || 0).toLocaleString('pt-BR'), 'Quantidade']}
              labelFormatter={(label) => String(label || '')}
            />
            <Bar 
              dataKey="quantidade" 
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default EquipmentDistributionChart;