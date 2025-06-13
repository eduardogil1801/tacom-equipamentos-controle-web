
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import EquipmentSearchDialog from './EquipmentSearchDialog';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  modelo?: string;
  empresas?: {
    name: string;
  };
}

interface Company {
  id: string;
  name: string;
}

interface MovementPageProps {
  onBack: () => void;
}

const MovementPage: React.FC<MovementPageProps> = ({ onBack }) => {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [movementData, setMovementData] = useState({
    tipo_movimento: '',
    data_movimento: '',
    observacoes: '',
    usuario_responsavel: '',
    empresa_destino: ''
  });

  useEffect(() => {
    loadCompanies();
    // Definir data atual
    const hoje = new Date();
    const dataFormatada = hoje.getFullYear() + '-' + 
                        String(hoje.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(hoje.getDate()).padStart(2, '0');
    
    setMovementData(prev => ({
      ...prev,
      data_movimento: dataFormatada
    }));
  }, []);

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('empresas')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar empresas.",
        variant: "destructive",
      });
    }
  };

  const handleEquipmentSelect = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowSearch(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setMovementData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEquipment || !movementData.tipo_movimento || !movementData.data_movimento) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('=== PROCESSANDO MOVIMENTAÇÃO ===');
      console.log('Equipamento selecionado:', selectedEquipment);
      console.log('Dados da movimentação:', movementData);

      // 1. Registrar a movimentação
      const { error: movementError } = await supabase
        .from('movimentacoes')
        .insert({
          id_equipamento: selectedEquipment.id,
          tipo_movimento: movementData.tipo_movimento,
          data_movimento: movementData.data_movimento,
          observacoes: movementData.observacoes || null,
          usuario_responsavel: movementData.usuario_responsavel || null
        });

      if (movementError) {
        console.error('Erro ao inserir movimentação:', movementError);
        throw movementError;
      }

      console.log('Movimentação registrada com sucesso');

      // 2. Atualizar o equipamento baseado no tipo de movimento
      let updateData: any = {};

      if (movementData.tipo_movimento === 'saida') {
        updateData.data_saida = movementData.data_movimento;
        updateData.status = 'em_uso';
      } else if (movementData.tipo_movimento === 'entrada') {
        updateData.data_saida = null;
        updateData.status = 'disponivel';
      } else if (movementData.tipo_movimento === 'movimentacao' && movementData.empresa_destino) {
        // Para movimentação entre empresas, atualizar a empresa
        updateData.id_empresa = movementData.empresa_destino;
        updateData.status = 'disponivel'; // Equipamento fica disponível na nova empresa
      } else if (movementData.tipo_movimento === 'manutencao') {
        updateData.status = 'manutencao';
      } else if (movementData.tipo_movimento === 'aguardando_manutencao') {
        updateData.status = 'aguardando_manutencao';
      } else if (movementData.tipo_movimento === 'danificado') {
        updateData.status = 'danificado';
      } else if (movementData.tipo_movimento === 'indisponivel') {
        updateData.status = 'indisponivel';
      }

      console.log('Dados para atualizar equipamento:', updateData);

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('equipamentos')
          .update(updateData)
          .eq('id', selectedEquipment.id);

        if (updateError) {
          console.error('Erro ao atualizar equipamento:', updateError);
          throw updateError;
        }

        console.log('Equipamento atualizado com sucesso');
      }

      toast({
        title: "Sucesso",
        description: "Movimentação registrada com sucesso!",
      });

      // Resetar formulário
      setSelectedEquipment(null);
      setMovementData({
        tipo_movimento: '',
        data_movimento: new Date().toISOString().split('T')[0],
        observacoes: '',
        usuario_responsavel: '',
        empresa_destino: ''
      });

    } catch (error) {
      console.error('Erro ao processar movimentação:', error);
      toast({
        title: "Erro",
        description: "Erro ao registrar movimentação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Movimentação de Equipamentos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Movimentação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Seleção do Equipamento */}
            <div>
              <Label>Equipamento *</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  {selectedEquipment ? (
                    <div className="p-3 border rounded-lg bg-gray-50">
                      <p className="font-medium">{selectedEquipment.numero_serie}</p>
                      <p className="text-sm text-gray-600">
                        {selectedEquipment.tipo} {selectedEquipment.modelo && `- ${selectedEquipment.modelo}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        Empresa: {selectedEquipment.empresas?.name || 'N/A'}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 border rounded-lg border-dashed">
                      <p className="text-gray-500">Nenhum equipamento selecionado</p>
                    </div>
                  )}
                </div>
                <Button type="button" onClick={() => setShowSearch(true)}>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo_movimento">Tipo de Movimento *</Label>
                <Select
                  value={movementData.tipo_movimento}
                  onValueChange={(value) => handleInputChange('tipo_movimento', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="movimentacao">Movimentação</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="aguardando_manutencao">Aguardando Manutenção</SelectItem>
                    <SelectItem value="danificado">Danificado</SelectItem>
                    <SelectItem value="indisponivel">Indisponível</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="data_movimento">Data do Movimento *</Label>
                <Input
                  id="data_movimento"
                  type="date"
                  value={movementData.data_movimento}
                  onChange={(e) => handleInputChange('data_movimento', e.target.value)}
                  required
                />
              </div>

              {movementData.tipo_movimento === 'movimentacao' && (
                <div>
                  <Label htmlFor="empresa_destino">Empresa Destino</Label>
                  <Select
                    value={movementData.empresa_destino}
                    onValueChange={(value) => handleInputChange('empresa_destino', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="usuario_responsavel">Usuário Responsável</Label>
                <Input
                  id="usuario_responsavel"
                  value={movementData.usuario_responsavel}
                  onChange={(e) => handleInputChange('usuario_responsavel', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={movementData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Registrando...' : 'Registrar Movimentação'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {showSearch && (
        <EquipmentSearchDialog
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
          onSelectEquipment={handleEquipmentSelect}
        />
      )}
    </div>
  );
};

export default MovementPage;
