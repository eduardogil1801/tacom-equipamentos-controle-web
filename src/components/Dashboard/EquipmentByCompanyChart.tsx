
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
  if (data.length === 0) {
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
        <ResponsiveContainer width="100%" height={Math.max(400, data.length * 50)}>
          <BarChart 
            data={data} 
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 200, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis 
              type="number" 
              tickFormatter={(value) => value.toLocaleString('pt-BR')}
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
                const item = data.find(d => d.name === label);
                return item ? item.fullName : label;
              }}
              formatter={(value, name) => [Number(value).toLocaleString('pt-BR'), name]}
            />
            <Bar 
              dataKey="Em Estoque" 
              stackId="a" 
              fill="#16A34A" 
              name="Em Estoque" 
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="Retirados" 
              stackId="a" 
              fill="#DC2626" 
              name="Retirados" 
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default EquipmentByCompanyChart;
