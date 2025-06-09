
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface FleetData {
  id: string;
  cod_operadora: string;
  nome_empresa: string;
  mes_referencia: string;
  simples_com_imagem: number;
  simples_sem_imagem: number;
  secao: number;
  citgis: number;
  buszoom: number;
  nuvem: number;
  telemetria: number;
  total: number;
  usuario_responsavel?: string;
}

// Função para formatar números com pontos
const formatNumber = (num: number): string => {
  return num.toLocaleString('pt-BR');
};

const FleetReport: React.FC = () => {
  const [fleetData, setFleetData] = useState<FleetData[]>([]);
  const [filteredData, setFilteredData] = useState<FleetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    operadora: '',
    mesInicio: '',
    mesFim: ''
  });

  useEffect(() => {
    loadFleetData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [fleetData, filters]);

  const loadFleetData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('frota')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Ensure telemetria field exists with default value
      const formattedData = (data || []).map(item => ({
        ...item,
        telemetria: item.telemetria || 0
      }));
      
      setFleetData(formattedData);
    } catch (error) {
      console.error('Erro ao carregar dados da frota:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da frota",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...fleetData];

    if (filters.operadora) {
      filtered = filtered.filter(item => 
        item.nome_empresa.toLowerCase().includes(filters.operadora.toLowerCase()) ||
        item.cod_operadora.includes(filters.operadora)
      );
    }

    if (filters.mesInicio) {
      filtered = filtered.filter(item => 
        new Date(item.mes_referencia) >= new Date(filters.mesInicio)
      );
    }

    if (filters.mesFim) {
      filtered = filtered.filter(item => 
        new Date(item.mes_referencia) <= new Date(filters.mesFim)
      );
    }

    setFilteredData(filtered);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Frota', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 32);
    
    if (filteredData.length === 0) {
      doc.text('Nenhum dado encontrado com os filtros aplicados.', 14, 50);
      doc.save('relatorio-frota.pdf');
      return;
    }

    const tableData = filteredData.map(item => [
      item.cod_operadora,
      item.nome_empresa,
      new Date(item.mes_referencia).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit' }),
      formatNumber(item.simples_com_imagem || 0),
      formatNumber(item.simples_sem_imagem || 0),
      formatNumber(item.secao || 0),
      formatNumber(item.citgis || 0),
      formatNumber(item.buszoom || 0),
      formatNumber(item.nuvem || 0),
      formatNumber(item.telemetria || 0),
      formatNumber(item.total || 0)
    ]);

    (doc as any).autoTable({
      head: [['Código', 'Operadora', 'Mês', 'Simples C/Img', 'Simples S/Img', 'Seção', 'CITGIS', 'BUSZOOM', 'Nuvem', 'Telemetria', 'Total']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    const totalGeral = filteredData.reduce((sum, item) => sum + (item.total || 0), 0);
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.text(`Total Geral de Equipamentos: ${formatNumber(totalGeral)}`, 14, finalY);

    doc.save('relatorio-frota.pdf');
    
    toast({
      title: "Sucesso",
      description: "Relatório PDF gerado com sucesso!",
    });
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando relatório...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Relatório de Frota</h1>
        <Button onClick={generatePDF} className="flex items-center justify-center gap-2 w-full sm:w-auto">
          <Download className="h-4 w-4" />
          Gerar PDF
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="operadora" className="text-sm">Operadora</Label>
              <Input
                id="operadora"
                value={filters.operadora}
                onChange={(e) => handleFilterChange('operadora', e.target.value)}
                placeholder="Nome ou código da operadora"
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="mesInicio" className="text-sm">Mês Início</Label>
              <Input
                id="mesInicio"
                type="month"
                value={filters.mesInicio}
                onChange={(e) => handleFilterChange('mesInicio', e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="mesFim" className="text-sm">Mês Fim</Label>
              <Input
                id="mesFim"
                type="month"
                value={filters.mesFim}
                onChange={(e) => handleFilterChange('mesFim', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados da Frota</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="overflow-x-auto">
            {/* Mobile Card View */}
            <div className="block lg:hidden space-y-4 p-4">
              {filteredData.map(fleet => (
                <Card key={fleet.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm">{fleet.nome_empresa}</p>
                          <p className="text-xs text-gray-600">Código: {fleet.cod_operadora}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Mês:</p>
                          <p className="text-sm font-medium">
                            {new Date(fleet.mes_referencia).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-gray-500">Simples C/Img:</p>
                          <p className="font-medium">{formatNumber(fleet.simples_com_imagem || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Simples S/Img:</p>
                          <p className="font-medium">{formatNumber(fleet.simples_sem_imagem || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Seção:</p>
                          <p className="font-medium">{formatNumber(fleet.secao || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">CITGIS:</p>
                          <p className="font-medium">{formatNumber(fleet.citgis || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">BUSZOOM:</p>
                          <p className="font-medium">{formatNumber(fleet.buszoom || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Nuvem:</p>
                          <p className="font-medium">{formatNumber(fleet.nuvem || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Telemetria:</p>
                          <p className="font-medium">{formatNumber(fleet.telemetria || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total:</p>
                          <p className="font-bold text-lg">{formatNumber(fleet.total || 0)}</p>
                        </div>
                      </div>
                      
                      {fleet.usuario_responsavel && (
                        <div>
                          <p className="text-xs text-gray-500">Responsável:</p>
                          <p className="text-sm">{fleet.usuario_responsavel}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Desktop Table View */}
            <table className="hidden lg:table w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 text-sm font-medium">Código</th>
                  <th className="text-left p-3 text-sm font-medium">Operadora</th>
                  <th className="text-left p-3 text-sm font-medium">Mês</th>
                  <th className="text-left p-3 text-sm font-medium">Simples C/Img</th>
                  <th className="text-left p-3 text-sm font-medium">Simples S/Img</th>
                  <th className="text-left p-3 text-sm font-medium">Seção</th>
                  <th className="text-left p-3 text-sm font-medium">CITGIS</th>
                  <th className="text-left p-3 text-sm font-medium">BUSZOOM</th>
                  <th className="text-left p-3 text-sm font-medium">Nuvem</th>
                  <th className="text-left p-3 text-sm font-medium">Telemetria</th>
                  <th className="text-left p-3 text-sm font-medium">Total</th>
                  <th className="text-left p-3 text-sm font-medium">Responsável</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(fleet => (
                  <tr key={fleet.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 text-sm">{fleet.cod_operadora}</td>
                    <td className="p-3 text-sm">{fleet.nome_empresa}</td>
                    <td className="p-3 text-sm">{new Date(fleet.mes_referencia).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit' })}</td>
                    <td className="p-3 text-sm">{formatNumber(fleet.simples_com_imagem || 0)}</td>
                    <td className="p-3 text-sm">{formatNumber(fleet.simples_sem_imagem || 0)}</td>
                    <td className="p-3 text-sm">{formatNumber(fleet.secao || 0)}</td>
                    <td className="p-3 text-sm">{formatNumber(fleet.citgis || 0)}</td>
                    <td className="p-3 text-sm">{formatNumber(fleet.buszoom || 0)}</td>
                    <td className="p-3 text-sm">{formatNumber(fleet.nuvem || 0)}</td>
                    <td className="p-3 text-sm">{formatNumber(fleet.telemetria || 0)}</td>
                    <td className="p-3 font-bold text-sm">{formatNumber(fleet.total || 0)}</td>
                    <td className="p-3 text-sm">{fleet.usuario_responsavel || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum dado encontrado com os filtros aplicados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetReport;
