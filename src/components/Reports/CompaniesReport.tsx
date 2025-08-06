
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
// import jsPDF from 'jspdf'; // Removed for compatibility
// import 'jspdf-autotable'; // Removed for compatibility

interface Company {
  id: string;
  name: string;
  cnpj?: string;
  telefone?: string;
  estado?: string;
  estados?: {
    nome: string;
  };
}

const CompaniesReport: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    name: '',
    estado: ''
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [companies, filters]);

  useEffect(() => {
    // Extrair estados únicos
    const states = [...new Set(companies.map(c => c.estados?.nome || c.estado).filter(Boolean))].sort();
    setAvailableStates(states);
  }, [companies]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('empresas')
        .select(`
          *,
          estados (
            nome
          )
        `)
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar empresas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...companies];

    if (filters.name) {
      filtered = filtered.filter(company => 
        company.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.estado) {
      filtered = filtered.filter(company => 
        (company.estados?.nome === filters.estado) ||
        (company.estado === filters.estado)
      );
    }

    setFilteredCompanies(filtered);
  };

  const generatePDF = () => {
    alert("Geração de PDF não disponível no momento");
    return;
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Relatório de Empresas</h1>
        <Button onClick={generatePDF} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Gerar PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome da Empresa</Label>
              <Input
                id="name"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                placeholder="Digite o nome da empresa"
              />
            </div>
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select 
                value={filters.estado || 'all'} 
                onValueChange={(value) => handleFilterChange('estado', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {availableStates.map(estado => (
                    <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empresas Cadastradas ({filteredCompanies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">CNPJ</th>
                  <th className="text-left p-3">Telefone</th>
                  <th className="text-left p-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map(company => (
                  <tr key={company.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{company.name}</td>
                    <td className="p-3">{company.cnpj || '-'}</td>
                    <td className="p-3">{company.telefone || '-'}</td>
                    <td className="p-3">{company.estados?.nome || company.estado || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCompanies.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma empresa encontrada com os filtros aplicados
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompaniesReport;
