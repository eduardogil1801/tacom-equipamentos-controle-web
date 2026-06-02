import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { exportCSV as utilExportCSV, printReport as utilPrintReport } from '@/utils/reportExports';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FleetData {
  id: string;
  nome_empresa: string;
  cod_operadora: string;
  mes_referencia: string;
  simples_com_imagem: number;
  simples_sem_imagem: number;
  secao: number;
  citgis: number;
  buszoom: number;
  nuvem: number;
  total: number;
  telemetria?: number;
}

interface FilterState {
  empresa: string;
  mesReferencia: string;
}

interface ServiceTotals {
  qtdTotal: number;
  qtdTotal2: number;
  qtdTotal3: number;
  qtdTotalNuvem: number;
  qtdTotal4: number;
  qtdTotal5: number;
  qtdTotal6: number;
}

interface ExportFilters {
  empresa: string;
  mesReferencia: string;
}

// Função para formatar números com pontos
const formatNumber = (num: number): string => {
  return num.toLocaleString('pt-BR');
};

// Função para formatar mês/ano de referência
const formatMesReferencia = (mesReferencia: string): string => {
  if (!mesReferencia) return '';
  
  try {
    // Se está no formato YYYY-MM-DD, extrair apenas YYYY-MM
    let dateToFormat = mesReferencia;
    if (mesReferencia.length === 10) {
      dateToFormat = mesReferencia.substring(0, 7);
    }
    
    // Se está no formato YYYY-MM, converter para MM/YYYY
    if (dateToFormat.includes('-') && dateToFormat.length === 7) {
      const [year, month] = dateToFormat.split('-');
      return `${month}/${year}`;
    }
    
    // Fallback: tentar criar uma data
    const date = new Date(mesReferencia + (mesReferencia.includes('-01') ? '' : '-01'));
    if (isNaN(date.getTime())) {
      return mesReferencia; // Retorna o valor original se não conseguir formatar
    }
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${year}`;
  } catch (error) {
    console.error('Erro ao formatar data:', mesReferencia, error);
    return mesReferencia;
  }
};

const BillingServicesReport: React.FC = () => {
  const [fleetData, setFleetData] = useState<FleetData[]>([]);
  const [filteredData, setFilteredData] = useState<FleetData[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'xlsx'>('pdf');
  const [exportFilters, setExportFilters] = useState<ExportFilters>({
    empresa: '',
    mesReferencia: ''
  });
  
  const [filters, setFilters] = useState<FilterState>({
    empresa: '',
    mesReferencia: ''
  });

  const [serviceTotals, setServiceTotals] = useState<ServiceTotals>({
    qtdTotal: 0,
    qtdTotal2: 0,
    qtdTotal3: 0,
    qtdTotalNuvem: 0,
    qtdTotal4: 0,
    qtdTotal5: 0,
    qtdTotal6: 0
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
        .order('mes_referencia', { ascending: false }); // Ordenar por data decrescente

      if (error) {
        console.error('Erro ao carregar dados da frota:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados da frota.",
          variant: "destructive",
        });
        return;
      }

      const processedData = data || [];
      console.log('Dados carregados da frota:', processedData);
      setFleetData(processedData);

      // Extrair empresas únicas
      const uniqueCompanies = [...new Set(processedData.map(item => item.nome_empresa))].sort();
      setCompanies(uniqueCompanies);

    } catch (error) {
      console.error('Erro ao processar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar dados da frota.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...fleetData];

    if (filters.empresa && filters.empresa !== 'all') {
      filtered = filtered.filter(item => item.nome_empresa === filters.empresa);
    }

    if (filters.mesReferencia && filters.mesReferencia !== 'all') {
      filtered = filtered.filter(item => {
        try {
          const formattedItem = formatMesReferencia(item.mes_referencia);
          return formattedItem === filters.mesReferencia;
        } catch (error) {
          console.error('Erro ao filtrar por mês referência:', error);
          return false;
        }
      });
    }

    // Ordenar por mês/ano de referência (decrescente)
    filtered.sort((a, b) => {
      try {
        const dateA = new Date(a.mes_referencia + (a.mes_referencia.includes('-01') ? '' : '-01'));
        const dateB = new Date(b.mes_referencia + (b.mes_referencia.includes('-01') ? '' : '-01'));
        return dateB.getTime() - dateA.getTime();
      } catch (error) {
        return 0;
      }
    });

    console.log('Dados filtrados:', filtered);
    setFilteredData(filtered);
    calculateTotals(filtered);
  };

  const calculateTotals = (data: FleetData[]) => {
    const totals = data.reduce(
      (acc, item) => {
        const nuvemTotal = (item.simples_com_imagem || 0) + (item.simples_sem_imagem || 0) + (item.secao || 0);
        
        return {
          qtdTotal: acc.qtdTotal + (item.simples_com_imagem || 0),
          qtdTotal2: acc.qtdTotal2 + (item.simples_sem_imagem || 0),
          qtdTotal3: acc.qtdTotal3 + (item.secao || 0),
          qtdTotalNuvem: acc.qtdTotalNuvem + nuvemTotal,
          qtdTotal4: acc.qtdTotal4 + (item.citgis || 0),
          qtdTotal5: acc.qtdTotal5 + (item.buszoom || 0),
          qtdTotal6: acc.qtdTotal6 + (item.telemetria || 0)
        };
      },
      {
        qtdTotal: 0,
        qtdTotal2: 0,
        qtdTotal3: 0,
        qtdTotalNuvem: 0,
        qtdTotal4: 0,
        qtdTotal5: 0,
        qtdTotal6: 0
      }
    );

    setServiceTotals(totals);
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    const actualValue = value === "all" ? "" : value;
    setFilters(prev => ({ ...prev, [field]: actualValue }));
  };

  const handleExportFilterChange = (field: keyof ExportFilters, value: string) => {
    const actualValue = value === "all" ? "" : value;
    setExportFilters(prev => ({ ...prev, [field]: actualValue }));
  };

  const getSelectValue = (filterValue: string) => {
    return filterValue === "" ? "all" : filterValue;
  };

  const openExportDialog = (type: 'pdf' | 'xlsx') => {
    setExportType(type);
    setExportFilters({ empresa: '', mesReferencia: '' });
    setIsExportDialogOpen(true);
  };

  const generateExport = async () => {
    try {
      // Filtrar dados para exportação
      let dataToExport = [...fleetData];

      if (exportFilters.empresa && exportFilters.empresa !== 'all') {
        dataToExport = dataToExport.filter(item => item.nome_empresa === exportFilters.empresa);
      }

      if (exportFilters.mesReferencia && exportFilters.mesReferencia !== 'all') {
        dataToExport = dataToExport.filter(item => {
          try {
            const formattedItem = formatMesReferencia(item.mes_referencia);
            return formattedItem === exportFilters.mesReferencia;
          } catch (error) {
            return false;
          }
        });
      }

      // Ordenar por mês/ano de referência (decrescente)
      dataToExport.sort((a, b) => {
        try {
          const dateA = new Date(a.mes_referencia + (a.mes_referencia.includes('-01') ? '' : '-01'));
          const dateB = new Date(b.mes_referencia + (b.mes_referencia.includes('-01') ? '' : '-01'));
          return dateB.getTime() - dateA.getTime();
        } catch (error) {
          return 0;
        }
      });

      if (exportType === 'xlsx') {
        await generateExcel(dataToExport);
      } else {
        await generatePDF(dataToExport);
      }

      setIsExportDialogOpen(false);
      toast({
        title: "Sucesso",
        description: `Relatório ${exportType.toUpperCase()} gerado com sucesso!`,
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar relatório.",
        variant: "destructive",
      });
    }
  };

  const generateExcel = async (data: FleetData[]) => {
    // Implementar geração de Excel usando SheetJS
    const XLSX = await import('xlsx');
    
    // Preparar dados para o Excel com tipo any para permitir linha vazia
    const excelData: Record<string, string | number>[] = data.map(item => {
      const nuvemTotal = (item.simples_com_imagem || 0) + (item.simples_sem_imagem || 0) + (item.secao || 0);
      
      return {
        'Empresa': item.nome_empresa,
        'Mês Referência': formatMesReferencia(item.mes_referencia),
        'Simples C/Image': item.simples_com_imagem || 0,
        'Simples S/Image': item.simples_sem_imagem || 0,
        'Seção': item.secao || 0,
        'Nuvem': nuvemTotal,
        'Total Bilhetagem': nuvemTotal,
        'CITGIS': item.citgis || 0,
        'Buszoom': item.buszoom || 0,
        'Telemetria': item.telemetria || 0
      };
    });

    // Adicionar totais quando for "todas empresas"
    if (!exportFilters.empresa || exportFilters.empresa === 'all') {
      // Calcular totais gerais
      const totalsGeral = data.reduce((acc, item) => {
        const nuvemTotal = (item.simples_com_imagem || 0) + (item.simples_sem_imagem || 0) + (item.secao || 0);
        
        return {
          simplesComImage: acc.simplesComImage + (item.simples_com_imagem || 0),
          simplesSemImage: acc.simplesSemImage + (item.simples_sem_imagem || 0),
          secao: acc.secao + (item.secao || 0),
          nuvem: acc.nuvem + nuvemTotal,
          citgis: acc.citgis + (item.citgis || 0),
          buszoom: acc.buszoom + (item.buszoom || 0),
          telemetria: acc.telemetria + (item.telemetria || 0)
        };
      }, {
        simplesComImage: 0,
        simplesSemImage: 0,
        secao: 0,
        nuvem: 0,
        citgis: 0,
        buszoom: 0,
        telemetria: 0
      });

      // Linha vazia antes do total
      excelData.push({
        'Empresa': '',
        'Mês Referência': '',
        'Simples C/Image': 0,
        'Simples S/Image': 0,
        'Seção': 0,
        'Nuvem': 0,
        'Total Bilhetagem': 0,
        'CITGIS': 0,
        'Buszoom': 0,
        'Telemetria': 0
      });

      // Linha de total
      excelData.push({
        'Empresa': 'TOTAL GERAL',
        'Mês Referência': '',
        'Simples C/Image': totalsGeral.simplesComImage,
        'Simples S/Image': totalsGeral.simplesSemImage,
        'Seção': totalsGeral.secao,
        'Nuvem': totalsGeral.nuvem,
        'Total Bilhetagem': totalsGeral.nuvem,
        'CITGIS': totalsGeral.citgis,
        'Buszoom': totalsGeral.buszoom,
        'Telemetria': totalsGeral.telemetria
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Frota');

    // Download do arquivo
    const fileName = `frota_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const generatePDF = async (data: FleetData[]) => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const tacomLogo = (await import('@/assets/tacom-logo.png')).default;

      // Carregar logo como dataURL (evita CORS)
      const logo = await new Promise<{ dataUrl: string; w: number; h: number } | null>((resolve) => {
        fetch(tacomLogo)
          .then(r => r.blob())
          .then(b => {
            const fr = new FileReader();
            fr.onload = () => {
              const dataUrl = fr.result as string;
              const img = new Image();
              img.onload = () => resolve({ dataUrl, w: img.width, h: img.height });
              img.onerror = () => resolve(null);
              img.src = dataUrl;
            };
            fr.onerror = () => resolve(null);
            fr.readAsDataURL(b);
          })
          .catch(() => resolve(null));
      });

      const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();

      // Vermelho e cinza padrão TACOM
      const systemRed: [number, number, number] = [232, 62, 62];
      const headerGray: [number, number, number] = [110, 110, 110];
      const totalRed: [number, number, number] = [180, 35, 35];

      // Barra superior vermelha
      doc.setFillColor(systemRed[0], systemRed[1], systemRed[2]);
      doc.rect(0, 0, pageW, 22, 'F');

      // Logo
      if (logo) {
        const logoH = 14;
        const logoW = (logo.w / logo.h) * logoH;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(6, 4, logoW + 6, logoH + 4, 2, 2, 'F');
        doc.addImage(logo.dataUrl, 'PNG', 9, 6, logoW, logoH);
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.text('RELATÓRIO DE FROTA', pageW / 2, 14, { align: 'center' });

      let yPosition = 28;
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);

      if (exportFilters.empresa && exportFilters.empresa !== 'all') {
        doc.text(`Empresa: ${exportFilters.empresa}`, 10, yPosition);
        yPosition += 4;
      }
      if (exportFilters.mesReferencia && exportFilters.mesReferencia !== 'all') {
        doc.text(`Mês Referência: ${exportFilters.mesReferencia}`, 10, yPosition);
        yPosition += 4;
      }


      const headers = [
        'Empresa', 'Mês Ref.', 'Simples C/Image', 'Simples S/Image',
        'Seção', 'Nuvem', 'Total Bilhet.', 'CITGIS', 'Buszoom', 'Telemetria'
      ];

      const rows = data.map(item => {
        const nuvemTotal = (item.simples_com_imagem || 0) + (item.simples_sem_imagem || 0) + (item.secao || 0);
        return [
          item.nome_empresa,
          formatMesReferencia(item.mes_referencia),
          formatNumber(item.simples_com_imagem || 0),
          formatNumber(item.simples_sem_imagem || 0),
          formatNumber(item.secao || 0),
          formatNumber(nuvemTotal),
          formatNumber(nuvemTotal),
          formatNumber(item.citgis || 0),
          formatNumber(item.buszoom || 0),
          formatNumber(item.telemetria || 0),
        ];
      });

      let footRow: string[] | undefined;
      if (!exportFilters.empresa || exportFilters.empresa === 'all') {
        const totals = data.reduce((acc, item) => {
          const nuvemTotal = (item.simples_com_imagem || 0) + (item.simples_sem_imagem || 0) + (item.secao || 0);
          return {
            simplesComImage: acc.simplesComImage + (item.simples_com_imagem || 0),
            simplesSemImage: acc.simplesSemImage + (item.simples_sem_imagem || 0),
            secao: acc.secao + (item.secao || 0),
            nuvem: acc.nuvem + nuvemTotal,
            citgis: acc.citgis + (item.citgis || 0),
            buszoom: acc.buszoom + (item.buszoom || 0),
            telemetria: acc.telemetria + (item.telemetria || 0),
          };
        }, { simplesComImage: 0, simplesSemImage: 0, secao: 0, nuvem: 0, citgis: 0, buszoom: 0, telemetria: 0 });

        footRow = [
          'TOTAL GERAL', '',
          formatNumber(totals.simplesComImage),
          formatNumber(totals.simplesSemImage),
          formatNumber(totals.secao),
          formatNumber(totals.nuvem),
          formatNumber(totals.nuvem),
          formatNumber(totals.citgis),
          formatNumber(totals.buszoom),
          formatNumber(totals.telemetria),
        ];
      }

      const colWidths = [44, 20, 26, 26, 18, 22, 26, 22, 22, 24];
      const columnStyles: Record<number, any> = {};
      colWidths.forEach((w, i) => {
        columnStyles[i] = { cellWidth: w, halign: i === 0 ? 'left' : 'right' };
      });

      autoTable(doc, {
        head: [headers],
        body: rows,
        foot: footRow ? [footRow] : undefined,
        startY: yPosition + 4,
        margin: { left: 8, right: 8 },
        styles: { fontSize: 8, cellPadding: 1.5, overflow: 'linebreak' },
        headStyles: { fillColor: headerGray, textColor: 255, fontStyle: 'bold', halign: 'center' },
        footStyles: { fillColor: totalRed, textColor: 255, fontStyle: 'bold', halign: 'right' },
        alternateRowStyles: { fillColor: [248, 235, 235] },
        columnStyles,
        didDrawPage: (d) => {
          const total = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(110, 110, 110);
          doc.text(`Página ${d.pageNumber} de ${total}`, pageW - 8, doc.internal.pageSize.getHeight() - 5, { align: 'right' });
          doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 8, doc.internal.pageSize.getHeight() - 5);
        },
      });

      doc.save(`frota_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({ title: 'Erro', description: 'Erro ao gerar PDF.', variant: 'destructive' });
    }
  };

  // Gerar opções de mês referência baseadas nos dados existentes
  const mesReferenciaOptions = [...new Set(fleetData.map(item => formatMesReferencia(item.mes_referencia)))].sort().reverse();

  // Mostrar dados filtrados individualmente (não agrupados) para o histórico
  const sortedFilteredData = [...filteredData].sort((a, b) => {
    try {
      const dateA = new Date(a.mes_referencia + (a.mes_referencia.includes('-01') ? '' : '-01'));
      const dateB = new Date(b.mes_referencia + (b.mes_referencia.includes('-01') ? '' : '-01'));
      return dateB.getTime() - dateA.getTime();
    } catch (error) {
      return 0;
    }
  });

  const buildCurrentExport = () => {
    const headers = ['Empresa', 'Mês Ref.', 'Simples C/Image', 'Simples S/Image', 'Seção', 'Nuvem', 'Total Bilhet.', 'CITGIS', 'Buszoom', 'Telemetria'];
    const rows = sortedFilteredData.map(item => {
      const nuvemTotal = (item.simples_com_imagem || 0) + (item.simples_sem_imagem || 0) + (item.secao || 0);
      return [
        item.nome_empresa,
        formatMesReferencia(item.mes_referencia),
        formatNumber(item.simples_com_imagem || 0),
        formatNumber(item.simples_sem_imagem || 0),
        formatNumber(item.secao || 0),
        formatNumber(nuvemTotal),
        formatNumber(nuvemTotal),
        formatNumber(item.citgis || 0),
        formatNumber(item.buszoom || 0),
        formatNumber(item.telemetria || 0),
      ];
    });
    return {
      title: 'Relatório de Frota',
      fileName: `frota_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
    };
  };

  const exportCurrentCSV = () => utilExportCSV(buildCurrentExport());
  const printCurrent = () => utilPrintReport(buildCurrentExport());

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando relatório...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Frota</h1>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => openExportDialog('xlsx')} variant="outline" size="sm" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            XLSX
          </Button>
          <Button onClick={() => openExportDialog('pdf')} variant="outline" size="sm" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            PDF
          </Button>
          <Button onClick={exportCurrentCSV} variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button onClick={printCurrent} variant="outline" size="sm" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>
     {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro Empresa */}
            <div>
              <Label htmlFor="empresa">Empresa</Label>
              <Select value={getSelectValue(filters.empresa)} onValueChange={(value) => handleFilterChange('empresa', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Mês Referência */}
            <div>
              <Label htmlFor="mesReferencia">Mês Referência</Label>
              <Select value={getSelectValue(filters.mesReferencia)} onValueChange={(value) => handleFilterChange('mesReferencia', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês referência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {mesReferenciaOptions.map((mesRef) => (
                    <SelectItem key={mesRef} value={mesRef}>
                      {mesRef}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico dos Cadastros */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico dos Cadastros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Mês Referência</TableHead>
                  <TableHead>Simples C/Image</TableHead>
                  <TableHead>Simples S/Image</TableHead>
                  <TableHead>Seção</TableHead>
                  <TableHead>Nuvem</TableHead>
                  <TableHead>Total Bilhetagem</TableHead>
                  <TableHead>CITGIS</TableHead>
                  <TableHead>Buszoom</TableHead>
                  <TableHead>Telemetria</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFilteredData.map((item) => {
                  const nuvemTotal = (item.simples_com_imagem || 0) + (item.simples_sem_imagem || 0) + (item.secao || 0);
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nome_empresa}</TableCell>
                      <TableCell>{formatMesReferencia(item.mes_referencia)}</TableCell>
                      <TableCell>{formatNumber(item.simples_com_imagem || 0)}</TableCell>
                      <TableCell>{formatNumber(item.simples_sem_imagem || 0)}</TableCell>
                      <TableCell>{formatNumber(item.secao || 0)}</TableCell>
                      <TableCell>{formatNumber(nuvemTotal)}</TableCell>
                      <TableCell className="font-semibold">{formatNumber(nuvemTotal)}</TableCell>
                      <TableCell>{formatNumber(item.citgis || 0)}</TableCell>
                      <TableCell>{formatNumber(item.buszoom || 0)}</TableCell>
                      <TableCell>{formatNumber(item.telemetria || 0)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {/* Resumo de registros */}
          <div className="mt-4 text-center">
            <div className="text-lg font-medium text-gray-600">
              Total de registros encontrados: <span className="font-bold text-primary">{filteredData.length}</span>
            </div>
            {/* Só mostrar Total Geral de Bilhetagem quando não há filtro de empresa */}
            {(!filters.empresa || filters.empresa === 'all' || filters.empresa === '') && (
              <div className="text-sm font-semibold text-blue-600 mt-2">
                Total Geral de Bilhetagem: <span className="text-lg">{formatNumber(serviceTotals.qtdTotalNuvem)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Exportação */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar Relatório {exportType === 'xlsx' ? 'Excel' : 'PDF'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtro Empresa para Exportação */}
              <div>
                <Label>Empresa</Label>
                <Select value={getSelectValue(exportFilters.empresa)} onValueChange={(value) => handleExportFilterChange('empresa', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as empresas</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company} value={company}>
                        {company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro Mês Referência para Exportação */}
              <div>
                <Label>Mês Referência</Label>
                <Select value={getSelectValue(exportFilters.mesReferencia)} onValueChange={(value) => handleExportFilterChange('mesReferencia', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os meses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {mesReferenciaOptions.map((mesRef) => (
                      <SelectItem key={mesRef} value={mesRef}>
                        {mesRef}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={generateExport}>
                Gerar {exportType === 'xlsx' ? 'Excel' : 'PDF'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingServicesReport;