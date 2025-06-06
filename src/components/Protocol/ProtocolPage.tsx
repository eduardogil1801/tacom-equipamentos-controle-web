
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar, Building, Laptop } from 'lucide-react';
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

const ProtocolPage: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
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

  const generateProtocolPDF = () => {
    if (!selectedCompany || !selectedEquipment || !selectedDate) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const company = companies.find(c => c.id === selectedCompany);
    const equipment = equipments.find(e => e.id === selectedEquipment);

    if (!company || !equipment) {
      toast({
        title: "Erro",
        description: "Empresa ou equipamento não encontrado.",
        variant: "destructive",
      });
      return;
    }

    // Create PDF
    const doc = new jsPDF();
    
    // Set font
    doc.setFont('helvetica');
    
    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`PROTOCOLO DE ${protocolType.toUpperCase()} DE EQUIPAMENTO`, 20, 30);
    
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
    doc.text('DADOS DO EQUIPAMENTO:', 20, 100);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Tipo: ${equipment.tipo}`, 20, 110);
    doc.text(`Número de Série: ${equipment.numero_serie}`, 20, 120);
    doc.text(`Data de Entrada: ${new Date(equipment.data_entrada).toLocaleDateString('pt-BR')}`, 20, 130);
    doc.text(`Status: Em Estoque`, 20, 140);
    
    // Protocol data
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO PROTOCOLO:', 20, 160);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Tipo: ${protocolType === 'entrada' ? 'Entrada' : 'Saída'}`, 20, 170);
    doc.text(`Data do Protocolo: ${new Date(selectedDate).toLocaleDateString('pt-BR')}`, 20, 180);
    doc.text(`Hora de Geração: ${new Date().toLocaleTimeString('pt-BR')}`, 20, 190);
    
    // Line separator
    doc.line(20, 200, 190, 200);
    
    // Signatures
    doc.setFont('helvetica', 'bold');
    doc.text(`RESPONSÁVEL PELA ${protocolType.toUpperCase()}:`, 20, 220);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Nome: _________________________________________________', 20, 235);
    doc.text('Assinatura: ___________________________________________', 20, 250);
    doc.text('Data: _________________________________________________', 20, 265);
    
    doc.setFont('helvetica', 'bold');
    doc.text('RESPONSÁVEL PELA TACOM:', 20, 285);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Nome: _________________________________________________', 20, 300);
    doc.text('Assinatura: ___________________________________________', 20, 315);
    doc.text('Data: _________________________________________________', 20, 330);
    
    // Footer
    doc.line(20, 340, 190, 340);
    doc.setFontSize(10);
    doc.text('Este protocolo foi gerado automaticamente pelo Sistema TACOM', 20, 350);
    doc.text(new Date().toLocaleString('pt-BR'), 20, 360);
    
    // Save PDF
    doc.save(`protocolo_${protocolType}_${equipment.numero_serie}_${selectedDate}.pdf`);

    toast({
      title: "Sucesso",
      description: "Protocolo PDF gerado com sucesso!",
    });
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="protocolType">Tipo de Protocolo</Label>
              <Select value={protocolType} onValueChange={setProtocolType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Protocolo de Entrada</SelectItem>
                  <SelectItem value="saida">Protocolo de Saída</SelectItem>
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

            <div>
              <Label htmlFor="equipment">Equipamento (Em Estoque) *</Label>
              <Select 
                value={selectedEquipment} 
                onValueChange={setSelectedEquipment}
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
              {selectedCompany && filteredEquipments.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Nenhum equipamento em estoque para esta empresa
                </p>
              )}
            </div>

            <div>
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

          <div className="mt-6">
            <Button 
              onClick={generateProtocolPDF}
              className="flex items-center gap-2"
              disabled={!selectedCompany || !selectedEquipment || !selectedDate}
            >
              <Download className="h-4 w-4" />
              Gerar Protocolo PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Preview */}
      {selectedEquipment && (
        <Card>
          <CardHeader>
            <CardTitle>Prévia do Equipamento Selecionado</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const equipment = equipments.find(e => e.id === selectedEquipment);
              const company = companies.find(c => c.id === selectedCompany);
              
              if (!equipment || !company) return null;

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Empresa</Label>
                    <p className="text-lg">{company.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">CNPJ</Label>
                    <p className="text-lg">{company.cnpj || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Tipo de Equipamento</Label>
                    <p className="text-lg">{equipment.tipo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Número de Série</Label>
                    <p className="text-lg font-mono">{equipment.numero_serie}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Data de Entrada</Label>
                    <p className="text-lg">{new Date(equipment.data_entrada).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <span className="inline-block px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      Em Estoque
                    </span>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProtocolPage;
