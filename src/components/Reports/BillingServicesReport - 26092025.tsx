import React, { useState, useEffect } from 'react';

// Interfaces
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
  qtdTotalSoma: number;
  qtdTotal4: number;
  qtdTotal5: number;
  qtdTotal6: number;
}

const BillingServicesReport: React.FC = () => {
  const [components, setComponents] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [fleetData, setFleetData] = useState<FleetData[]>([]);
  const [filteredData, setFilteredData] = useState<FleetData[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    empresa: '',
    mes: '',
    ano: ''
  });
  const [serviceTotals, setServiceTotals] = useState<ServiceTotals>({
    qtdTotal: 0,
    qtdTotal2: 0,
    qtdTotal3: 0,
    qtdTotalSoma: 0,
    qtdTotal4: 0,
    qtdTotal5: 0,
    qtdTotal6: 0
  });

  // Carregamento de componentes
  useEffect(() => {
    loadComponents();
  }, []);

  // Carregamento de dados quando componentes estão prontos
  useEffect(() => {
    if (components.supabase) {
      loadFleetData();
    }
  }, [components.supabase]);

  // Aplicar filtros quando dados ou filtros mudam
  useEffect(() => {
    applyFilters();
  }, [fleetData, filters]);

  const loadComponents = async () => {
    try {
      // Carregar todos os componentes necessários
      const [
        cardModule,
        buttonModule,
        labelModule,
        selectModule,
        iconModule,
        supabaseModule,
        toastModule
      ] = await Promise.all([
        import('@/components/ui/card'),
        import('@/components/ui/button'),
        import('@/components/ui/label'),
        import('@/components/ui/select'),
        import('lucide-react'),
        import('@/integrations/supabase/client'),
        import('@/hooks/use-toast')
      ]);

      setComponents({
        ...cardModule,
        ...buttonModule,
        ...labelModule,
        ...selectModule,
        Download: iconModule.Download,
        supabase: supabaseModule.supabase,
        toast: toastModule.toast
      });
    } catch (error) {
      console.error('Erro ao carregar componentes:', error);
    }
  };

  const loadFleetData = async () => {
    try {
      setLoading(true);
      const { data, error } = await components.supabase
        .from('frota')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = (data || []).map((item: any) => ({
        ...item,
        telemetria: item.telemetria || 0,
        simples_com_imagem: item.simples_com_imagem || 0,
        simples_sem_imagem: item.simples_sem_imagem || 0,
        secao: item.secao || 0,
        citgis: item.citgis || 0,
        buszoom: item.buszoom || 0,
        nuvem: item.nuvem || 0
      }));
      
      setFleetData(formattedData);
      
      const uniqueCompanies = [...new Set(formattedData.map((item: any) => item.nome_empresa))].filter(Boolean);
      setCompanies(uniqueCompanies);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      if (components.toast) {
        components.toast({
          title: "Erro",
          description: "Erro ao carregar dados da frota",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...fleetData];

    if (filters.empresa) {
      filtered = filtered.filter(item => item.nome_empresa === filters.empresa);
    }

    if (filters.mes) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.mes_referencia);
        return (itemDate.getMonth() + 1) === parseInt(filters.mes);
      });
    }

    if (filters.ano) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.mes_referencia);
        return itemDate.getFullYear() === parseInt(filters.ano);
      });
    }

    setFilteredData(filtered);
    calculateServiceTotals(filtered);
  };

  const calculateServiceTotals = (data: FleetData[]) => {
    const totals = data.reduce((acc, item) => {
      acc.qtdTotal += item.simples_com_imagem || 0;
      acc.qtdTotal2 += item.simples_sem_imagem || 0;
      acc.qtdTotal3 += item.secao || 0;
      acc.qtdTotal4 += item.citgis || 0;
      acc.qtdTotal5 += item.buszoom || 0;
      acc.qtdTotal6 += item.telemetria || 0;
      return acc;
    }, {
      qtdTotal: 0,
      qtdTotal2: 0,
      qtdTotal3: 0,
      qtdTotal4: 0,
      qtdTotal5: 0,
      qtdTotal6: 0
    });

    const qtdTotalSoma = totals.qtdTotal + totals.qtdTotal2 + totals.qtdTotal3;

    setServiceTotals({
      ...totals,
      qtdTotalSoma
    });
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('pt-BR');
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const generatePDF = () => {
    if (components.toast) {
      components.toast({
        title: "Em desenvolvimento",
        description: "Funcionalidade de geração de PDF será implementada em breve.",
      });
    }
  };

  // Se componentes não carregaram ainda
  if (!components.Card || !components.Button) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>🔄 Carregando componentes...</div>
      </div>
    );
  }

  const { Card, CardContent, CardHeader, CardTitle, Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Download } = components;

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>🔄 Carregando dados do relatório...</div>
      </div>
    );
  }

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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Faturamento por Serviço</h1>
        <Button onClick={generatePDF} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Gerar PDF
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="empresa">Empresa</Label>
              <Select value={filters.empresa} onValueChange={(value: string) => handleFilterChange('empresa', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as empresas</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mes">Mês</Label>
              <Select value={filters.mes} onValueChange={(value: string) => handleFilterChange('mes', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os meses</SelectItem>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="ano">Ano</Label>
              <Select value={filters.ano} onValueChange={(value: string) => handleFilterChange('ano', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os anos</SelectItem>
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

      {/* Cards de Resultados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Simples C/Imagem</div>
              <div className="text-2xl font-bold text-blue-600">QTD Total</div>
              <div className="text-xl font-semibold">{formatNumber(serviceTotals.qtdTotal)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Simples S/Imagem</div>
              <div className="text-2xl font-bold text-green-600">QTD Total</div>
              <div className="text-xl font-semibold">{formatNumber(serviceTotals.qtdTotal2)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Seção</div>
              <div className="text-2xl font-bold text-purple-600">QTD Total</div>
              <div className="text-xl font-semibold">{formatNumber(serviceTotals.qtdTotal3)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Total Nuvem</div>
              <div className="text-2xl font-bold text-orange-600">QTD TOTAL</div>
              <div className="text-xl font-semibold">{formatNumber(serviceTotals.qtdTotalSoma)}</div>
              <div className="text-xs text-gray-500 mt-1">Soma A+B+C</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">CITGIS</div>
              <div className="text-2xl font-bold text-teal-600">QTD Total</div>
              <div className="text-xl font-semibold">{formatNumber(serviceTotals.qtdTotal4)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Buszoom</div>
              <div className="text-2xl font-bold text-indigo-600">QTD Total</div>
              <div className="text-xl font-semibold">{formatNumber(serviceTotals.qtdTotal5)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-600 mb-1">Telemetria</div>
              <div className="text-2xl font-bold text-red-600">QTD Total</div>
              <div className="text-xl font-semibold">{formatNumber(serviceTotals.qtdTotal6)}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-600">
              Total de registros encontrados: <span className="font-bold text-primary">{filteredData.length}</span>
            </div>
            {filters.empresa && (
              <div className="text-sm text-gray-500 mt-1">
                Empresa: {filters.empresa}
              </div>
            )}
            {(filters.mes || filters.ano) && (
              <div className="text-sm text-gray-500">
                Período: {filters.mes && months.find(m => m.value === filters.mes)?.label} {filters.ano}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BillingServicesReport;