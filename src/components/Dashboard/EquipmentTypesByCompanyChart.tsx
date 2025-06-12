
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  tipo: string;
  quantidade: number;
  empresa?: string;
}

interface EquipmentTypesByCompanyChartProps {
  data: ChartData[];
  selectedCompany: string;
  companyName?: string;
}

const EquipmentTypesByCompanyChart: React.FC<EquipmentTypesByCompanyChartProps> = ({ 
  data, 
  selectedCompany, 
  companyName 
}) => {
  console.log('EquipmentTypesByCompanyChart data:', data);

  const title = selectedCompany === 'all' 
    ? 'Tipos de Equipamentos (Geral)' 
    : `Tipos de Equipamentos - ${companyName || 'Empresa Selecionada'}`;

  if (data.length === 0) {
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
        <ResponsiveContainer width="100%" height={Math.max(300, data.length * 40)}>
          <BarChart 
            data={data} 
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis 
              type="number" 
              tickFormatter={(value) => value.toLocaleString('pt-BR')}
              domain={[0, 'dataMax']}
            />
            <YAxis 
              dataKey="tipo" 
              type="category" 
              width={140}
              fontSize={12}
              interval={0}
            />
            <Tooltip 
              formatter={(value) => [Number(value).toLocaleString('pt-BR'), 'Quantidade']}
            />
            <Bar 
              dataKey="quantidade" 
              fill="#3B82F6"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default EquipmentTypesByCompanyChart;
