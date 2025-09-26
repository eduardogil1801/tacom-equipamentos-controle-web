
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Download, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useHybridAuth';
import { toast } from '@/hooks/use-toast';
// import * as XLSX from 'xlsx'; // Removed for compatibility

interface FleetData {
  id: string;
  nome_empresa: string;
  cod_operadora: string;
  mes_referencia: string;
  simples_sem_imagem: number;
  simples_com_imagem: number;
  secao: number;
  telemetria: number;
  nuvem: number;
  citgis: number;
  buszoom: number;
  total: number;
  usuario_responsavel: string;
  created_at: string;
  updated_at: string;
}

const FleetManagement: React.FC = () => {
  const { user, checkPermission } = useAuth();
  const [fleetData, setFleetData] = useState<FleetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFleet, setEditingFleet] = useState<FleetData | null>(null);
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [codOperadora, setCodOperadora] = useState('');
  const [mesReferencia, setMesReferencia] = useState('');
  const [simplesSemImagem, setSimplesSemImagem] = useState(0);
  const [simplesComImagem, setSimplesComImagem] = useState(0);
  const [secao, setSecao] = useState(0);
  const [telemetria, setTelemetria] = useState(0);
  const [nuvem, setNuvem] = useState(0);
  const [citgis, setCitgis] = useState(0);
  const [buszoom, setBuszoom] = useState(0);
  const [total, setTotal] = useState(0);
  const [usuarioResponsavel, setUsuarioResponsavel] = useState('');

  // Verificar permissões
  const canView = user?.userType === 'administrador' || checkPermission('fleet', 'view');
  const canCreate = user?.userType === 'administrador' || checkPermission('fleet', 'create');
  const canEdit = user?.userType === 'administrador' || checkPermission('fleet', 'edit');
  const canDelete = user?.userType === 'administrador' || checkPermission('fleet', 'delete');

  // Se não tem permissão para visualizar, mostrar mensagem de acesso negado
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-96 p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Shield className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">
              Acesso Negado
            </h2>
            <p className="text-gray-500">
              Você não possui permissão para acessar o módulo de frota. 
              Entre em contato com o administrador do sistema.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    loadFleetData();
  }, []);

  const loadFleetData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('frota')
        .select('*')
        .order('mes_referencia', { ascending: false });

      if (error) throw error;
      setFleetData(data || []);
    } catch (error) {
      console.error('Error loading fleet data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da frota.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingFleet(null);
    setShowForm(true);
  };

  const handleEdit = (fleet: FleetData) => {
    setEditingFleet(fleet);
    setNomeEmpresa(fleet.nome_empresa);
    setCodOperadora(fleet.cod_operadora);
    // Converter data para MM/YYYY
    const date = new Date(fleet.mes_referencia);
    const formattedDate = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    setMesReferencia(formattedDate);
    setSimplesSemImagem(fleet.simples_sem_imagem);
    setSimplesComImagem(fleet.simples_com_imagem);
    setSecao(fleet.secao);
    setTelemetria(fleet.telemetria);
    setNuvem(fleet.nuvem);
    setCitgis(fleet.citgis);
    setBuszoom(fleet.buszoom);
    setTotal(fleet.total);
    setUsuarioResponsavel(fleet.usuario_responsavel);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro de frota?')) {
      try {
        const { error } = await supabase
          .from('frota')
          .delete()
          .eq('id', id);

        if (error) throw error;
        loadFleetData();
        toast({
          title: "Sucesso",
          description: "Registro de frota excluído com sucesso!",
        });
      } catch (error) {
        console.error('Error deleting fleet data:', error);
        toast({
          title: "Erro",
          description: "Erro ao excluir registro de frota.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingFleet(null);
    clearFormFields();
  };

  const clearFormFields = () => {
    setNomeEmpresa('');
    setCodOperadora('');
    setMesReferencia('');
    setSimplesSemImagem(0);
    setSimplesComImagem(0);
    setSecao(0);
    setTelemetria(0);
    setNuvem(0);
    setCitgis(0);
    setBuszoom(0);
    setTotal(0);
    setUsuarioResponsavel('');
  };

  const formatDateForDatabase = (mmYyyy: string) => {
    const [month, year] = mmYyyy.split('/');
    return `${year}-${month.padStart(2, '0')}-01`;
  };

  const handleFormSave = async () => {
    try {
      setLoading(true);
      
      // Converter MM/YYYY para formato de data do banco
      const databaseDate = formatDateForDatabase(mesReferencia);
      
      const fleetDataToSave = {
        nome_empresa: nomeEmpresa,
        cod_operadora: codOperadora,
        mes_referencia: databaseDate,
        simples_sem_imagem: simplesSemImagem,
        simples_com_imagem: simplesComImagem,
        secao: secao,
        telemetria: telemetria,
        nuvem: nuvem,
        citgis: citgis,
        buszoom: buszoom,
        total: total,
        usuario_responsavel: usuarioResponsavel,
      };

      if (editingFleet) {
        // Update existing fleet data
        const { error } = await supabase
          .from('frota')
          .update(fleetDataToSave)
          .eq('id', editingFleet.id);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Registro de frota atualizado com sucesso!",
        });
      } else {
        // Insert new fleet data
        const { error } = await supabase
          .from('frota')
          .insert([fleetDataToSave]);

        if (error) throw error;
        toast({
          title: "Sucesso",
          description: "Registro de frota criado com sucesso!",
        });
      }

      loadFleetData();
      handleFormClose();
    } catch (error) {
      console.error('Error saving fleet data:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar registro de frota.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    alert("Exportação para Excel não disponível no momento");
  };

  const formatMesReferenciaDisplay = (mesReferencia: string) => {
    const date = new Date(mesReferencia);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>{editingFleet ? 'Editar Frota' : 'Nova Frota'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome_empresa">Nome da Empresa</Label>
                <Input
                  id="nome_empresa"
                  type="text"
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cod_operadora">Código da Operadora</Label>
                <Input
                  id="cod_operadora"
                  type="text"
                  value={codOperadora}
                  onChange={(e) => setCodOperadora(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="mes_referencia">Mês de Referência (MM/YYYY)</Label>
                <Input
                  id="mes_referencia"
                  type="text"
                  placeholder="MM/YYYY"
                  value={mesReferencia}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 2) {
                      setMesReferencia(value);
                    } else if (value.length <= 6) {
                      setMesReferencia(value.slice(0, 2) + '/' + value.slice(2));
                    }
                  }}
                  maxLength={7}
                />
              </div>
              <div>
                <Label htmlFor="simples_sem_imagem">Simples Sem Imagem</Label>
                <Input
                  id="simples_sem_imagem"
                  type="number"
                  value={simplesSemImagem}
                  onChange={(e) => setSimplesSemImagem(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="simples_com_imagem">Simples Com Imagem</Label>
                <Input
                  id="simples_com_imagem"
                  type="number"
                  value={simplesComImagem}
                  onChange={(e) => setSimplesComImagem(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="secao">Seção</Label>
                <Input
                  id="secao"
                  type="number"
                  value={secao}
                  onChange={(e) => setSecao(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="telemetria">Telemetria</Label>
                <Input
                  id="telemetria"
                  type="number"
                  value={telemetria}
                  onChange={(e) => setTelemetria(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="nuvem">Nuvem</Label>
                <Input
                  id="nuvem"
                  type="number"
                  value={nuvem}
                  onChange={(e) => setNuvem(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="citgis">Citgis</Label>
                <Input
                  id="citgis"
                  type="number"
                  value={citgis}
                  onChange={(e) => setCitgis(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="buszoom">Buszoom</Label>
                <Input
                  id="buszoom"
                  type="number"
                  value={buszoom}
                  onChange={(e) => setBuszoom(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="total">Total</Label>
                <Input
                  id="total"
                  type="number"
                  value={total}
                  onChange={(e) => setTotal(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="usuario_responsavel">Usuário Responsável</Label>
                <Input
                  id="usuario_responsavel"
                  type="text"
                  value={usuarioResponsavel}
                  onChange={(e) => setUsuarioResponsavel(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={handleFormClose}>
                Cancelar
              </Button>
              <Button onClick={handleFormSave} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestão de Frota</h1>
        <div className="flex gap-2">
          <Button 
            onClick={exportToExcel}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          {canCreate && (
            <Button 
              onClick={handleAddNew}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Frota
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Frota</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Operadora</TableHead>
                <TableHead>Mês</TableHead>
                <TableHead>Simples s/ Imagem</TableHead>
                <TableHead>Simples c/ Imagem</TableHead>
                <TableHead>Seção</TableHead>
                <TableHead>Telemetria</TableHead>
                <TableHead>Nuvem</TableHead>
                <TableHead>Citgis</TableHead>
                <TableHead>Buszoom</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Responsável</TableHead>
                {canEdit || canDelete ? <TableHead>Ações</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {fleetData.map((fleet) => (
                <TableRow key={fleet.id}>
                  <TableCell>{fleet.nome_empresa}</TableCell>
                  <TableCell>{fleet.cod_operadora}</TableCell>
                  <TableCell>{formatMesReferenciaDisplay(fleet.mes_referencia)}</TableCell>
                  <TableCell>{fleet.simples_sem_imagem}</TableCell>
                  <TableCell>{fleet.simples_com_imagem}</TableCell>
                  <TableCell>{fleet.secao}</TableCell>
                  <TableCell>{fleet.telemetria}</TableCell>
                  <TableCell>{fleet.nuvem}</TableCell>
                  <TableCell>{fleet.citgis}</TableCell>
                  <TableCell>{fleet.buszoom}</TableCell>
                  <TableCell>{fleet.total}</TableCell>
                  <TableCell>{fleet.usuario_responsavel}</TableCell>
                  {canEdit || canDelete ? (
                    <TableCell>
                      <div className="flex gap-2">
                        {canEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(fleet)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(fleet.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetManagement;
