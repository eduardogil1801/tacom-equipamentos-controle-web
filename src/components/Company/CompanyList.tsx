
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash, Building } from 'lucide-react';
import { Company } from '@/types';
import { toast } from '@/hooks/use-toast';

const CompanyList: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    contact: ''
  });

  useEffect(() => {
    const savedCompanies = localStorage.getItem('tacom-companies');
    if (savedCompanies) {
      setCompanies(JSON.parse(savedCompanies));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        title: "Erro",
        description: "Nome da empresa é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    const newCompany = {
      id: editingCompany?.id || Date.now().toString(),
      name: formData.name,
      cnpj: formData.cnpj,
      contact: formData.contact
    };

    let updatedCompanies;
    if (editingCompany) {
      updatedCompanies = companies.map(comp => 
        comp.id === editingCompany.id ? newCompany : comp
      );
    } else {
      updatedCompanies = [...companies, newCompany];
    }

    setCompanies(updatedCompanies);
    localStorage.setItem('tacom-companies', JSON.stringify(updatedCompanies));
    
    setFormData({ name: '', cnpj: '', contact: '' });
    setShowForm(false);
    setEditingCompany(null);

    toast({
      title: "Sucesso",
      description: editingCompany ? "Empresa atualizada com sucesso!" : "Empresa cadastrada com sucesso!",
    });
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      cnpj: company.cnpj || '',
      contact: company.contact || ''
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    const updatedCompanies = companies.filter(comp => comp.id !== id);
    setCompanies(updatedCompanies);
    localStorage.setItem('tacom-companies', JSON.stringify(updatedCompanies));
    
    toast({
      title: "Sucesso",
      description: "Empresa removida com sucesso!",
    });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingCompany(null);
    setFormData({ name: '', cnpj: '', contact: '' });
  };

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">Contato</Label>
                  <Input
                    id="contact"
                    placeholder="(00) 0000-0000"
                    value={formData.contact}
                    onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  />
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
                  <th className="text-left p-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(company => (
                  <tr key={company.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{company.name}</td>
                    <td className="p-2">{company.cnpj || '-'}</td>
                    <td className="p-2">{company.contact || '-'}</td>
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
