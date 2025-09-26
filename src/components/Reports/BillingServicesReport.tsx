import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
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
  mes: string;
  ano: string;
}

interface ServiceTotals {
  qtdTotal: number;
  qtdTotal2: number;
  qtdTotal3: number;
  qtdTotalNuvem: number;
  qtdTotal4: number;
  qtdTotal5: number;
  qtdTotal6: number;
  totalBilhetagem: number;
}

interface ExportFilters {
  empresa: string;
  mes: string;
  ano: string;
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
    mes: '',
    ano: ''
  });
  
  const [filters, setFilters] = useState<FilterState>({
    empresa: '',
    mes: '',
    ano: ''
  });

  const [serviceTotals, setServiceTotals] = useState<ServiceTotals>({
    qtdTotal: 0,
    qtdTotal2: 0,
    qtdTotal3: 0,
    qtdTotalNuvem: 0,
    qtdTotal4: 0,
    qtdTotal5: 0,
    qtdTotal6: 0,
    totalBilhetagem: 0
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

    if (filters.mes && filters.mes !== 'all') {
      filtered = filtered.filter(item => {
        try {
          // Extrair mês da data armazenada
          let dateStr = item.mes_referencia;
          if (dateStr.length === 10) {
            dateStr = dateStr.substring(0, 7); // YYYY-MM
          }
          
          const [year, month] = dateStr.split('-');
          return month === filters.mes;
        } catch (error) {
          console.error('Erro ao filtrar por mês:', error);
          return false;
        }
      });
    }

    if (filters.ano && filters.ano !== 'all') {
      filtered = filtered.filter(item => {
        try {
          // Extrair ano da data armazenada
          let dateStr = item.mes_referencia;
          if (dateStr.length === 10) {
            dateStr = dateStr.substring(0, 7); // YYYY-MM
          }
          
          const [year] = dateStr.split('-');
          return year === filters.ano;
        } catch (error) {
          console.error('Erro ao filtrar por ano:', error);
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
        const totalBilhetagem = nuvemTotal + (item.citgis || 0) + (item.buszoom || 0) + (item.telemetria || 0);
        
        return {
          qtdTotal: acc.qtdTotal + (item.simples_com_imagem || 0),
          qtdTotal2: acc.qtdTotal2 + (item.simples_sem_imagem || 0),
          qtdTotal3: acc.qtdTotal3 + (item.secao || 0),
          qtdTotalNuvem: acc.qtdTotalNuvem + nuvemTotal,
          qtdTotal4: acc.qtdTotal4 + (item.citgis || 0),
          qtdTotal5: acc.qtdTotal5 + (item.buszoom || 0),
          qtdTotal6: acc.qtdTotal6 + (item.telemetria || 0),
          totalBilhetagem: acc.totalBilhetagem + totalBilhetagem
        };
      },
      {
        qtdTotal: 0,
        qtdTotal2: 0,
        qtdTotal3: 0,
        qtdTotalNuvem: 0,
        qtdTotal4: 0,
        qtdTotal5: 0,
        qtdTotal6: 0,
        totalBilhetagem: 0
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
    setExportFilters({ empresa: '', mes: '', ano: '' });
    setIsExportDialogOpen(true);
  };

  const generateExport = async () => {
    try {
      // Filtrar dados para exportação
      let dataToExport = [...fleetData];

      if (exportFilters.empresa && exportFilters.empresa !== 'all') {
        dataToExport = dataToExport.filter(item => item.nome_empresa === exportFilters.empresa);
      }

      if (exportFilters.mes && exportFilters.mes !== 'all') {
        dataToExport = dataToExport.filter(item => {
          try {
            let dateStr = item.mes_referencia;
            if (dateStr.length === 10) {
              dateStr = dateStr.substring(0, 7); // YYYY-MM
            }
            
            const [year, month] = dateStr.split('-');
            return month === exportFilters.mes;
          } catch (error) {
            return false;
          }
        });
      }

      if (exportFilters.ano && exportFilters.ano !== 'all') {
        dataToExport = dataToExport.filter(item => {
          try {
            let dateStr = item.mes_referencia;
            if (dateStr.length === 10) {
              dateStr = dateStr.substring(0, 7); // YYYY-MM
            }
            
            const [year] = dateStr.split('-');
            return year === exportFilters.ano;
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
    
    // Preparar dados para o Excel
    const excelData = data.map(item => {
      const nuvemTotal = (item.simples_com_imagem || 0) + (item.simples_sem_imagem || 0) + (item.secao || 0);
      const totalBilhetagem = nuvemTotal + (item.citgis || 0) + (item.buszoom || 0) + (item.telemetria || 0);
      
      return {
        'Empresa': item.nome_empresa,
        'Mês Referência': formatMesReferencia(item.mes_referencia),
        'Simples C/Imagem': item.simples_com_imagem || 0,
        'Simples S/Imagem': item.simples_sem_imagem || 0,
        'Seção': item.secao || 0,
        'Nuvem': nuvemTotal,
        'Total Bilhetagem': totalBilhetagem,
        'CITGIS': item.citgis || 0,
        'Buszoom': item.buszoom || 0,
        'Telemetria': item.telemetria || 0
      };
    });

    // Adicionar linha de totais sempre quando for "todas empresas"
    if (!exportFilters.empresa || exportFilters.empresa === 'all') {
      // Agrupar por empresa e somar os totais
      const empresaTotals = new Map();
      
      data.forEach(item => {
        const empresa = item.nome_empresa;
        if (!empresaTotals.has(empresa)) {
          empresaTotals.set(empresa, {
            simplesComImagem: 0,
            simplesSemImagem: 0,
            secao: 0,
            citgis: 0,
            buszoom: 0,
            telemetria: 0
          });
        }
        
        const current = empresaTotals.get(empresa);
        current.simplesComImagem += (item.simples_com_imagem || 0);
        current.simplesSemImagem += (item.simples_sem_imagem || 0);
        current.secao += (item.secao || 0);
        current.citgis += (item.citgis || 0);
        current.buszoom += (item.buszoom || 0);
        current.telemetria += (item.telemetria || 0);
      });

      // Adicionar linha vazia para separar
      excelData.push({
        'Empresa': '',
        'Mês Referência': '',
        'Simples C/Imagem': '',
        'Simples S/Imagem': '',
        'Seção': '',
        'Nuvem': '',
        'Total Bilhetagem': '',
        'CITGIS': '',
        'Buszoom': '',
        'Telemetria': ''
      });

      // Adicionar totais por empresa
      empresaTotals.forEach((totals, empresa) => {
        const nuvemTotal = totals.simplesComImagem + totals.simplesSemImagem + totals.secao;
        const totalBilhetagem = nuvemTotal + totals.citgis + totals.buszoom + totals.telemetria;
        
        excelData.push({
          'Empresa': `TOTAL ${empresa}`,
          'Mês Referência': '',
          'Simples C/Imagem': totals.simplesComImagem,
          'Simples S/Imagem': totals.simplesSemImagem,
          'Seção': totals.secao,
          'Nuvem': nuvemTotal,
          'Total Bilhetagem': totalBilhetagem,
          'CITGIS': totais.citgis,
          'Buszoom': totals.buszoom,
          'Telemetria': totals.telemetria
        });
      });

      // Adicionar total geral de todas empresas
      const totalsGeral = data.reduce((acc, item) => {
        const nuvemTotal = (item.simples_com_imagem || 0) + (item.simples_sem_imagem || 0) + (item.secao || 0);
        const totalBilhetagem = nuvemTotal + (item.citgis || 0) + (item.buszoom || 0) + (item.telemetria || 0);
        
        return {
          simplesComImagem: acc.simplesComImagem + (item.simples_com_imagem || 0),
          simplesSemImagem: acc.simplesSemImagem + (item.simples_sem_imagem || 0),
          secao: acc.secao + (item.secao || 0),
          nuvem: acc.nuvem + nuvemTotal,
          totalBilhetagem: acc.totalBilhetagem + totalBilhetagem,
          citgis: acc.citgis + (item.citgis || 0),
          buszoom: acc.buszoom + (item.buszoom || 0),
          telemetria: acc.telemetria + (item.telemetria || 0)
        };
      }, {
        simplesComImagem: 0,
        simplesSemImagem: 0,
        secao: 0,
        nuvem: 0,
        totalBilhetagem: 0,
        citgis: 0,
        buszoom: 0,
        telemetria: 0
      });

      // Linha vazia antes do total geral
      excelData.push({
        'Empresa': '',
        'Mês Referência': '',
        'Simples C/Imagem': '',
        'Simples S/Imagem': '',
        'Seção': '',
        'Nuvem': '',
        'Total Bilhetagem': '',
        'CITGIS': '',
        'Buszoom': '',
        'Telemetria': ''
      });

      excelData.push({
        'Empresa': 'TOTAL GERAL DE TODAS EMPRESAS',
        'Mês Referência': '',
        'Simples C/Imagem': totalsGeral.simplesComImagem,
        'Simples S/Imagem': totalsGeral.simplesSemImagem,
        'Seção': totalsGeral.secao,
        'Nuvem': totalsGeral.nuvem,
        'Total Bilhetagem': totalsGeral.totalBilhetagem,
        'CITGIS': totalsGeral.citgis,
        'Buszoom': totalsGeral.buszoom,
        'Telemetria': totalsGeral.telemetria
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Faturamento por Serviço');

    // Download do arquivo
    const fileName = `faturamento_servicos_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const generatePDF = async (data: FleetData[]) => {
    // Implementar geração de PDF - por enquanto mostrar toast
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A geração de PDF será implementada em breve. Use a exportação em Excel por enquanto.",
    });
  };

  // Gerar anos e meses
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 7 }, (_, i) => currentYear - 5 + i);
  const months = [
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

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
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Faturamento por Serviço</h1>
        <div className="flex gap-2">
          <Button onClick={() => openExportDialog('xlsx')} className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Gerar Excel
          </Button>
          <Button onClick={() => openExportDialog('pdf')} className="flex items-center gap-2" variant="outline">
            <FileText className="h-4 w-4" />
            Gerar PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Filtro Mês */}
            <div>
              <Label htmlFor="mes">Mês</Label>
              <Select value={getSelectValue(filters.mes)} onValueChange={(value) => handleFilterChange('mes', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Ano */}
            <div>
              <Label htmlFor="ano">Ano</Label>
              <Select value={getSelectValue(filters.ano)} onValueChange={(value) => handleFilterChange('ano', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os anos</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resultados - Otimizados para uma linha */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Simples C/Imagem */}
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600 mb-1">Simples C/Imagem</div>
              <div className="text-lg font-bold text-blue-600">{formatNumber(serviceTotals.qtdTotal)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Simples S/Imagem */}
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600 mb-1">Simples S/Imagem</div>
              <div className="text-lg font-bold text-green-600">{formatNumber(serviceTotals.qtdTotal2)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Seção */}
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600 mb-1">Seção</div>
              <div className="text-lg font-bold text-purple-600">{formatNumber(serviceTotals.qtdTotal3)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Nuvem e Total Bilhetagem */}
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600 mb-1">Nuvem e Total Bilhetagem</div>
              <div className="text-lg font-bold text-orange-600">{formatNumber(serviceTotals.qtdTotalNuvem)}</div>
            </div>
          </CardContent>
        </Card>

        {/* CITGIS */}
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600 mb-1">CITGIS</div>
              <div className="text-lg font-bold text-teal-600">{formatNumber(serviceTotals.qtdTotal4)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Buszoom */}
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600 mb-1">Buszoom</div>
              <div className="text-lg font-bold text-indigo-600">{formatNumber(serviceTotals.qtdTotal5)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Telemetria */}
        <Card>
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600 mb-1">Telemetria</div>
              <div className="text-lg font-bold text-red-600">{formatNumber(serviceTotals.qtdTotal6)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                  <TableHead>Simples C/Imagem</TableHead>
                  <TableHead>Simples S/Imagem</TableHead>
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
                  const totalBilhetagem = nuvemTotal + (item.citgis || 0) + (item.buszoom || 0) + (item.telemetria || 0);
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nome_empresa}</TableCell>
                      <TableCell>{formatMesReferencia(item.mes_referencia)}</TableCell>
                      <TableCell>{formatNumber(item.simples_com_imagem || 0)}</TableCell>
                      <TableCell>{formatNumber(item.simples_sem_imagem || 0)}</TableCell>
                      <TableCell>{formatNumber(item.secao || 0)}</TableCell>
                      <TableCell>{formatNumber(nuvemTotal)}</TableCell>
                      <TableCell className="font-semibold">{formatNumber(totalBilhetagem)}</TableCell>
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
            <div className="text-sm font-semibold text-blue-600 mt-2">
              Total Geral de Bilhetagem: <span className="text-lg">{formatNumber(serviceTotals.totalBilhetagem)}</span>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Filtro Mês para Exportação */}
              <div>
                <Label>Mês</Label>
                <Select value={getSelectValue(exportFilters.mes)} onValueChange={(value) => handleExportFilterChange('mes', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os meses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro Ano para Exportação */}
              <div>
                <Label>Ano</Label>
                <Select value={getSelectValue(exportFilters.ano)} onValueChange={(value) => handleExportFilterChange('ano', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os anos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os anos</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
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