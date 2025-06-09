
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface Equipment {
  id: string;
  tipo: string;
  numero_serie: string;
  data_entrada: string;
  data_saida?: string;
  status: string;
  estado: string;
  modelo?: string;
  em_manutencao: boolean;
  empresas: {
    name: string;
    cnpj?: string;
  };
}

const InventoryReport = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<{id: string, name: string}[]>([]);
  
  // Filtros
  const [filters, setFilters] = useState({
    companyId: '',
    tipo: '',
    status: '',
    estado: '',
    serialNumber: '',
    equipmentType: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, equipments]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar empresas/operadoras
      const { data: companiesData, error: companiesError } = await supabase
        .from('empresas')
        .select('id, name')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Carregar equipamentos
      const { data: equipmentsData, error: equipmentsError } = await supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (name, cnpj)
        `)
        .order('data_entrada', { ascending: false });

      if (equipmentsError) throw equipmentsError;
      setEquipments(equipmentsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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
    let filtered = [...equipments];

    if (filters.companyId) {
      filtered = filtered.filter(eq => eq.id_empresa === filters.companyId);
    }

    if (filters.tipo) {
      filtered = filtered.filter(eq => eq.tipo?.toLowerCase().includes(filters.tipo.toLowerCase()));
    }

    if (filters.status) {
      filtered = filtered.filter(eq => eq.status === filters.status);
    }

    if (filters.estado) {
      filtered = filtered.filter(eq => eq.estado === filters.estado);
    }

    if (filters.serialNumber) {
      filtered = filtered.filter(eq => 
        eq.numero_serie?.toLowerCase().includes(filters.serialNumber.toLowerCase())
      );
    }

    if (filters.equipmentType) {
      filtered = filtered.filter(eq => 
        eq.tipo?.toLowerCase().includes(filters.equipmentType.toLowerCase())
      );
    }

    setFilteredEquipments(filtered);
  };

  const clearFilters = () => {
    setFilters({
      companyId: '',
      tipo: '',
      status: '',
      estado: '',
      serialNumber: '',
      equipmentType: ''
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Relatório de Inventário', 20, 30);
    
    doc.setFontSize(12);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 50);
    doc.text(`Total de Equipamentos: ${filteredEquipments.length}`, 20, 60);
    
    let yPosition = 80;
    
    filteredEquipments.forEach((equipment, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(`${index + 1}. ${equipment.tipo} - ${equipment.numero_serie}`, 20, yPosition);
      doc.text(`   Operadora: ${equipment.empresas?.name || 'N/A'}`, 20, yPosition + 10);
      doc.text(`   Status: ${equipment.status} | Estado: ${equipment.estado}`, 20, yPosition + 20);
      doc.text(`   Entrada: ${new Date(equipment.data_entrada).toLocaleDateString('pt-BR')}`, 20, yPosition + 30);
      
      yPosition += 40;
    });
    
    doc.save('relatorio-inventario.pdf');
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
      <div className="flex items-center gap-4">
        <FileText className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Inventário</h1>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="company">Operadora</Label>
              <Select value={filters.companyId} onValueChange={(value) => setFilters({...filters, companyId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="em_uso">Em Uso</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="defeito">Defeito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select value={filters.estado} onValueChange={(value) => setFilters({...filters, estado: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="usado">Usado</SelectItem>
                  <SelectItem value="recondicionado">Recondicionado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="serialNumber">Número de Série</Label>
              <Input
                id="serialNumber"
                placeholder="Filtrar por série..."
                value={filters.serialNumber}
                onChange={(e) => setFilters({...filters, serialNumber: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="equipmentType">Tipo de Equipamento</Label>
              <Input
                id="equipmentType"
                placeholder="Filtrar por tipo..."
                value={filters.equipmentType}
                onChange={(e) => setFilters({...filters, equipmentType: e.target.value})}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={clearFilters} variant="outline" className="w-full">
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{filteredEquipments.length}</div>
            <div className="text-sm text-gray-500">Total de Equipamentos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">
              {filteredEquipments.filter(eq => eq.status === 'disponivel').length}
            </div>
            <div className="text-sm text-gray-500">Disponíveis</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredEquipments.filter(eq => eq.status === 'em_uso').length}
            </div>
            <div className="text-sm text-gray-500">Em Uso</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">
              {filteredEquipments.filter(eq => eq.status === 'manutencao' || eq.em_manutencao).length}
            </div>
            <div className="text-sm text-gray-500">Em Manutenção</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Equipamentos ({filteredEquipments.length})</CardTitle>
          <Button onClick={exportToPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Número de Série</th>
                  <th className="text-left p-3">Operadora</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="text-left p-3">Modelo</th>
                  <th className="text-left p-3">Data Entrada</th>
                  <th className="text-left p-3">Manutenção</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipments.map(equipment => (
                  <tr key={equipment.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{equipment.tipo}</td>
                    <td className="p-3">{equipment.numero_serie}</td>
                    <td className="p-3">{equipment.empresas?.name || 'N/A'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        equipment.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                        equipment.status === 'em_uso' ? 'bg-blue-100 text-blue-800' :
                        equipment.status === 'manutencao' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {equipment.status}
                      </span>
                    </td>
                    <td className="p-3">{equipment.estado}</td>
                    <td className="p-3">{equipment.modelo || 'N/A'}</td>
                    <td className="p-3">{new Date(equipment.data_entrada).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        equipment.em_manutencao ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {equipment.em_manutencao ? 'Sim' : 'Não'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEquipments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum equipamento encontrado com os filtros aplicados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryReport;
