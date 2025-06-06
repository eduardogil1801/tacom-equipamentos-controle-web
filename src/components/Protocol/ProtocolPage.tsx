import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar, Building, Laptop, Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

interface Equipment {
  id: string;
  tipo: string;
  numero_serie: string;
  data_entrada: string;
  data_saida?: string;
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
  equipment: Equipment;
}

const ProtocolPage: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedEquipments, setSelectedEquipments] = useState<SelectedEquipment[]>([{ id: '1', equipment: {} as Equipment }]);
  const [selectedDate, setSelectedDate] = useState('');
  const [protocolType, setProtocolType] = useState('entrada');

  useEffect(() => {
    loadData();
    // Set today as default date
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load companies
      const { data: companiesData, error: companiesError } = await supabase
        .from('empresas')
        .select('*')
        .order('name');

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Load only equipments that are in stock (no data_saida) with company names
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
        .is('data_saida', null)
        .order('data_entrada', { ascending: false });

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

  const getFilteredEquipments = () => {
    if (!selectedCompany) return [];
    return equipments.filter(equipment => equipment.id_empresa === selectedCompany);
  };

  const addEquipmentSlot = () => {
    const newId = (selectedEquipments.length + 1).toString();
    setSelectedEquipments([...selectedEquipments, { id: newId, equipment: {} as Equipment }]);
  };

  const removeEquipmentSlot = (id: string) => {
    if (selectedEquipments.length > 1) {
      setSelectedEquipments(selectedEquipments.filter(item => item.id !== id));
    }
  };

  const updateSelectedEquipment = (id: string, equipmentId: string) => {
    const equipment = equipments.find(e => e.id === equipmentId);
    if (equipment) {
      setSelectedEquipments(prev => 
        prev.map(item => 
          item.id === id ? { ...item, equipment } : item
        )
      );
    }
  };

  const generateProtocolPDF = () => {
    if (!selectedCompany || selectedEquipments.some(item => !item.equipment.id) || !selectedDate) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const company = companies.find(c => c.id === selectedCompany);
    const validEquipments = selectedEquipments.filter(item => item.equipment.id);

    if (!company || validEquipments.length === 0) {
      toast({
        title: "Erro",
        description: "Empresa ou equipamentos não encontrados.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create PDF with proper encoding
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set font
      doc.setFont('helvetica');
      
      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const title = `PROTOCOLO DE ${protocolType.toUpperCase()} DE EQUIPAMENTO${validEquipments.length > 1 ? 'S' : ''}`;
      doc.text(title, 20, 30);
      
      // Line separator
      doc.setLineWidth(0.5);
      doc.line(20, 35, 190, 35);
      
      // Company data
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DA EMPRESA:', 20, 50);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Nome: ${company.name}`, 20, 60);
      doc.text(`CNPJ: ${company.cnpj || 'N/A'}`, 20, 70);
      doc.text(`Contato: ${company.contact || 'N/A'}`, 20, 80);
      
      // Equipment data
      doc.setFont('helvetica', 'bold');
      doc.text(`DADOS DO${validEquipments.length > 1 ? 'S' : ''} EQUIPAMENTO${validEquipments.length > 1 ? 'S' : ''}:`, 20, 100);
      
      let yPosition = 110;
      validEquipments.forEach((item, index) => {
        doc.setFont('helvetica', 'bold');
        if (validEquipments.length > 1) {
          doc.text(`Equipamento ${index + 1}:`, 20, yPosition);
          yPosition += 10;
        }
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Tipo: ${item.equipment.tipo}`, 20, yPosition);
        doc.text(`Numero de Serie: ${item.equipment.numero_serie}`, 20, yPosition + 10);
        doc.text(`Data de Entrada: ${new Date(item.equipment.data_entrada).toLocaleDateString('pt-BR')}`, 20, yPosition + 20);
        doc.text('Status: Em Estoque', 20, yPosition + 30);
        
        yPosition += 50;
      });
      
      // Protocol data
      doc.setFont('helvetica', 'bold');
      doc.text('DADOS DO PROTOCOLO:', 20, yPosition);
      yPosition += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Tipo: ${protocolType === 'entrada' ? 'Entrada' : 'Saida'}`, 20, yPosition);
      doc.text(`Data do Protocolo: ${new Date(selectedDate).toLocaleDateString('pt-BR')}`, 20, yPosition + 10);
      doc.text(`Hora de Geracao: ${new Date().toLocaleTimeString('pt-BR')}`, 20, yPosition + 20);
      
      yPosition += 30;
      
      // Line separator
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;
      
      // Signatures
      doc.setFont('helvetica', 'bold');
      doc.text(`RESPONSAVEL PELA ${protocolType.toUpperCase()}:`, 20, yPosition);
      yPosition += 15;
      
      doc.setFont('helvetica', 'normal');
      doc.text('Nome: _________________________________________________', 20, yPosition);
      doc.text('Assinatura: ___________________________________________', 20, yPosition + 15);
      doc.text('Data: _________________________________________________', 20, yPosition + 30);
      
      yPosition += 45;
      
      doc.setFont('helvetica', 'bold');
      doc.text('RESPONSAVEL PELA TACOM:', 20, yPosition);
      yPosition += 15;
      
      doc.setFont('helvetica', 'normal');
      doc.text('Nome: _________________________________________________', 20, yPosition);
      doc.text('Assinatura: ___________________________________________', 20, yPosition + 15);
      doc.text('Data: _________________________________________________', 20, yPosition + 30);
      
      yPosition += 45;
      
      // Footer
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 10;
      doc.setFontSize(10);
      doc.text('Este protocolo foi gerado automaticamente pelo Sistema TACOM', 20, yPosition);
      doc.text(new Date().toLocaleString('pt-BR'), 20, yPosition + 10);
      
      // Save PDF
      const equipmentSerials = validEquipments.map(item => item.equipment.numero_serie).join('_');
      const fileName = `protocolo_${protocolType}_${equipmentSerials}_${selectedDate}.pdf`;
      doc.save(fileName);

      toast({
        title: "Sucesso",
        description: "Protocolo PDF gerado com sucesso!",
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

  const filteredEquipments = getFilteredEquipments();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Protocolo de Entrega</h1>
      
      {/* Protocol Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Protocolo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="protocolType">Tipo de Protocolo</Label>
              <Select value={protocolType} onValueChange={setProtocolType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Protocolo de Entrada</SelectItem>
                  <SelectItem value="saida">Protocolo de Saida</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="company">Empresa *</Label>
              <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
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

            <div className="md:col-span-2">
              <Label htmlFor="date">Data do Protocolo *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Equipment Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Equipamentos (Em Estoque) *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEquipmentSlot}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Equipamento
              </Button>
            </div>

            {selectedEquipments.map((item, index) => (
              <div key={item.id} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label htmlFor={`equipment-${item.id}`}>
                    Equipamento {selectedEquipments.length > 1 ? index + 1 : ''}
                  </Label>
                  <Select 
                    value={item.equipment.id || ''} 
                    onValueChange={(value) => updateSelectedEquipment(item.id, value)}
                    disabled={!selectedCompany}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!selectedCompany ? "Selecione uma empresa primeiro" : "Selecione um equipamento"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredEquipments.map(equipment => (
                        <SelectItem key={equipment.id} value={equipment.id}>
                          <div className="flex items-center gap-2">
                            <Laptop className="h-4 w-4" />
                            {equipment.tipo} - {equipment.numero_serie}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedEquipments.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeEquipmentSlot(item.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {selectedCompany && filteredEquipments.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Nenhum equipamento em estoque para esta empresa
              </p>
            )}
          </div>

          <div className="mt-6">
            <Button 
              onClick={generateProtocolPDF}
              className="flex items-center gap-2"
              disabled={!selectedCompany || selectedEquipments.some(item => !item.equipment.id) || !selectedDate}
            >
              <Download className="h-4 w-4" />
              Gerar Protocolo PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Preview */}
      {selectedEquipments.some(item => item.equipment.id) && (
        <Card>
          <CardHeader>
            <CardTitle>Previa dos Equipamentos Selecionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {selectedEquipments.filter(item => item.equipment.id).map((item, index) => {
                const company = companies.find(c => c.id === selectedCompany);
                
                return (
                  <div key={item.id} className="border rounded-lg p-4">
                    {selectedEquipments.filter(item => item.equipment.id).length > 1 && (
                      <h4 className="font-semibold mb-3">Equipamento {index + 1}</h4>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Empresa</Label>
                        <p className="text-lg">{company?.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">CNPJ</Label>
                        <p className="text-lg">{company?.cnpj || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Tipo de Equipamento</Label>
                        <p className="text-lg">{item.equipment.tipo}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Numero de Serie</Label>
                        <p className="text-lg font-mono">{item.equipment.numero_serie}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Data de Entrada</Label>
                        <p className="text-lg">{new Date(item.equipment.data_entrada).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Status</Label>
                        <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          Em Estoque
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProtocolPage;
