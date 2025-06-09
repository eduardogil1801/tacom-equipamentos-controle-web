
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, FileDown, Edit, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import FleetForm from './FleetForm';

interface FleetData {
  id: string;
  cod_operadora: string;
  nome_empresa: string;
  simples_com_imagem: number;
  simples_sem_imagem: number;
  secao: number;
  total: number;
  nuvem: number;
  citgis: number;
  buszoom: number;
  mes_referencia: string;
}

const FleetReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [fleetData, setFleetData] = useState<FleetData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    nome_empresa: '',
    mes_referencia: '',
    cod_operadora: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('frota')
        .select('*')
        .order('mes_referencia', { ascending: false });

      if (filters.nome_empresa) {
        query = query.ilike('nome_empresa', `%${filters.nome_empresa}%`);
      }
      if (filters.mes_referencia) {
        query = query.gte('mes_referencia', filters.mes_referencia);
      }
      if (filters.cod_operadora) {
        query = query.ilike('cod_operadora', `%${filters.cod_operadora}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Adicionar a coluna nuvem automaticamente igual ao total
      const dataWithNuvem = (data || []).map(item => ({
        ...item,
        nuvem: item.total || 0
      }));

      setFleetData(dataWithNuvem);
    } catch (error) {
      console.error('Erro ao carregar dados da frota:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatório de frota",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFleet = () => {
    loadData();
    setShowForm(false);
  };

  const handleDeleteFleet = async (id: string) => {
    try {
      const { error } = await supabase
        .from('frota')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro da frota excluído com sucesso!",
      });
      
      loadData();
    } catch (error) {
      console.error('Error deleting fleet record:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir registro da frota",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Cód. Operadora', 'Nome Empresa', 'Simples C/Imagem', 'Simples S/Imagem', 
      'Seção', 'Total', 'Nuvem', 'CitGis', 'BusZoom', 'Mês Referência'
    ];
    const csvContent = [
      headers.join(','),
      ...fleetData.map(item => [
        `"${item.cod_operadora}"`,
        `"${item.nome_empresa}"`,
        item.simples_com_imagem,
        item.simples_sem_imagem,
        item.secao,
        item.total,
        item.nuvem,
        item.citgis,
        item.buszoom,
        new Date(item.mes_referencia).toLocaleDateString('pt-BR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_frota_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Relatório de frota exportado com sucesso!",
    });
  };

  // Calcular totais
  const totals = fleetData.reduce((acc, item) => ({
    simples_com_imagem: acc.simples_com_imagem + (item.simples_com_imagem || 0),
    simples_sem_imagem: acc.simples_sem_imagem + (item.simples_sem_imagem || 0),
    secao: acc.secao + (item.secao || 0),
    total: acc.total + (item.total || 0),
    nuvem: acc.nuvem + (item.nuvem || 0),
    citgis: acc.citgis + (item.citgis || 0),
    buszoom: acc.buszoom + (item.buszoom || 0),
  }), {
    simples_com_imagem: 0,
    simples_sem_imagem: 0,
    secao: 0,
    total: 0,
    nuvem: 0,
    citgis: 0,
    buszoom: 0,
  });

  if (showForm) {
    return <FleetForm />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando relatório de frota...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Frota</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Registro
          </Button>
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Exportar CSV
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
            <div>
              <Label htmlFor="empresaFilter">Nome da Empresa</Label>
              <Input
                id="empresaFilter"
                placeholder="Filtrar por empresa..."
                value={filters.nome_empresa}
                onChange={(e) => setFilters({...filters, nome_empresa: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="codOperadoraFilter">Código Operadora</Label>
              <Input
                id="codOperadoraFilter"
                placeholder="Filtrar por código..."
                value={filters.cod_operadora}
                onChange={(e) => setFilters({...filters, cod_operadora: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="mesFilter">Mês de Referência</Label>
              <Input
                id="mesFilter"
                type="date"
                value={filters.mes_referencia}
                onChange={(e) => setFilters({...filters, mes_referencia: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Simples C/Imagem</p>
              <p className="text-2xl font-bold text-primary">{totals.simples_com_imagem}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Simples S/Imagem</p>
              <p className="text-2xl font-bold text-primary">{totals.simples_sem_imagem}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Seção</p>
              <p className="text-2xl font-bold text-primary">{totals.secao}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-primary">{totals.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Nuvem</p>
              <p className="text-2xl font-bold text-primary">{totals.nuvem}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">CitGis</p>
              <p className="text-2xl font-bold text-primary">{totals.citgis}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">BusZoom</p>
              <p className="text-2xl font-bold text-primary">{totals.buszoom}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Frota ({fleetData.length} registros)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Cód. Op.</th>
                  <th className="text-left p-2">Empresa</th>
                  <th className="text-left p-2">S/Img</th>
                  <th className="text-left p-2">C/Img</th>
                  <th className="text-left p-2">Seção</th>
                  <th className="text-left p-2">Total</th>
                  <th className="text-left p-2">Nuvem</th>
                  <th className="text-left p-2">CitGis</th>
                  <th className="text-left p-2">BusZoom</th>
                  <th className="text-left p-2">Mês Ref.</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {fleetData.map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono">{item.cod_operadora}</td>
                    <td className="p-2">{item.nome_empresa}</td>
                    <td className="p-2 text-center">{item.simples_sem_imagem || 0}</td>
                    <td className="p-2 text-center">{item.simples_com_imagem || 0}</td>
                    <td className="p-2 text-center">{item.secao || 0}</td>
                    <td className="p-2 text-center font-bold">{item.total || 0}</td>
                    <td className="p-2 text-center">{item.nuvem || 0}</td>
                    <td className="p-2 text-center">{item.citgis || 0}</td>
                    <td className="p-2 text-center">{item.buszoom || 0}</td>
                    <td className="p-2">{new Date(item.mes_referencia).toLocaleDateString('pt-BR')}</td>
                    <td className="p-2">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteFleet(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {fleetData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum registro encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetReport;
