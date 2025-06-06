
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, FileSpreadsheet, Calendar } from 'lucide-react';
import { Equipment, Company } from '@/types';
import { toast } from '@/hooks/use-toast';

const ReportsPage: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filters, setFilters] = useState({
    companyId: '',
    startDate: '',
    endDate: '',
    status: 'all'
  });

  useEffect(() => {
    // Load data from localStorage
    const savedEquipments = localStorage.getItem('tacom-equipments');
    const savedCompanies = localStorage.getItem('tacom-companies');
    
    if (savedEquipments) {
      setEquipments(JSON.parse(savedEquipments));
    }
    
    if (savedCompanies) {
      setCompanies(JSON.parse(savedCompanies));
    }
  }, []);

  const getFilteredEquipments = () => {
    return equipments.filter(equipment => {
      const company = companies.find(c => c.id === equipment.companyId);
      const matchesCompany = !filters.companyId || equipment.companyId === filters.companyId;
      const matchesStartDate = !filters.startDate || equipment.entryDate >= filters.startDate;
      const matchesEndDate = !filters.endDate || equipment.entryDate <= filters.endDate;
      const matchesStatus = filters.status === 'all' || 
        (filters.status === 'in-stock' && !equipment.exitDate) ||
        (filters.status === 'out-of-stock' && equipment.exitDate);

      return matchesCompany && matchesStartDate && matchesEndDate && matchesStatus;
    });
  };

  const exportToCSV = () => {
    const filteredData = getFilteredEquipments();
    if (filteredData.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum equipamento encontrado para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Tipo', 'Número de Série', 'Empresa', 'Data de Entrada', 'Data de Saída', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(equipment => {
        const company = companies.find(c => c.id === equipment.companyId);
        return [
          equipment.type,
          equipment.serialNumber,
          company?.name || 'N/A',
          new Date(equipment.entryDate).toLocaleDateString('pt-BR'),
          equipment.exitDate ? new Date(equipment.exitDate).toLocaleDateString('pt-BR') : '-',
          equipment.exitDate ? 'Retirado' : 'Em Estoque'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_equipamentos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Relatório CSV gerado com sucesso!",
    });
  };

  const exportToExcel = () => {
    // For now, we'll use CSV format with .xlsx extension as a simple solution
    const filteredData = getFilteredEquipments();
    if (filteredData.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum equipamento encontrado para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = ['Tipo\tNúmero de Série\tEmpresa\tData de Entrada\tData de Saída\tStatus'];
    const excelContent = [
      headers.join(''),
      ...filteredData.map(equipment => {
        const company = companies.find(c => c.id === equipment.companyId);
        return [
          equipment.type,
          equipment.serialNumber,
          company?.name || 'N/A',
          new Date(equipment.entryDate).toLocaleDateString('pt-BR'),
          equipment.exitDate ? new Date(equipment.exitDate).toLocaleDateString('pt-BR') : '-',
          equipment.exitDate ? 'Retirado' : 'Em Estoque'
        ].join('\t');
      })
    ].join('\n');

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_equipamentos_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Relatório Excel gerado com sucesso!",
    });
  };

  const filteredEquipments = getFilteredEquipments();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
      
      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="companySelect">Empresa</Label>
              <Select value={filters.companyId} onValueChange={(value) => setFilters({...filters, companyId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as empresas</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({...filters, startDate: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({...filters, endDate: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="statusSelect">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="in-stock">Em Estoque</SelectItem>
                  <SelectItem value="out-of-stock">Retirados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Exportar Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={exportToCSV} className="flex items-center gap-2">
              <FileDown className="h-4 w-4" />
              Exportar CSV ({filteredEquipments.length} itens)
            </Button>
            <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel ({filteredEquipments.length} itens)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Prévia do Relatório ({filteredEquipments.length} equipamentos)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Série</th>
                  <th className="text-left p-2">Empresa</th>
                  <th className="text-left p-2">Entrada</th>
                  <th className="text-left p-2">Saída</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipments.slice(0, 10).map(equipment => {
                  const company = companies.find(c => c.id === equipment.companyId);
                  return (
                    <tr key={equipment.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{equipment.type}</td>
                      <td className="p-2 font-mono">{equipment.serialNumber}</td>
                      <td className="p-2">{company?.name || 'N/A'}</td>
                      <td className="p-2">{new Date(equipment.entryDate).toLocaleDateString('pt-BR')}</td>
                      <td className="p-2">
                        {equipment.exitDate ? new Date(equipment.exitDate).toLocaleDateString('pt-BR') : '-'}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          equipment.exitDate 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {equipment.exitDate ? 'Retirado' : 'Em Estoque'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredEquipments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum equipamento encontrado com os filtros selecionados
              </div>
            )}
            {filteredEquipments.length > 10 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Mostrando primeiros 10 de {filteredEquipments.length} equipamentos. Use a exportação para ver todos.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
