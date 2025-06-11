
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, Trash, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface FleetData {
  id?: string;
  cod_operadora: string;
  nome_empresa: string;
  mes_referencia: string;
  simples_com_imagem: number;
  simples_sem_imagem: number;
  secao: number;
  citgis: number;
  buszoom: number;
  nuvem: number;
  telemetria: number;
  total: number;
  usuario_responsavel?: string;
}

interface Company {
  id: string;
  name: string;
}

// Função para formatar números com pontos
const formatNumber = (num: number): string => {
  return num.toLocaleString('pt-BR');
};

// Mapeamento de operadoras com código primeiro
const operadoraMapping: { [key: string]: string } = {
  '9': 'Guaíba',
  '11': 'Itapuã',
  '12': 'Sogal',
  '13': 'Sogil',
  '14': 'Soul',
  '15': 'Transcal',
  '16': 'Viamão',
  '20': 'Sti',
  '21': 'Transbus',
  '23': 'Tc_Sapi',
  '26': 'Sapucaia',
  '27': 'Cmt',
  '29': 'Central',
  '32': 'Catsul',
  '34': 'Trensurb',
  '41': 'Nova Santa Rita',
  '42': 'Hamburguesa',
  '46': 'Parobe',
  '47': 'Soul Municipal'
};

const FleetManagement: React.FC = () => {
  const { user } = useAuth();
  const [fleetData, setFleetData] = useState<FleetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFleet, setEditingFleet] = useState<FleetData | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState<FleetData>({
    cod_operadora: '',
    nome_empresa: '',
    mes_referencia: '',
    simples_com_imagem: 0,
    simples_sem_imagem: 0,
    secao: 0,
    citgis: 0,
    buszoom: 0,
    nuvem: 0,
    telemetria: 0,
    total: 0
  });

  useEffect(() => {
    loadFleetData();
    loadCompanies();
  }, []);

  useEffect(() => {
    calculateTotalFleet();
  }, [formData.simples_com_imagem, formData.simples_sem_imagem, formData.secao]);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Erro ao carregar operadoras:', error);
    }
  };

  const loadFleetData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('frota')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Ensure telemetria field exists with default value
      const formattedData = (data || []).map(item => ({
        ...item,
        telemetria: item.telemetria || 0
      }));
      
      setFleetData(formattedData);
    } catch (error) {
      console.error('Erro ao carregar dados da frota:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da frota",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalFleet = () => {
    // Total da frota = apenas Simples C/Imagem + Simples S/Imagem + Seção
    const totalFleet = 
      formData.simples_com_imagem +
      formData.simples_sem_imagem +
      formData.secao;
    
    setFormData(prev => ({ 
      ...prev, 
      total: totalFleet,
      nuvem: totalFleet // Nuvem = Total da Frota automaticamente
    }));
  };

  const handleInputChange = (field: keyof FleetData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' && field !== 'cod_operadora' && field !== 'nome_empresa' && field !== 'mes_referencia' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  const handleOperadoraChange = (codigo: string) => {
    const nomeOperadora = operadoraMapping[codigo] || '';
    setFormData(prev => ({ 
      ...prev, 
      cod_operadora: codigo,
      nome_empresa: nomeOperadora
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cod_operadora || !formData.nome_empresa || !formData.mes_referencia) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Converter YYYY-MM para YYYY-MM-01 para formato DATE
      const mesReferenciaFormatted = formData.mes_referencia + '-01';
      
      const fleetDataWithUser = {
        ...formData,
        mes_referencia: mesReferenciaFormatted,
        usuario_responsavel: user?.username || user?.name || 'Sistema'
      };

      if (editingFleet && editingFleet.id) {
        const { error } = await supabase
          .from('frota')
          .update(fleetDataWithUser)
          .eq('id', editingFleet.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Dados da frota atualizados com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('frota')
          .insert([fleetDataWithUser]);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Dados da frota cadastrados com sucesso!",
        });
      }

      resetForm();
      loadFleetData();
    } catch (error) {
      console.error('Erro ao salvar dados da frota:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar dados da frota",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (fleet: FleetData) => {
    setEditingFleet(fleet);
    // Converter YYYY-MM-DD de volta para YYYY-MM para o input
    const mesReferencia = fleet.mes_referencia ? fleet.mes_referencia.substring(0, 7) : '';
    setFormData({
      ...fleet,
      mes_referencia: mesReferencia
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir estes dados da frota?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('frota')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Dados da frota excluídos com sucesso!",
      });
      
      loadFleetData();
    } catch (error) {
      console.error('Erro ao excluir dados da frota:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir dados da frota",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      cod_operadora: '',
      nome_empresa: '',
      mes_referencia: '',
      simples_com_imagem: 0,
      simples_sem_imagem: 0,
      secao: 0,
      citgis: 0,
      buszoom: 0,
      nuvem: 0,
      telemetria: 0,
      total: 0
    });
    setEditingFleet(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando dados da frota...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Cadastro de Frota</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Frota
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingFleet ? 'Editar' : 'Adicionar'} Dados da Frota</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cod_operadora">Código da Operadora *</Label>
                  <Select 
                    value={formData.cod_operadora || undefined} 
                    onValueChange={(value) => {
                      handleOperadoraChange(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o código" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(operadoraMapping).map(([codigo, nome]) => (
                        <SelectItem key={codigo} value={codigo}>
                          {codigo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nome_empresa">Operadora *</Label>
                  <Input
                    id="nome_empresa"
                    value={formData.nome_empresa}
                    readOnly
                    className="bg-gray-100"
                    placeholder="Operadora automática"
                  />
                </div>
                <div>
                  <Label htmlFor="mes_referencia">Mês de Referência *</Label>
                  <Input
                    id="mes_referencia"
                    type="month"
                    value={formData.mes_referencia}
                    onChange={(e) => handleInputChange('mes_referencia', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="simples_com_imagem">Simples C/Imagem</Label>
                  <Input
                    id="simples_com_imagem"
                    type="number"
                    min="0"
                    value={formData.simples_com_imagem}
                    onChange={(e) => handleInputChange('simples_com_imagem', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="simples_sem_imagem">Simples S/Imagem</Label>
                  <Input
                    id="simples_sem_imagem"
                    type="number"
                    min="0"
                    value={formData.simples_sem_imagem}
                    onChange={(e) => handleInputChange('simples_sem_imagem', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="secao">Seção</Label>
                  <Input
                    id="secao"
                    type="number"
                    min="0"
                    value={formData.secao}
                    onChange={(e) => handleInputChange('secao', e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-lg font-semibold text-blue-800">
                  Total da Frota: {formatNumber(formData.total)} equipamentos
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  (Simples C/Imagem + Simples S/Imagem + Seção)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="nuvem">Nuvem (Automático)</Label>
                  <Input
                    id="nuvem"
                    type="number"
                    value={formData.nuvem}
                    readOnly
                    className="bg-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="citgis">CITGIS</Label>
                  <Input
                    id="citgis"
                    type="number"
                    min="0"
                    value={formData.citgis}
                    onChange={(e) => handleInputChange('citgis', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="buszoom">BUSZOOM</Label>
                  <Input
                    id="buszoom"
                    type="number"
                    min="0"
                    value={formData.buszoom}
                    onChange={(e) => handleInputChange('buszoom', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="telemetria">Telemetria</Label>
                  <Input
                    id="telemetria"
                    type="number"
                    min="0"
                    value={formData.telemetria}
                    onChange={(e) => handleInputChange('telemetria', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {editingFleet ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Frotas */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Frota Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Código</th>
                  <th className="text-left p-3">Operadora</th>
                  <th className="text-left p-3">Mês</th>
                  <th className="text-left p-3">Simples C/Img</th>
                  <th className="text-left p-3">Simples S/Img</th>
                  <th className="text-left p-3">Seção</th>
                  <th className="text-left p-3">Total Frota</th>
                  <th className="text-left p-3">Nuvem</th>
                  <th className="text-left p-3">CITGIS</th>
                  <th className="text-left p-3">BUSZOOM</th>
                  <th className="text-left p-3">Telemetria</th>
                  <th className="text-left p-3">Responsável</th>
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {fleetData.map(fleet => (
                  <tr key={fleet.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{fleet.cod_operadora}</td>
                    <td className="p-3">{fleet.nome_empresa}</td>
                    <td className="p-3">{new Date(fleet.mes_referencia).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit' })}</td>
                    <td className="p-3">{formatNumber(fleet.simples_com_imagem || 0)}</td>
                    <td className="p-3">{formatNumber(fleet.simples_sem_imagem || 0)}</td>
                    <td className="p-3">{formatNumber(fleet.secao || 0)}</td>
                    <td className="p-3 font-bold text-blue-600">{formatNumber(fleet.total || 0)}</td>
                    <td className="p-3">{formatNumber(fleet.nuvem || 0)}</td>
                    <td className="p-3">{formatNumber(fleet.citgis || 0)}</td>
                    <td className="p-3">{formatNumber(fleet.buszoom || 0)}</td>
                    <td className="p-3">{formatNumber(fleet.telemetria || 0)}</td>
                    <td className="p-3">{fleet.usuario_responsavel || '-'}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(fleet)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fleet.id && handleDelete(fleet.id)}
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
            {fleetData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum dado de frota cadastrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetManagement;
