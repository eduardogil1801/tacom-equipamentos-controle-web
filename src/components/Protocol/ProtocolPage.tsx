import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useLocalAuth';
// import jsPDF from 'jspdf'; // Removed for compatibility
// import 'jspdf-autotable'; // Removed for compatibility

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  modelo: string;
  empresa: {
    name: string;
  };
}

interface Company {
  id: string;
  name: string;
}

const ProtocolPage: React.FC = () => {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [protocolData, setProtocolData] = useState({
    company: '',
    responsible: user?.name || user?.username || '',
    date: new Date().toISOString().split('T')[0],
    observations: ''
  });
  const [loading, setLoading] = useState(false);

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR');
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    if (protocolData.company) {
      loadEquipment(protocolData.company);
    }
  }, [protocolData.company]);

  // Atualizar responsável quando o usuário mudar
  useEffect(() => {
    setProtocolData(prev => ({
      ...prev,
      responsible: user?.name || user?.username || ''
    }));
  }, [user]);

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
        description: "Erro ao carregar empresas",
        variant: "destructive",
      });
    }
  };

  const loadEquipment = async (companyId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          id,
          numero_serie,
          tipo,
          modelo,
          empresas!inner(name)
        `)
        .eq('id_empresa', companyId)
        .eq('status', 'disponivel')
        .order('numero_serie');

      if (error) throw error;
      
      const formattedData = (data || []).map(item => ({
        id: item.id,
        numero_serie: item.numero_serie,
        tipo: item.tipo,
        modelo: item.modelo || '',
        empresa: {
          name: (item.empresas as any).name
        }
      }));

      setEquipment(formattedData);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar equipamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentSelection = (equipmentId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedEquipment(prev => [...prev, equipmentId]);
    } else {
      setSelectedEquipment(prev => prev.filter(id => id !== equipmentId));
    }
  };

  const selectAllEquipment = () => {
    setSelectedEquipment(equipment.map(eq => eq.id));
  };

  const clearSelection = () => {
    setSelectedEquipment([]);
  };

  const generateProtocol = () => {
    if (selectedEquipment.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um equipamento",
        variant: "destructive",
      });
      return;
    }

    const selectedEquipmentData = equipment.filter(eq => selectedEquipment.includes(eq.id));
    const companyName = companies.find(c => c.id === protocolData.company)?.name || '';

    alert("Geração de PDF não disponível no momento");
    return;

  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Protocolo de Entrega</h1>
        <Button
          onClick={generateProtocol}
          disabled={selectedEquipment.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Gerar Protocolo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Protocolo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Empresa *</Label>
              <Select
                value={protocolData.company}
                onValueChange={(value) => setProtocolData(prev => ({ ...prev, company: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={protocolData.date}
                onChange={(e) => setProtocolData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="responsible">Responsável pelo Recebimento</Label>
              <Input
                id="responsible"
                value={protocolData.responsible}
                readOnly
                className="bg-gray-100"
                placeholder="Usuário logado automaticamente"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={protocolData.observations}
                onChange={(e) => setProtocolData(prev => ({ ...prev, observations: e.target.value }))}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {protocolData.company && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Equipamentos Disponíveis</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAllEquipment}>
                  Selecionar Todos
                </Button>
                <Button size="sm" variant="outline" onClick={clearSelection}>
                  Limpar Seleção
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Carregando equipamentos...</div>
            ) : equipment.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum equipamento disponível para esta empresa
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {equipment.map(eq => (
                  <div key={eq.id} className="flex items-center space-x-3 p-3 border rounded">
                    <input
                      type="checkbox"
                      checked={selectedEquipment.includes(eq.id)}
                      onChange={(e) => handleEquipmentSelection(eq.id, e.target.checked)}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{eq.numero_serie}</div>
                      <div className="text-sm text-gray-500">
                        {eq.tipo} {eq.modelo && `- ${eq.modelo}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {selectedEquipment.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <div className="font-medium text-blue-900">
                  {formatNumber(selectedEquipment.length)} equipamento(s) selecionado(s)
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProtocolPage;
