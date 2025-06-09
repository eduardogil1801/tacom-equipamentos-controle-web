
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Company {
  id: string;
  name: string;
  cnpj?: string;
  contact?: string;
  telefone?: string;
  estado_id?: string;
  estados?: {
    nome: string;
  };
}

interface State {
  id: string;
  nome: string;
}

interface CompanyManagerProps {
  onBack?: () => void;
}

const CompanyManager: React.FC<CompanyManagerProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    telefone: '',
    estado_id: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar estados
      const { data: statesData, error: statesError } = await supabase
        .from('estados')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (statesError) throw statesError;
      setStates(statesData || []);

      // Carregar empresas
      const { data: companiesData, error: companiesError } = await supabase
        .from('empresas')
        .select(`
          *,
          estados (
            nome
          )
        `)
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.estado_id) {
      toast({
        title: "Erro",
        description: "Nome da operadora e estado são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      const companyData = {
        name: formData.name,
        cnpj: formData.cnpj,
        telefone: formData.telefone,
        estado_id: formData.estado_id
      };

      if (editingCompany) {
        const { error } = await supabase
          .from('empresas')
          .update(companyData)
          .eq('id', editingCompany.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Operadora atualizada com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('empresas')
          .insert([companyData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Operadora criada com sucesso!",
        });
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error('Erro ao salvar operadora:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar operadora",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      cnpj: company.cnpj || '',
      telefone: company.telefone || '',
      estado_id: company.estado_id || ''
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
        description: "Operadora excluída com sucesso!",
      });
      
      loadData();
    } catch (error) {
      console.error('Erro ao excluir operadora:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir operadora",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cnpj: '',
      telefone: '',
      estado_id: ''
    });
    setEditingCompany(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando operadoras...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
          <h2 className="text-xl font-bold">Cadastro de Operadoras</h2>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Operadora
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingCompany ? 'Editar' : 'Adicionar'} Operadora</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Operadora *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome da operadora"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(51) 99999-9999"
                  />
                </div>

                <div>
                  <Label htmlFor="estado">Estado *</Label>
                  <Select value={formData.estado_id || ''} onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, estado_id: value }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map(state => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit">
                  {editingCompany ? 'Atualizar' : 'Criar'} Operadora
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Operadoras Cadastradas</CardTitle>
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
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(company => (
                  <tr key={company.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{company.name}</td>
                    <td className="p-3">{company.cnpj || '-'}</td>
                    <td className="p-3">{company.telefone || '-'}</td>
                    <td className="p-3">{company.estados?.nome || '-'}</td>
                    <td className="p-3">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyManager;
