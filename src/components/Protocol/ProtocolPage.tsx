
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import jsPDF from 'jspdf';

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

interface User {
  id: string;
  nome: string;
  username: string;
}

const ProtocolPage: React.FC = () => {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [showEquipmentList, setShowEquipmentList] = useState(false);

  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    empresa_destinataria: '',
    responsavel_recebimento: user?.name || '',
    data_recebimento: new Date().toISOString().split('T')[0],
    observacoes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Atualizar o responsável quando o usuário for carregado
    if (user?.name) {
      setFormData(prev => ({ ...prev, responsavel_recebimento: user.name }));
    }
  }, [user]);

  useEffect(() => {
    if (searchTerm.length >= 3) {
      const filtered = equipment.filter(eq => 
        eq.numero_serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.tipo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEquipment(filtered);
      setShowEquipmentList(true);
    } else {
      setFilteredEquipment([]);
      setShowEquipmentList(false);
    }
  }, [searchTerm, equipment]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Carregar equipamentos
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name
          )
        `)
        .eq('status', 'disponivel')
        .order('numero_serie');

      if (equipmentError) throw equipmentError;
      setEquipment(equipmentData || []);

      // Carregar empresas
      const { data: companiesData, error: companiesError } = await supabase
        .from('empresas')
        .select('*')
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

  const handleEquipmentSelect = (equipment: Equipment) => {
    if (!selectedEquipment.includes(equipment.id)) {
      setSelectedEquipment(prev => [...prev, equipment.id]);
    }
    setSearchTerm('');
    setShowEquipmentList(false);
  };

  const removeEquipment = (equipmentId: string) => {
    setSelectedEquipment(prev => prev.filter(id => id !== equipmentId));
  };

  const generateProtocol = () => {
    // Validar campos obrigatórios
    if (!formData.empresa_destinataria) {
      toast({
        title: "Erro",
        description: "Selecione a empresa destinatária",
        variant: "destructive",
      });
      return;
    }

    if (!formData.responsavel_recebimento) {
      toast({
        title: "Erro",
        description: "Informe o responsável pelo recebimento",
        variant: "destructive",
      });
      return;
    }

    if (!formData.data_recebimento) {
      toast({
        title: "Erro",
        description: "Informe a data de recebimento",
        variant: "destructive",
      });
      return;
    }

    if (selectedEquipment.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um equipamento",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Cabeçalho
      doc.setFontSize(18);
      doc.text('TERMO DE RECEBIMENTO DE EQUIPAMENTOS', 14, 22);
      
      doc.setFontSize(12);
      doc.text(`Data: ${new Date(formData.data_recebimento).toLocaleDateString('pt-BR')}`, 14, 35);
      
      // Dados da empresa
      const selectedCompany = companies.find(c => c.id === formData.empresa_destinataria);
      doc.text(`Empresa Destinatária: ${selectedCompany?.name || 'N/A'}`, 14, 45);
      doc.text(`Responsável: ${formData.responsavel_recebimento}`, 14, 55);
      
      // Lista de equipamentos
      doc.text('EQUIPAMENTOS RECEBIDOS:', 14, 70);
      
      let yPosition = 80;
      const selectedEquipmentData = equipment.filter(eq => selectedEquipment.includes(eq.id));
      
      selectedEquipmentData.forEach((eq, index) => {
        doc.text(`${index + 1}. ${eq.numero_serie} - ${eq.tipo}${eq.modelo ? ` (${eq.modelo})` : ''}`, 20, yPosition);
        yPosition += 8;
      });
      
      // Observações
      if (formData.observacoes) {
        yPosition += 10;
        doc.text('OBSERVAÇÕES:', 14, yPosition);
        yPosition += 10;
        
        const observacoes = doc.splitTextToSize(formData.observacoes, 180);
        doc.text(observacoes, 14, yPosition);
        yPosition += observacoes.length * 6;
      }
      
      // Assinaturas
      yPosition += 20;
      doc.text('_________________________________', 14, yPosition + 20);
      doc.text('Assinatura do Responsável', 14, yPosition + 30);
      
      doc.text('_________________________________', 120, yPosition + 20);
      doc.text('Assinatura da Empresa', 120, yPosition + 30);
      
      // Rodapé
      doc.setFontSize(10);
      doc.text(`Gerado por: ${user?.username || user?.name || 'Sistema'}`, 14, 280);
      doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 290);
      
      doc.save(`termo-recebimento-${Date.now()}.pdf`);
      
      toast({
        title: "Sucesso",
        description: "Termo de recebimento gerado com sucesso!",
      });
      
      // Limpar formulário
      setFormData({
        empresa_destinataria: '',
        responsavel_recebimento: user?.name || '',
        data_recebimento: new Date().toISOString().split('T')[0],
        observacoes: ''
      });
      setSelectedEquipment([]);
      
    } catch (error) {
      console.error('Erro ao gerar termo:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar termo de recebimento",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gerar Termo de Recebimento</h1>
        <FileText className="h-8 w-8 text-blue-600" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Termo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="empresa_destinataria">Empresa Destinatária *</Label>
              <Select 
                value={formData.empresa_destinataria} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, empresa_destinataria: value }))}
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
              <Label htmlFor="data_recebimento">Data de Recebimento *</Label>
              <Input
                id="data_recebimento"
                type="date"
                value={formData.data_recebimento}
                onChange={(e) => setFormData(prev => ({ ...prev, data_recebimento: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="responsavel_recebimento">Responsável pelo Recebimento *</Label>
            <Input
              id="responsavel_recebimento"
              value={formData.responsavel_recebimento}
              onChange={(e) => setFormData(prev => ({ ...prev, responsavel_recebimento: e.target.value }))}
              placeholder="Nome do responsável"
              required
            />
          </div>

          <div className="relative">
            <Label htmlFor="equipamentos">Equipamentos *</Label>
            <div className="relative">
              <Input
                id="equipamentos"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite pelo menos 3 caracteres para buscar equipamentos..."
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            
            {showEquipmentList && filteredEquipment.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredEquipment.map(equipment => (
                  <div 
                    key={equipment.id} 
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b"
                    onClick={() => handleEquipmentSelect(equipment)}
                  >
                    <div className="font-medium">{equipment.numero_serie}</div>
                    <div className="text-sm text-gray-500">
                      {equipment.tipo} {equipment.modelo ? `- ${equipment.modelo}` : ''}
                    </div>
                    <div className="text-xs text-gray-400">
                      {equipment.empresas?.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedEquipment.length > 0 && (
            <div className="space-y-2">
              <Label>Equipamentos Selecionados:</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedEquipment.map(equipmentId => {
                  const eq = equipment.find(e => e.id === equipmentId);
                  return eq ? (
                    <div key={equipmentId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{eq.numero_serie} - {eq.tipo}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeEquipment(equipmentId)}
                      >
                        ×
                      </Button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações adicionais sobre o recebimento"
              rows={3}
            />
          </div>

          <Button onClick={generateProtocol} className="w-full flex items-center gap-2">
            <Download className="h-4 w-4" />
            Gerar Termo de Recebimento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProtocolPage;
