
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface Movement {
  id: string;
  tipo_movimento: string;
  data_movimento: string;
  observacoes?: string;
  usuario_responsavel?: string;
  id_equipamento: string;
}

const EquipmentHistoryDetailReport = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('all');
  const [searchSerial, setSearchSerial] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  const equipmentTypes = [
    'CCIT 4.0',
    'CCIT 5.0',
    'PM (Painel de Motorista)',
    'UPEX',
    'Connections 4.0',
    'Connections 5.0'
  ];

  useEffect(() => {
    fetchData();
  }, []);

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

      // Fetch movements
      const { data: movementData, error: movementError } = await supabase
        .from('movimentacoes')
        .select('*')
        .order('data_movimento', { ascending: false });

      if (movementError) throw movementError;

      // Fetch companies
      const { data: companyData, error: companyError } = await supabase
        .from('empresas')
        .select('id, name');

      if (companyError) throw companyError;

      setEquipments(equipmentData || []);
      setMovements(movementData || []);
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

  const getFilteredEquipments = () => {
    let filtered = [...equipments];

    if (selectedCompany !== 'all') {
      filtered = filtered.filter(eq => eq.empresas?.name === selectedCompany);
    }

    if (selectedEquipmentType !== 'all') {
      filtered = filtered.filter(eq => eq.tipo === selectedEquipmentType);
    }

    if (searchSerial) {
      filtered = filtered.filter(eq => 
        eq.numero_serie.toLowerCase().includes(searchSerial.toLowerCase())
      );
    }

    if (dateFrom) {
      filtered = filtered.filter(eq => 
        new Date(eq.data_entrada) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      filtered = filtered.filter(eq => 
        new Date(eq.data_entrada) <= new Date(dateTo)
      );
    }

    return filtered;
  };

  const getEquipmentMovements = (equipmentId: string) => {
    return movements.filter(mov => mov.id_equipamento === equipmentId);
  };

  const filteredEquipments = getFilteredEquipments();

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
        <h1 className="text-2xl font-bold">Histórico Detalhado de Equipamentos</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Empresa</Label>
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
              <Label>Tipo de Equipamento</Label>
              <Select value={selectedEquipmentType} onValueChange={setSelectedEquipmentType}>
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

            <div className="space-y-2">
              <Label>Número de Série</Label>
              <Input
                placeholder="Buscar por número de série"
                value={searchSerial}
                onChange={(e) => setSearchSerial(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Equipamentos com Histórico */}
      <div className="space-y-4">
        {filteredEquipments.map(equipment => {
          const equipmentMovements = getEquipmentMovements(equipment.id);
          
          return (
            <Card key={equipment.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{equipment.numero_serie} - {equipment.tipo}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    equipment.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                    equipment.status === 'em_uso' ? 'bg-blue-100 text-blue-800' :
                    equipment.status === 'danificado' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {equipment.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <strong>Empresa:</strong> {equipment.empresas?.name}
                  </div>
                  <div>
                    <strong>Modelo:</strong> {equipment.modelo || '-'}
                  </div>
                  <div>
                    <strong>Estado:</strong> {equipment.estado || '-'}
                  </div>
                  <div>
                    <strong>Data Entrada:</strong> {equipment.data_entrada ? new Date(equipment.data_entrada + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                  </div>
                  <div>
                    <strong>Data Saída:</strong> {equipment.data_saida ? new Date(equipment.data_saida + 'T00:00:00').toLocaleDateString('pt-BR') : 'Em estoque'}
                  </div>
                </div>

                {equipmentMovements.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Histórico de Movimentações:</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 p-2 text-left">Data</th>
                            <th className="border border-gray-300 p-2 text-left">Tipo</th>
                            <th className="border border-gray-300 p-2 text-left">Responsável</th>
                            <th className="border border-gray-300 p-2 text-left">Observações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {equipmentMovements.map(movement => (
                            <tr key={movement.id} className="hover:bg-gray-50">
                              <td className="border border-gray-300 p-2">
                                {movement.data_movimento ? new Date(movement.data_movimento).toLocaleDateString('pt-BR') : '-'}
                              </td>
                              <td className="border border-gray-300 p-2">{movement.tipo_movimento}</td>
                              <td className="border border-gray-300 p-2">{movement.usuario_responsavel || '-'}</td>
                              <td className="border border-gray-300 p-2">{movement.observacoes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {equipmentMovements.length === 0 && (
                  <div className="text-gray-500 text-sm">
                    Nenhuma movimentação registrada para este equipamento.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredEquipments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-500">
              Nenhum equipamento encontrado com os filtros aplicados.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EquipmentHistoryDetailReport;
