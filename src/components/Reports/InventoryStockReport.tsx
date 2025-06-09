
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Equipment {
  id: string;
  tipo: string;
  modelo?: string;
  numero_serie: string;
  data_entrada: string;
  data_saida?: string;
  estado?: string;
  status?: string;
  empresas: {
    name: string;
  };
}

const InventoryStockReport = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [loading, setLoading] = useState(true);

  const statusOptions = [
    'disponivel',
    'recuperados',
    'aguardando_despacho_contagem',
    'enviados_manutencao_contagem',
    'aguardando_manutencao',
    'em_uso',
    'danificado'
  ];

  const states = ['Rio Grande do Sul', 'Santa Catarina'];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterEquipments();
  }, [equipments, selectedCompany, selectedStatus, selectedState]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch equipments with company data
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name
          )
        `);

      if (equipmentError) throw equipmentError;

      // Fetch companies
      const { data: companyData, error: companyError } = await supabase
        .from('empresas')
        .select('id, name');

      if (companyError) throw companyError;

      setEquipments(equipmentData || []);
      setCompanies(companyData || []);
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

  const filterEquipments = () => {
    let filtered = [...equipments];

    if (selectedCompany !== 'all') {
      filtered = filtered.filter(eq => eq.empresas?.name === selectedCompany);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(eq => eq.status === selectedStatus);
    }

    if (selectedState !== 'all') {
      filtered = filtered.filter(eq => eq.estado === selectedState);
    }

    setFilteredEquipments(filtered);
  };

  const getInventorySummary = () => {
    const total = filteredEquipments.length;
    const inStock = filteredEquipments.filter(eq => !eq.data_saida).length;
    const outOfStock = filteredEquipments.filter(eq => eq.data_saida).length;
    const available = filteredEquipments.filter(eq => eq.status === 'disponivel').length;
    const inUse = filteredEquipments.filter(eq => eq.status === 'em_uso').length;
    const maintenance = filteredEquipments.filter(eq => 
      eq.status === 'aguardando_manutencao' || eq.status === 'enviados_manutencao_contagem'
    ).length;

    return { total, inStock, outOfStock, available, inUse, maintenance };
  };

  const summary = getInventorySummary();

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
        <h1 className="text-2xl font-bold">Relatório de Inventário</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa</label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.name}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {states.map(state => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{summary.inStock}</div>
            <div className="text-sm text-gray-600">Em Estoque</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{summary.outOfStock}</div>
            <div className="text-sm text-gray-600">Fora de Estoque</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{summary.available}</div>
            <div className="text-sm text-gray-600">Disponível</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{summary.inUse}</div>
            <div className="text-sm text-gray-600">Em Uso</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{summary.maintenance}</div>
            <div className="text-sm text-gray-600">Manutenção</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Equipamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Equipamentos ({filteredEquipments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-2 text-left">Número de Série</th>
                  <th className="border border-gray-300 p-2 text-left">Tipo</th>
                  <th className="border border-gray-300 p-2 text-left">Modelo</th>
                  <th className="border border-gray-300 p-2 text-left">Empresa</th>
                  <th className="border border-gray-300 p-2 text-left">Estado</th>
                  <th className="border border-gray-300 p-2 text-left">Status</th>
                  <th className="border border-gray-300 p-2 text-left">Data Entrada</th>
                  <th className="border border-gray-300 p-2 text-left">Data Saída</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipments.map(equipment => (
                  <tr key={equipment.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2">{equipment.numero_serie}</td>
                    <td className="border border-gray-300 p-2">{equipment.tipo}</td>
                    <td className="border border-gray-300 p-2">{equipment.modelo || '-'}</td>
                    <td className="border border-gray-300 p-2">{equipment.empresas?.name}</td>
                    <td className="border border-gray-300 p-2">{equipment.estado || '-'}</td>
                    <td className="border border-gray-300 p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        equipment.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                        equipment.status === 'em_uso' ? 'bg-blue-100 text-blue-800' :
                        equipment.status === 'danificado' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {equipment.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="border border-gray-300 p-2">
                      {new Date(equipment.data_entrada).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {equipment.data_saida ? new Date(equipment.data_saida).toLocaleDateString('pt-BR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryStockReport;
