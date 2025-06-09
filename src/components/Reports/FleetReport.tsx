
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
      setFleetData(data || []);
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
      formatNumber(item.total || 0)
    ]);

    (doc as any).autoTable({
      head: [['Código', 'Operadora', 'Mês', 'Simples C/Img', 'Simples S/Img', 'Seção', 'CITGIS', 'BUSZOOM', 'Telemetria', 'Total']],
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Frota</h1>
        <Button onClick={generatePDF} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Gerar PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="operadora">Operadora</Label>
              <Input
                id="operadora"
                value={filters.operadora}
                onChange={(e) => handleFilterChange('operadora', e.target.value)}
                placeholder="Nome ou código da operadora"
              />
            </div>
            <div>
              <Label htmlFor="mesInicio">Mês Início</Label>
              <Input
                id="mesInicio"
                type="month"
                value={filters.mesInicio}
                onChange={(e) => handleFilterChange('mesInicio', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="mesFim">Mês Fim</Label>
              <Input
                id="mesFim"
                type="month"
                value={filters.mesFim}
                onChange={(e) => handleFilterChange('mesFim', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Frota</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Código</th>
                  <th className="text-left p-3">Operadora</th>
                  <th className="text-left p-3">Mês</th>
                  <th className="text-left p-3">Simples C/Img</th>
                  <th className="text-left p-3">Simples S/Img</th>
                  <th className="text-left p-3">Seção</th>
                  <th className="text-left p-3">CITGIS</th>
                  <th className="text-left p-3">BUSZOOM</th>
                  <th className="text-left p-3">Telemetria</th>
                  <th className="text-left p-3">Total</th>
                  <th className="text-left p-3">Responsável</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(fleet => (
                  <tr key={fleet.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{fleet.cod_operadora}</td>
                    <td className="p-3">{fleet.nome_empresa}</td>
                    <td className="p-3">{new Date(fleet.mes_referencia).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit' })}</td>
                    <td className="p-3">{formatNumber(fleet.simples_com_imagem || 0)}</td>
                    <td className="p-3">{formatNumber(fleet.simples_sem_imagem || 0)}</td>
                    <td className="p-3">{formatNumber(fleet.secao || 0)}</td>
                    <td className="p-3">{formatNumber(fleet.citgis || 0)}</td>
                    <td className="p-3">{formatNumber(fleet.buszoom || 0)}</td>
                    <td className="p-3">{formatNumber(fleet.nuvem || 0)}</td>
                    <td className="p-3 font-bold">{formatNumber(fleet.total || 0)}</td>
                    <td className="p-3">{fleet.usuario_responsavel || '-'}</td>
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
