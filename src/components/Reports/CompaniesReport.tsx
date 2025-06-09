
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileDown, FileSpreadsheet, Building2, Package, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface CompanyData {
  id: string;
  name: string;
  cnpj: string;
  contact: string;
  estado: string;
  created_at: string;
  equipmentCount: number;
  inStockCount: number;
  outOfStockCount: number;
}

const CompaniesReport: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    estado: ''
  });

  useEffect(() => {
    loadCompanies();
  }, [filters]);

  const loadCompanies = async () => {
    try {
      setLoading(true);

      // Buscar empresas
      let query = supabase
        .from('empresas')
        .select('*')
        .order('name');

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,cnpj.ilike.%${filters.search}%`);
      }
      if (filters.estado) {
        query = query.eq('estado', filters.estado);
      }

      const { data: companiesData, error: companiesError } = await query;
      if (companiesError) throw companiesError;

      // Para cada empresa, buscar quantidade de equipamentos
      const companiesWithEquipments = await Promise.all(
        (companiesData || []).map(async (company) => {
          const { data: equipments, error: equipError } = await supabase
            .from('equipamentos')
            .select('data_saida')
            .eq('id_empresa', company.id);

          if (equipError) {
            console.error(`Erro ao buscar equipamentos da empresa ${company.name}:`, equipError);
            return {
              ...company,
              equipmentCount: 0,
              inStockCount: 0,
              outOfStockCount: 0
            };
          }

          const equipmentCount = equipments?.length || 0;
          const inStockCount = equipments?.filter(eq => !eq.data_saida).length || 0;
          const outOfStockCount = equipments?.filter(eq => eq.data_saida).length || 0;

          return {
            ...company,
            equipmentCount,
            inStockCount,
            outOfStockCount
          };
        })
      );

      setCompanies(companiesWithEquipments);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar relatório de empresas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToXLSX = () => {
    const data = companies.map(company => ({
      'Nome': company.name,
      'CNPJ': company.cnpj || '',
      'Contato': company.contact || '',
      'Estado': company.estado || '',
      'Total Equipamentos': company.equipmentCount,
      'Em Estoque': company.inStockCount,
      'Retirados': company.outOfStockCount,
      'Data Cadastro': new Date(company.created_at).toLocaleDateString('pt-BR')
    }));

    const ws = XLSX.utils.json_to_sheet(data);
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
    
    doc.setFontSize(20);
    doc.text('Relatório de Empresas', 14, 22);
    
    const tableColumn = ["Nome", "CNPJ", "Estado", "Total Eq.", "Em Estoque", "Retirados"];
    const tableRows: any[] = [];

    companies.forEach(company => {
      const companyData = [
        company.name,
        company.cnpj || '',
        company.estado || '',
        company.equipmentCount,
        company.inStockCount,
        company.outOfStockCount
      ];
      tableRows.push(companyData);
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 38, 38] }
    });

    doc.save(`relatorio_empresas_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "Sucesso",
      description: "Relatório PDF exportado com sucesso!",
    });
  };

  const totalEquipments = companies.reduce((sum, company) => sum + company.equipmentCount, 0);
  const totalInStock = companies.reduce((sum, company) => sum + company.inStockCount, 0);
  const totalOutOfStock = companies.reduce((sum, company) => sum + company.outOfStockCount, 0);

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
            <FileSpreadsheet className="h-4 w-4" />
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
              <Label htmlFor="search">Buscar (Nome ou CNPJ)</Label>
              <Input
                id="search"
                placeholder="Digite o nome da empresa ou CNPJ..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Input
                id="estado"
                placeholder="Ex: RS, SP, RJ..."
                value={filters.estado}
                onChange={(e) => setFilters({...filters, estado: e.target.value})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Empresas</p>
                <p className="text-2xl font-bold">{companies.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Equipamentos</p>
                <p className="text-2xl font-bold">{totalEquipments}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Estoque</p>
                <p className="text-2xl font-bold text-green-600">{totalInStock}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Retirados</p>
                <p className="text-2xl font-bold text-red-600">{totalOutOfStock}</p>
              </div>
              <Package className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Empresas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Empresas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {companies.map(company => (
              <div key={company.id} className="p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{company.name}</h3>
                    <div className="text-sm text-gray-600 mt-1 space-y-1">
                      {company.cnpj && <p><strong>CNPJ:</strong> {company.cnpj}</p>}
                      {company.contact && <p><strong>Contato:</strong> {company.contact}</p>}
                      {company.estado && <p><strong>Estado:</strong> {company.estado}</p>}
                      <p><strong>Cadastrado em:</strong> {new Date(company.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex space-x-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{company.equipmentCount}</p>
                        <p className="text-xs text-gray-600">Total</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{company.inStockCount}</p>
                        <p className="text-xs text-gray-600">Em Estoque</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{company.outOfStockCount}</p>
                        <p className="text-xs text-gray-600">Retirados</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {companies.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma empresa encontrada com os filtros selecionados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompaniesReport;
