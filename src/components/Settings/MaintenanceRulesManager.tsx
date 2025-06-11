
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Save, Edit, Trash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MaintenanceType {
  id: string;
  codigo: string;
  descricao: string;
}

interface MaintenanceRule {
  id?: string;
  tipo_manutencao_id: string;
  status_resultante: string;
  tipos_manutencao?: {
    descricao: string;
  };
}

const MaintenanceRulesManager: React.FC = () => {
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [rules, setRules] = useState<MaintenanceRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [editingRule, setEditingRule] = useState<MaintenanceRule | null>(null);

  const statusOptions = [
    { value: 'disponivel', label: 'Disponível' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'em_uso', label: 'Em Uso' },
    { value: 'aguardando_manutencao', label: 'Aguardando Manutenção' },
    { value: 'danificado', label: 'Danificado' },
    { value: 'indisponivel', label: 'Indisponível' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar tipos de manutenção
      const { data: typesData, error: typesError } = await supabase
        .from('tipos_manutencao')
        .select('id, codigo, descricao')
        .eq('ativo', true)
        .order('descricao');

      if (typesError) throw typesError;
      setMaintenanceTypes(typesData || []);

      // Carregar regras existentes
      const { data: rulesData, error: rulesError } = await supabase
        .from('maintenance_rules')
        .select(`
          *,
          tipos_manutencao (
            descricao
          )
        `)
        .order('created_at');

      if (rulesError && rulesError.code !== 'PGRST116') { // Ignore table not found error
        console.error('Erro ao carregar regras:', rulesError);
      } else {
        setRules(rulesData || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async () => {
    if (!selectedType || !selectedStatus) {
      toast({
        title: "Erro",
        description: "Por favor, selecione o tipo de manutenção e o status.",
        variant: "destructive",
      });
      return;
    }

    try {
      const ruleData = {
        tipo_manutencao_id: selectedType,
        status_resultante: selectedStatus
      };

      if (editingRule && editingRule.id) {
        const { error } = await supabase
          .from('maintenance_rules')
          .update(ruleData)
          .eq('id', editingRule.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Regra atualizada com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('maintenance_rules')
          .insert([ruleData]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Regra criada com sucesso!",
        });
      }

      setSelectedType('');
      setSelectedStatus('');
      setEditingRule(null);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar regra:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar regra de manutenção",
        variant: "destructive",
      });
    }
  };

  const handleEditRule = (rule: MaintenanceRule) => {
    setEditingRule(rule);
    setSelectedType(rule.tipo_manutencao_id);
    setSelectedStatus(rule.status_resultante);
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta regra?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('maintenance_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Regra excluída com sucesso!",
      });
      
      loadData();
    } catch (error) {
      console.error('Erro ao excluir regra:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir regra",
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando regras de manutenção...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Regras por Tipo de Manutenção</h2>

      <Card>
        <CardHeader>
          <CardTitle>{editingRule ? 'Editar' : 'Criar'} Regra de Manutenção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maintenanceType">Tipo de Manutenção *</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de manutenção" />
                </SelectTrigger>
                <SelectContent>
                  {maintenanceTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.descricao}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status Resultante *</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={handleSaveRule}
              className="flex items-center gap-2"
              disabled={!selectedType || !selectedStatus}
            >
              <Save className="h-4 w-4" />
              {editingRule ? 'Atualizar' : 'Criar'} Regra
            </Button>
            {editingRule && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingRule(null);
                  setSelectedType('');
                  setSelectedStatus('');
                }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regras Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Manutenção</TableHead>
                <TableHead>Status Resultante</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    {rule.tipos_manutencao?.descricao || 'N/A'}
                  </TableCell>
                  <TableCell>{getStatusLabel(rule.status_resultante)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rule.id && handleDeleteRule(rule.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rules.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma regra cadastrada
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceRulesManager;
