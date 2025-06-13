
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartData {
  name: string;
  fullName: string;
  'Em Estoque': number;
  'Retirados': number;
  total: number;
}

interface EquipmentByCompanyChartProps {
  data: ChartData[];
}

const EquipmentByCompanyChart: React.FC<EquipmentByCompanyChartProps> = ({ data }) => {
  console.log('EquipmentByCompanyChart data:', data);

  // Ensure all data is valid
  const validData = data.filter(item => 
    item && 
    typeof item === 'object' && 
    typeof item['Em Estoque'] === 'number' && 
    typeof item['Retirados'] === 'number' &&
    !isNaN(item['Em Estoque']) && 
    !isNaN(item['Retirados']) &&
    isFinite(item['Em Estoque']) && 
    isFinite(item['Retirados'])
  );

  if (validData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equipamentos por Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-gray-500">
            <div className="text-center">
              <p>Nenhum dado encontrado com os filtros selecionados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipamentos por Empresa</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={Math.max(400, validData.length * 50)}>
          <BarChart 
            data={validData} 
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 200, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis 
              type="number" 
              tickFormatter={(value) => Number(value).toLocaleString('pt-BR')}
              domain={[0, 'dataMax']}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={190}
              fontSize={12}
              interval={0}
            />
            <Tooltip 
              labelFormatter={(label) => {
                const item = validData.find(d => d.name === label);
                return item ? item.fullName : String(label);
              }}
              formatter={(value, name) => [Number(value || 0).toLocaleString('pt-BR'), String(name)]}
            />
            <Legend />
            <Bar 
              dataKey="Em Estoque" 
              stackId="a" 
              fill="#16A34A" 
              name="Em Estoque"
            />
            <Bar 
              dataKey="Retirados" 
              stackId="a" 
              fill="#DC2626" 
              name="Retirados"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default EquipmentByCompanyChart;
