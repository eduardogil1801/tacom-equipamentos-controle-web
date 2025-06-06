import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MaskedInput } from '@/components/ui/masked-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash, Building } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMask } from '@/hooks/useMask';

interface Company {
  id: string;
  name: string;
  cnpj?: string;
  contact?: string;
  estado?: string;
}

const CompanyList: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    contact: '',
    estado: ''
  });

  const { formatCNPJ, formatPhone } = useMask();

  const estados = [
    'Acre',
    'Alagoas',
    'Amapá',
    'Amazonas',
    'Bahia',
    'Ceará',
    'Distrito Federal',
    'Espírito Santo',
    'Goiás',
    'Maranhão',
    'Mato Grosso',
    'Mato Grosso do Sul',
    'Minas Gerais',
    'Pará',
    'Paraíba',
    'Paraná',
    'Pernambuco',
    'Piauí',
    'Rio de Janeiro',
    'Rio Grande do Norte',
    'Rio Grande do Sul',
    'Rondônia',
    'Roraima',
    'Santa Catarina',
    'São Paulo',
    'Sergipe',
    'Tocantins'
  ];

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error loading companies:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar empresas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.estado) {
      toast({
        title: "Erro",
        description: "Nome da empresa e estado são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const companyData = {
        name: formData.name,
        cnpj: formData.cnpj || null,
        contact: formData.contact || null,
        estado: formData.estado
      };

      if (editingCompany) {
        const { error } = await supabase
          .from('empresas')
          .update(companyData)
          .eq('id', editingCompany.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Empresa atualizada com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('empresas')
          .insert([companyData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Empresa cadastrada com sucesso!",
        });
      }

      loadCompanies();
      setFormData({ name: '', cnpj: '', contact: '', estado: '' });
      setShowForm(false);
      setEditingCompany(null);
    } catch (error) {
      console.error('Error saving company:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar empresa",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      cnpj: company.cnpj ? formatCNPJ(company.cnpj) : '',
      contact: company.contact ? formatPhone(company.contact) : '',
      estado: company.estado || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Empresa removida com sucesso!",
      });
      
      loadCompanies();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir empresa",
        variant: "destructive",
      });
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingCompany(null);
    setFormData({ name: '', cnpj: '', contact: '', estado: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Empresas</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Empresa
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              {editingCompany ? 'Editar Empresa' : 'Cadastrar Nova Empresa'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Empresa *</Label>
                  <Input
                    id="name"
                    placeholder="Nome da empresa"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <MaskedInput
                    id="cnpj"
                    mask="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">Contato</Label>
                  <MaskedInput
                    id="contact"
                    mask="phone"
                    placeholder="(00) 00000-0000"
                    value={formData.contact}
                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Select value={formData.estado} onValueChange={(value) => setFormData({...formData, estado: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map(estado => (
                        <SelectItem key={estado} value={estado}>
                          {estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  {editingCompany ? 'Atualizar' : 'Cadastrar'}
                </Button>
                <Button type="button" variant="outline" onClick={cancelForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Company List */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas Cadastradas ({companies.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Nome</th>
                  <th className="text-left p-2">CNPJ</th>
                  <th className="text-left p-2">Contato</th>
                  <th className="text-left p-2">Estado</th>
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(company => (
                  <tr key={company.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{company.name}</td>
                    <td className="p-2">{company.cnpj || '-'}</td>
                    <td className="p-2">{company.contact || '-'}</td>
                    <td className="p-2">{company.estado || '-'}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(company)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(company.id)}
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
            {companies.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhuma empresa cadastrada
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyList;
