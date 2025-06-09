
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Calendar, Building, User, ClipboardCheck, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import jsPDF from 'jspdf';

interface Equipment {
  id: string;
  tipo: string;
  numero_serie: string;
  modelo?: string;
  data_entrada: string;
  id_empresa: string;
  empresas?: {
    name: string;
    cnpj?: string;
    contact?: string;
  };
}

interface Company {
  id: string;
  name: string;
  cnpj?: string;
  contact?: string;
}

interface SelectedEquipment {
  id: string;
  equipment_id: string;
  equipment?: Equipment;
  quantidade: number;
  unidade: string;
  referencia: string;
}

const ProtocolPage: React.FC = () => {
  const { user } = useAuth();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [originCompany, setOriginCompany] = useState('');
  const [destinationCompany, setDestinationCompany] = useState('');
  const [selectedEquipments, setSelectedEquipments] = useState<SelectedEquipment[]>([
    { id: '1', equipment_id: '', quantidade: 1, unidade: 'PC', referencia: '' }
  ]);
  const [protocolDate, setProtocolDate] = useState('');
  const [receivingDate, setReceivingDate] = useState('');
  const [serialSearch, setSerialSearch] = useState('');
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [showEquipmentList, setShowEquipmentList] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    const today = new Date().toISOString().split('T')[0];
    setProtocolDate(today);
  }, []);

  useEffect(() => {
    if (serialSearch.length > 0) {
      const filtered = equipments.filter(eq => 
        eq.numero_serie.toLowerCase().includes(serialSearch.toLowerCase())
      );
      setFilteredEquipments(filtered);
      setShowEquipmentList(filtered.length > 0);
    } else {
      setFilteredEquipments([]);
      setShowEquipmentList(false);
    }
  }, [serialSearch, equipments]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: companiesData, error: companiesError } = await supabase
        .from('empresas')
        .select('*')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      const { data: equipmentsData, error: equipmentsError } = await supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name,
            cnpj,
            contact
          )
        `)
        .order('numero_serie');

      if (equipmentsError) throw equipmentsError;
      setEquipments(equipmentsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addEquipmentToList = (equipment: Equipment) => {
    const newItem: SelectedEquipment = {
      id: Date.now().toString(),
      equipment_id: equipment.id,
      equipment: equipment,
      quantidade: 1,
      unidade: 'PC',
      referencia: equipment.numero_serie
    };

    setSelectedEquipments(prev => [...prev, newItem]);
    setSerialSearch('');
    setShowEquipmentList(false);
  };

  const removeEquipment = (id: string) => {
    if (selectedEquipments.length > 1) {
      setSelectedEquipments(prev => prev.filter(item => item.id !== id));
    }
  };

  const updateSelectedEquipment = (id: string, field: string, value: any) => {
    setSelectedEquipments(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const generateTermoPDF = () => {
    if (!originCompany || !destinationCompany || selectedEquipments.some(item => !item.equipment_id) || !protocolDate) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const originCompanyData = companies.find(c => c.id === originCompany);
    const destinationCompanyData = companies.find(c => c.id === destinationCompany);
    const validEquipments = selectedEquipments.filter(item => item.equipment_id);

    if (!originCompanyData || !destinationCompanyData || validEquipments.length === 0) {
      toast({
        title: "Erro",
        description: "Dados incompletos para gerar o termo.",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Cabeçalho
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('TERMO DE RECEBIMENTO', 105, 30, { align: 'center' });
      
      // Número do termo
      doc.setFontSize(12);
      doc.text(`N°: ${Date.now().toString().slice(-6)}`, 20, 50);
      doc.text(`Porto Alegre, ${new Date(protocolDate).toLocaleDateString('pt-BR')}`, 140, 50);
      
      // Dados da empresa origem
      doc.setFont('helvetica', 'bold');
      doc.text('De:', 20, 70);
      doc.setFont('helvetica', 'normal');
      doc.text(`${originCompanyData.name}`, 30, 70);
      doc.text(`CNPJ: ${originCompanyData.cnpj || 'N/A'}`, 30, 80);
      
      // Dados da empresa destino
      doc.setFont('helvetica', 'bold');
      doc.text('Para:', 20, 100);
      doc.setFont('helvetica', 'normal');
      doc.text(`${destinationCompanyData.name}`, 30, 100);
      doc.text(`CNPJ: ${destinationCompanyData.cnpj || 'N/A'}`, 30, 110);
      
      // Referência
      doc.setFont('helvetica', 'bold');
      doc.text('Ref.:', 20, 130);
      doc.setFont('helvetica', 'normal');
      doc.text('TERMO DE RECEBIMENTO DE EQUIPAMENTO(S)', 30, 130);
      
      // Tabela de equipamentos
      let yPosition = 160;
      
      // Cabeçalho da tabela
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPosition - 10, 170, 10, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('ITEM', 25, yPosition - 3);
      doc.text('DESCRIÇÃO EQUIPAMENTOS', 50, yPosition - 3);
      doc.text('UND', 120, yPosition - 3);
      doc.text('REFERÊNCIA / N°', 140, yPosition - 3);
      
      // Linhas da tabela
      doc.setFont('helvetica', 'normal');
      validEquipments.forEach((item, index) => {
        yPosition += 15;
        
        doc.text(String(index + 1).padStart(2, '0'), 25, yPosition);
        doc.text(item.equipment?.tipo || '', 50, yPosition);
        doc.text(item.unidade, 125, yPosition);
        doc.text(item.referencia, 145, yPosition);
        
        // Adicionar número de série na linha seguinte
        yPosition += 8;
        doc.setFontSize(8);
        doc.text(`S/N: ${item.equipment?.numero_serie || ''}`, 50, yPosition);
        doc.setFontSize(10);
      });
      
      // Rodapé
      yPosition += 30;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Favor datar, assinar recebimento e retornar 01 via do Protocolo para o Emitente.', 20, yPosition);
      
      // Área de assinaturas
      yPosition += 40;
      
      // Área "DE ACORDO"
      doc.setFillColor(255, 255, 255);
      doc.rect(130, yPosition - 5, 60, 30);
      doc.setFont('helvetica', 'bold');
      doc.text('DE ACORDO', 145, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(`RECEBIDO EM: ${receivingDate ? new Date(receivingDate).toLocaleDateString('pt-BR') : '___/___/___'}`, 135, yPosition + 10);
      doc.text('Assinatura: ________________________', 135, yPosition + 20);
      
      // Informações do usuário logado
      yPosition += 50;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Atenciosamente,', 20, yPosition);
      doc.text(`${user?.name} ${user?.surname}`, 20, yPosition + 10);
      doc.text('Filial: Porto Alegre', 20, yPosition + 20);
      doc.text('Tacom Projetos de Bilhetagem Inteligente Ltda.', 20, yPosition + 30);
      
      // Termo de recebimento
      yPosition += 50;
      doc.text('Termo de Recebimento emitido em duas vias: 01 via Destinatário e 01 via TACOM POA.', 20, yPosition);
      
      // Rodapé final
      doc.setFontSize(8);
      doc.text('Tacom Sistemas em Bilhetagem Inteligente Ltda', 20, 280);
      doc.text('Largo Visconde da Gama, 12 - Sala 1001 - Centro - Porto Alegre - RS - Brasil - CEP - 90010-110', 20, 285);
      doc.text('Telefone 55 51 3015-1849 e Telefax: 55 51 3013-1768', 20, 290);
      
      // Salvar PDF
      const fileName = `termo_recebimento_${Date.now()}.pdf`;
      doc.save(fileName);

      toast({
        title: "Sucesso",
        description: "Termo de recebimento gerado com sucesso!",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-2">
        <FileText className="h-8 w-8 text-gray-600" />
        <h1 className="text-3xl font-bold text-gray-900">Termo de Recebimento</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Gerar Termo de Recebimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dados das empresas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="originCompany">Empresa de Origem (De) *</Label>
              <Select value={originCompany} onValueChange={setOriginCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa de origem" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {company.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="destinationCompany">Empresa de Destino (Para) *</Label>
              <Select value={destinationCompany} onValueChange={setDestinationCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa de destino" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        {company.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="protocolDate">Data de Geração do Termo *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="protocolDate"
                  type="date"
                  value={protocolDate}
                  onChange={(e) => setProtocolDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="receivingDate">Data de Recebimento</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="receivingDate"
                  type="date"
                  value={receivingDate}
                  onChange={(e) => setReceivingDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Busca de equipamentos */}
          <div className="space-y-4">
            <Label>Buscar Equipamento por Número de Série</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Digite o número de série..."
                value={serialSearch}
                onChange={(e) => setSerialSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Lista de equipamentos filtrados */}
            {showEquipmentList && (
              <Card className="max-h-60 overflow-y-auto">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    {filteredEquipments.map(equipment => (
                      <div
                        key={equipment.id}
                        className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50"
                        onClick={() => addEquipmentToList(equipment)}
                      >
                        <div>
                          <p className="font-medium">{equipment.numero_serie}</p>
                          <p className="text-sm text-gray-600">{equipment.tipo} - {equipment.modelo}</p>
                          <p className="text-xs text-gray-500">{equipment.empresas?.name}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Adicionar
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Lista de equipamentos selecionados */}
          <div className="space-y-4">
            <Label>Equipamentos Selecionados</Label>
            
            {selectedEquipments.filter(item => item.equipment_id).map((item, index) => (
              <Card key={item.id} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <Label>ITEM {index + 1}</Label>
                    <p className="text-sm font-medium">{item.equipment?.tipo}</p>
                    <p className="text-xs text-gray-600">S/N: {item.equipment?.numero_serie}</p>
                  </div>
                  
                  <div>
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) => updateSelectedEquipment(item.id, 'quantidade', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <Label>Unidade</Label>
                    <Select 
                      value={item.unidade} 
                      onValueChange={(value) => updateSelectedEquipment(item.id, 'unidade', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PC">PC</SelectItem>
                        <SelectItem value="UND">UND</SelectItem>
                        <SelectItem value="PCT">PCT</SelectItem>
                        <SelectItem value="CX">CX</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Referência</Label>
                    <Input
                      value={item.referencia}
                      onChange={(e) => updateSelectedEquipment(item.id, 'referencia', e.target.value)}
                      placeholder="Referência do item"
                    />
                  </div>
                </div>
                
                {selectedEquipments.filter(eq => eq.equipment_id).length > 1 && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEquipment(item.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remover
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Usuário responsável */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4" />
              Responsável pela Emissão
            </Label>
            <p className="text-lg font-medium">{user?.name} {user?.surname}</p>
            <p className="text-sm text-gray-600">Filial: Porto Alegre</p>
            <p className="text-sm text-gray-600">Tacom Projetos de Bilhetagem Inteligente Ltda.</p>
          </div>

          <div className="mt-6">
            <Button 
              onClick={generateTermoPDF}
              className="flex items-center gap-2"
              disabled={!originCompany || !destinationCompany || selectedEquipments.filter(item => item.equipment_id).length === 0 || !protocolDate}
            >
              <Download className="h-4 w-4" />
              Gerar Termo de Recebimento PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProtocolPage;
