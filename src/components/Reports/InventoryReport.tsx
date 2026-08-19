
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ReportExportBar from './ReportExportBar';
import { fetchAllRows, getEquipmentEstado } from '@/utils/fetchAllRows';

interface Equipment {
  id: string;
  tipo: string;
  modelo?: string;
  numero_serie: string;
  data_entrada: string;
  data_saida?: string;
  status: string;
  estado: string;
  empresas?: {
    name: string;
    estado?: string | null;
  } | null;
}

interface Company {
  id: string;
  name: string;
}

const InventoryReport = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [tipos, setTipos] = useState<string[]>([]);
  const [estados, setEstados] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    operadora: '',
    status: '',
    tipo: '',
    estado: '',
    numero_serie: ''
  });


  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [equipments, filters]);

  const fetchData = async () => {
    try {
      // Buscar equipamentos com join das empresas
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipamentos')
        .select(`
          *,
          empresas(name)
        `)
        .order('data_entrada', { ascending: false });

      if (equipmentError) throw equipmentError;

      // Buscar empresas
      const { data: companyData, error: companyError } = await supabase
        .from('empresas')
        .select('id, name')
        .order('name');

      if (companyError) throw companyError;

      setEquipments((equipmentData || []) as Equipment[]);
      setCompanies(companyData || []);
      const uniqueTipos = Array.from(
        new Set(((equipmentData || []) as Equipment[]).map(e => e.tipo).filter(Boolean))
      ).sort();
      setTipos(uniqueTipos);
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do inventário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = equipments;

    if (filters.operadora) {
      filtered = filtered.filter(eq => eq.empresas?.name === filters.operadora);
    }

    if (filters.status) {
      filtered = filtered.filter(eq => eq.status === filters.status);
    }

    if (filters.tipo) {
      filtered = filtered.filter(eq => eq.tipo === filters.tipo);
    }

    if (filters.numero_serie) {
      filtered = filtered.filter(eq => 
        eq.numero_serie.toLowerCase().includes(filters.numero_serie.toLowerCase())
      );
    }

    setFilteredEquipments(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? '' : value
    }));
  };

  const clearFilters = () => {
    setFilters({
      operadora: '',
      status: '',
      tipo: '',
      numero_serie: ''
    });
  };

  const buildExport = () => ({
    title: 'Relatório de Inventário',
    fileName: `inventario_${new Date().toISOString().slice(0, 10)}`,
    headers: ['Tipo', 'Modelo', 'Nº Série', 'Empresa', 'Status', 'Estado', 'Data Entrada', 'Data Saída'],
    rows: filteredEquipments.map(eq => [
      eq.tipo || '-',
      eq.modelo || '-',
      eq.numero_serie || '-',
      eq.empresas?.name || '-',
      eq.status || '-',
      eq.estado || 'Não informado',
      eq.data_entrada ? new Date(eq.data_entrada).toLocaleDateString('pt-BR') : '-',
      eq.data_saida ? new Date(eq.data_saida).toLocaleDateString('pt-BR') : '-',
    ]),
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando dados do inventário...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Relatório de Inventário
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Operadora</label>
              <Select
                value={filters.operadora || 'all'}
                onValueChange={(value) => handleFilterChange('operadora', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as operadoras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.name}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em_uso">Em Uso</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="defeito">Defeito</SelectItem>
                  <SelectItem value="danificado">Danificado</SelectItem>
                  <SelectItem value="indisponivel">Indisponível</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Equipamento</label>
              <Select
                value={filters.tipo || 'all'}
                onValueChange={(value) => handleFilterChange('tipo', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {tipos.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Número de Série</label>
              <Input
                placeholder="Buscar por nº de série"
                value={filters.numero_serie}
                onChange={(e) => handleFilterChange('numero_serie', e.target.value)}
              />
            </div>
          </div>


          <div className="flex gap-2 flex-wrap items-center">
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
            <ReportExportBar getData={buildExport} />
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{filteredEquipments.length}</div>
                <p className="text-sm text-gray-600">Total de Equipamentos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {filteredEquipments.filter(eq => eq.status === 'disponivel').length}
                </div>
                <p className="text-sm text-gray-600">Disponíveis</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredEquipments.filter(eq => eq.status === 'em_uso').length}
                </div>
                <p className="text-sm text-gray-600">Em Uso</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">
                  {filteredEquipments.filter(eq => eq.status === 'manutencao' || eq.status === 'defeito' || eq.status === 'danificado').length}
                </div>
                <p className="text-sm text-gray-600">Manutenção/Defeito</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Número de Série</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Data Entrada</TableHead>
                  <TableHead>Data Saída</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipments.map((equipment) => (
                  <TableRow key={equipment.id}>
                    <TableCell>{equipment.tipo}</TableCell>
                    <TableCell>{equipment.modelo || '-'}</TableCell>
                    <TableCell>{equipment.numero_serie}</TableCell>
                    <TableCell>{equipment.empresas?.name || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        equipment.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                        equipment.status === 'em_uso' ? 'bg-blue-100 text-blue-800' :
                        equipment.status === 'manutencao' ? 'bg-yellow-100 text-yellow-800' :
                        equipment.status === 'indisponivel' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {equipment.status === 'disponivel' ? 'Disponível' :
                         equipment.status === 'em_uso' ? 'Em Uso' :
                         equipment.status === 'manutencao' ? 'Manutenção' :
                         equipment.status === 'indisponivel' ? 'Indisponível' :
                         equipment.status === 'danificado' ? 'Danificado' :
                         'Defeito'}
                      </span>
                    </TableCell>
                    <TableCell>{equipment.estado || <span className="text-muted-foreground italic">Não informado</span>}</TableCell>
                    <TableCell>
                      {equipment.data_entrada ? new Date(equipment.data_entrada).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell>
                      {equipment.data_saida ? new Date(equipment.data_saida).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredEquipments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhum equipamento encontrado com os filtros aplicados.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryReport;
