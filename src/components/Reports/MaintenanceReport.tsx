
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MaintenanceReportData {
  empresa: string;
  tipo_equipamento: string;
  total_equipamentos: number;
  em_manutencao: number;
  disponivel: number;
  outros_status: number;
}

const MaintenanceReport = () => {
  const [reportData, setReportData] = useState<MaintenanceReportData[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    generateReport();
  }, [selectedCompany, selectedType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar empresas
      const { data: companyData, error: companyError } = await supabase
        .from('empresas')
        .select('id, name')
        .order('name');

      if (companyError) throw companyError;
      setCompanies(companyData || []);

      // Buscar tipos de equipamento únicos
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipamentos')
        .select('tipo')
        .order('tipo');

      if (equipmentError) throw equipmentError;
      const uniqueTypes = [...new Set(equipmentData?.map(eq => eq.tipo).filter(Boolean))].sort();
      setEquipmentTypes(uniqueTypes);

      await generateReport();
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do relatório",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      let query = supabase
        .from('equipamentos')
        .select(`
          tipo,
          status,
          em_manutencao,
          empresas (
            name
          )
        `);

      if (selectedCompany !== 'all') {
        const company = companies.find(c => c.id === selectedCompany);
        if (company) {
          query = query.eq('id_empresa', selectedCompany);
        }
      }

      if (selectedType !== 'all') {
        query = query.eq('tipo', selectedType);
      }

      const { data: equipmentData, error } = await query;

      if (error) throw error;

      // Processar dados para o relatório
      const reportMap = new Map<string, MaintenanceReportData>();

      equipmentData?.forEach(equipment => {
        const key = `${equipment.empresas?.name || 'N/A'}-${equipment.tipo}`;
        
        if (!reportMap.has(key)) {
          reportMap.set(key, {
            empresa: equipment.empresas?.name || 'N/A',
            tipo_equipamento: equipment.tipo,
            total_equipamentos: 0,
            em_manutencao: 0,
            disponivel: 0,
            outros_status: 0
          });
        }

        const report = reportMap.get(key)!;
        report.total_equipamentos++;

        if (equipment.em_manutencao) {
          report.em_manutencao++;
        } else if (equipment.status === 'disponivel') {
          report.disponivel++;
        } else {
          report.outros_status++;
        }
      });

      setReportData(Array.from(reportMap.values()));
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando relatório...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatório de Manutenção</h1>
        <Button onClick={fetchData}>
          Atualizar Dados
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Equipamento</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {equipmentTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relatório */}
      <Card>
        <CardHeader>
          <CardTitle>Equipamentos por Tipo e Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left">Empresa</th>
                  <th className="border border-gray-300 p-3 text-left">Tipo de Equipamento</th>
                  <th className="border border-gray-300 p-3 text-center">Total</th>
                  <th className="border border-gray-300 p-3 text-center">Em Manutenção</th>
                  <th className="border border-gray-300 p-3 text-center">Disponível</th>
                  <th className="border border-gray-300 p-3 text-center">Outros Status</th>
                  <th className="border border-gray-300 p-3 text-center">% Manutenção</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, index) => {
                  const maintenancePercentage = row.total_equipamentos > 0 
                    ? (row.em_manutencao / row.total_equipamentos * 100).toFixed(1)
                    : '0.0';

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-3">{row.empresa}</td>
                      <td className="border border-gray-300 p-3">{row.tipo_equipamento}</td>
                      <td className="border border-gray-300 p-3 text-center font-semibold">
                        {row.total_equipamentos}
                      </td>
                      <td className="border border-gray-300 p-3 text-center">
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                          {row.em_manutencao}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-3 text-center">
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          {row.disponivel}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-3 text-center">
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          {row.outros_status}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-3 text-center">
                        <span className={`px-2 py-1 rounded text-sm ${
                          parseFloat(maintenancePercentage) > 20 
                            ? 'bg-red-100 text-red-800'
                            : parseFloat(maintenancePercentage) > 10
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {maintenancePercentage}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {reportData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum dado encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceReport;
