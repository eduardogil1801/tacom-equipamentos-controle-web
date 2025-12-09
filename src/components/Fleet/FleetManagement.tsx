import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useHybridAuth';
import { Plus, Edit, Trash2, Download, Shield, ArrowLeft, FileText } from 'lucide-react';
import FleetForm from '@/components/Reports/FleetForm';
import { useNavigate } from 'react-router-dom';

interface FleetData {
  id: string;
  nome_empresa: string;
  cod_operadora: string;
  mes_referencia: string;
  simples_sem_imagem: number;
  simples_com_imagem: number;
  secao: number;
  nuvem: number;
  telemetria: number;
  citgis: number;
  buszoom: number;
  total: number;
  usuario_responsavel: string;
  created_at: string;
}

const FleetManagement: React.FC = () => {
  const { user, checkPermission } = useAuth();
  const [fleetData, setFleetData] = useState<FleetData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFleet, setEditingFleet] = useState<FleetData | null>(null);

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
    if (!showForm) {
      loadFleetData();
    }
  }, [showForm]);

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
    console.log('Clicou em Nova Frota');
    setEditingFleet(null);
    setShowForm(true);
  };

  const handleEdit = (fleet: FleetData) => {
    console.log('Editando frota:', fleet);
    setEditingFleet(fleet);
    setShowForm(true);
  };

  const handleBackToList = () => {
    console.log('Voltando para lista');
    setShowForm(false);
    setEditingFleet(null);
    loadFleetData(); // Recarregar dados quando voltar
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este registro de frota?')) {
      try {
        const { error } = await supabase
          .from('frota')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Registro de frota excluído com sucesso!",
        });

        loadFleetData();
      } catch (error) {
        console.error('Error deleting fleet record:', error);
        toast({
          title: "Erro",
          description: "Erro ao excluir registro de frota.",
          variant: "destructive",
        });
      }
    }
  };

  const formatMesReferenciaDisplay = (mesReferencia: string) => {
    console.log('Formatando data para exibição:', mesReferencia);
    
    if (!mesReferencia) return '';
    
    // Se está no formato YYYY-MM-DD, extrair apenas YYYY-MM
    let dateToFormat = mesReferencia;
    if (mesReferencia.length === 10) {
      dateToFormat = mesReferencia.substring(0, 7);
    }
    
    // Se está no formato YYYY-MM, converter para MM/YYYY
    if (dateToFormat.includes('-') && dateToFormat.length === 7) {
      const [year, month] = dateToFormat.split('-');
      const result = `${month}/${year}`;
      console.log('Data formatada:', mesReferencia, '→', result);
      return result;
    }
    
    // Fallback: tentar criar uma data
    try {
      const date = new Date(mesReferencia + (mesReferencia.length === 7 ? '-01' : ''));
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const result = `${month}/${year}`;
      console.log('Data formatada via Date:', mesReferencia, '→', result);
      return result;
    } catch (error) {
      console.error('Erro ao formatar data:', mesReferencia, error);
      return mesReferencia;
    }
  };

  const formatNumber = (num: number): string => {
    return num?.toLocaleString('pt-BR') || '0';
  };

  const exportToExcel = () => {
    // Implementar exportação para Excel se necessário
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de exportação será implementada em breve.",
    });
  };

  // Se está mostrando o formulário, renderizar o FleetForm com dados de edição
  if (showForm) {
    return (
      <div>
        {/* Botão de voltar */}
        <div className="mb-4">
          <Button
            onClick={handleBackToList}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Lista
          </Button>
        </div>
        
        {/* Renderizar o formulário com dados de edição se existir */}
        <FleetForm editingData={editingFleet} onSaveSuccess={handleBackToList} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestão de Frota</h1>
        <div className="flex gap-2">
          {/* Atalho para Relatório de Faturamento por Serviço */}
          <Button 
            onClick={() => {
              // Navegar para relatórios com filtro de billing services usando navigate
              const event = new CustomEvent('navigateToPage', { 
                detail: { page: 'reports', report: 'billing-services' }
              });
              window.dispatchEvent(event);
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Faturamento por Serviço
          </Button>
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
          {fleetData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhum registro de frota encontrado.</p>
              {canCreate && (
                <Button 
                  onClick={handleAddNew} 
                  className="mt-4"
                >
                  Criar Primeiro Registro
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome da Empresa</TableHead>
                      <TableHead>Cód Operadora</TableHead>
                      <TableHead>Mês Referência</TableHead>
                      <TableHead>Simples S/Image</TableHead>
                      <TableHead>Simples C/Image</TableHead>
                      <TableHead>Seção</TableHead>
                      <TableHead className="bg-blue-50">Nuvem</TableHead>
                      <TableHead className="bg-green-50">Total Bilhetagem</TableHead>
                      <TableHead>Telemetria</TableHead>
                      <TableHead>CITGIS</TableHead>
                      <TableHead>BUSZOOM</TableHead>
                      <TableHead className="bg-orange-50">Total Geral</TableHead>
                      <TableHead>Responsável</TableHead>
                      {(canEdit || canDelete) && <TableHead>Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fleetData.map((fleet) => (
                      <TableRow key={fleet.id}>
                        <TableCell className="font-medium">{fleet.nome_empresa}</TableCell>
                        <TableCell>{fleet.cod_operadora}</TableCell>
                        <TableCell>{formatMesReferenciaDisplay(fleet.mes_referencia)}</TableCell>
                        <TableCell>{formatNumber(fleet.simples_sem_imagem)}</TableCell>
                        <TableCell>{formatNumber(fleet.simples_com_imagem)}</TableCell>
                        <TableCell>{formatNumber(fleet.secao)}</TableCell>
                        <TableCell className="bg-blue-50 font-semibold text-blue-700">
                          {formatNumber(fleet.nuvem)}
                        </TableCell>
                        <TableCell className="bg-green-50 font-semibold text-green-700">
                          {formatNumber(fleet.nuvem)} {/* Total Bilhetagem = Nuvem */}
                        </TableCell>
                        <TableCell>{formatNumber(fleet.telemetria)}</TableCell>
                        <TableCell>{formatNumber(fleet.citgis)}</TableCell>
                        <TableCell>{formatNumber(fleet.buszoom)}</TableCell>
                        <TableCell className="bg-orange-50 font-semibold text-orange-700">
                          {formatNumber(fleet.total)}
                        </TableCell>
                        <TableCell className="text-sm">{fleet.usuario_responsavel}</TableCell>
                        {(canEdit || canDelete) && (
                          <TableCell>
                            <div className="flex gap-2">
                              {canEdit && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(fleet)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canDelete && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(fleet.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {fleetData.map((fleet) => (
                  <Card key={fleet.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-sm">{fleet.nome_empresa}</p>
                            <p className="text-xs text-gray-600">Código: {fleet.cod_operadora}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Mês:</p>
                            <p className="text-sm font-medium">
                              {formatMesReferenciaDisplay(fleet.mes_referencia)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-gray-500">Simples S/Img:</p>
                            <p className="font-medium">{formatNumber(fleet.simples_sem_imagem)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Simples C/Img:</p>
                            <p className="font-medium">{formatNumber(fleet.simples_com_imagem)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Seção:</p>
                            <p className="font-medium">{formatNumber(fleet.secao)}</p>
                          </div>
                          <div className="bg-blue-50 p-2 rounded">
                            <p className="text-blue-700 font-semibold">Nuvem:</p>
                            <p className="font-bold text-blue-800">{formatNumber(fleet.nuvem)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Telemetria:</p>
                            <p className="font-medium">{formatNumber(fleet.telemetria)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">CITGIS:</p>
                            <p className="font-medium">{formatNumber(fleet.citgis)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">BUSZOOM:</p>
                            <p className="font-medium">{formatNumber(fleet.buszoom)}</p>
                          </div>
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-green-700 font-semibold">Total:</p>
                            <p className="font-bold text-green-800">{formatNumber(fleet.total)}</p>
                          </div>
                        </div>

                        <div className="border-t pt-2">
                          <p className="text-xs text-gray-500">Responsável: {fleet.usuario_responsavel}</p>
                        </div>

                        {(canEdit || canDelete) && (
                          <div className="flex gap-2 justify-end pt-2">
                            {canEdit && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(fleet)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Editar
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(fleet.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Excluir
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetManagement;