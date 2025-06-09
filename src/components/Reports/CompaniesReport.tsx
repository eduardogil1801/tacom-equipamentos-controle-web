
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDown, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Company {
  id: string;
  name: string;
  estado?: string;
  cnpj?: string;
  telefone?: string;
  contact?: string;
  created_at: string;
}

const CompaniesReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [filters, setFilters] = useState({
    name: '',
    estado: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [companies, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados das empresas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = companies;

    if (filters.name) {
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.estado) {
      filtered = filtered.filter(company => 
        company.estado?.toLowerCase().includes(filters.estado.toLowerCase())
      );
    }

    setFilteredCompanies(filtered);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const exportToXLSX = () => {
    const worksheetData = [
      ['Nome', 'Estado', 'CNPJ', 'Telefone', 'Contato', 'Data de Criação'],
      ...filteredCompanies.map(company => [
        company.name,
        company.estado || '',
        company.cnpj || '',
        company.telefone || '',
        company.contact || '',
        new Date(company.created_at).toLocaleDateString('pt-BR')
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Empresas');
    
    XLSX.writeFile(wb, `relatorio_empresas_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Sucesso",
      description: "Relatório XLSX exportado com sucesso!",
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Relatório de Empresas', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
    doc.text(`Total de empresas: ${filteredCompanies.length}`, 20, 40);

    const tableData = filteredCompanies.map(company => [
      company.name,
      company.estado || '',
      company.cnpj || '',
      company.telefone || '',
      company.contact || '',
      new Date(company.created_at).toLocaleDateString('pt-BR')
    ]);

    (doc as any).autoTable({
      head: [['Nome', 'Estado', 'CNPJ', 'Telefone', 'Contato', 'Data Criação']],
      body: tableData,
      startY: 50,
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 30 },
        5: { cellWidth: 25 }
      }
    });

    doc.save(`relatorio_empresas_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "Sucesso",
      description: "Relatório PDF exportado com sucesso!",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando relatório de empresas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Empresas</h1>
        <div className="flex gap-2">
          <Button onClick={exportToXLSX} variant="outline" className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Exportar XLSX
          </Button>
          <Button onClick={exportToPDF} variant="outline" className="flex items-center gap-2">
            <FileDown className="h-4 w-4" />
            Exportar PDF
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
            <div>
              <Label htmlFor="nameFilter">Nome da Empresa</Label>
              <Input
                id="nameFilter"
                placeholder="Filtrar por nome..."
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="estadoFilter">Estado</Label>
              <Input
                id="estadoFilter"
                placeholder="Filtrar por estado..."
                value={filters.estado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Empresas</p>
                <p className="text-2xl font-bold">{filteredCompanies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Com CNPJ</p>
                <p className="text-2xl font-bold">
                  {filteredCompanies.filter(c => c.cnpj).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Com Telefone</p>
                <p className="text-2xl font-bold">
                  {filteredCompanies.filter(c => c.telefone).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Dados */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas Cadastradas ({filteredCompanies.length} registros)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="text-left p-3">CNPJ</th>
                  <th className="text-left p-3">Telefone</th>
                  <th className="text-left p-3">Contato</th>
                  <th className="text-left p-3">Data Criação</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map(company => (
                  <tr key={company.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{company.name}</td>
                    <td className="p-3">{company.estado || '-'}</td>
                    <td className="p-3 font-mono">{company.cnpj || '-'}</td>
                    <td className="p-3">{company.telefone || '-'}</td>
                    <td className="p-3">{company.contact || '-'}</td>
                    <td className="p-3">{new Date(company.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCompanies.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma empresa encontrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompaniesReport;
