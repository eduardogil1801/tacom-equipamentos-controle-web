
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Calendar, Building, Laptop } from 'lucide-react';
import { Equipment, Company } from '@/types';
import { toast } from '@/hooks/use-toast';

const ProtocolPage: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [protocolType, setProtocolType] = useState('entrada'); // 'entrada' ou 'saida'

  useEffect(() => {
    // Load data from localStorage
    const savedEquipments = localStorage.getItem('tacom-equipments');
    const savedCompanies = localStorage.getItem('tacom-companies');
    
    if (savedEquipments) {
      setEquipments(JSON.parse(savedEquipments));
    }
    
    if (savedCompanies) {
      setCompanies(JSON.parse(savedCompanies));
    }

    // Set today as default date
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  const getFilteredEquipments = () => {
    if (!selectedCompany) return [];
    return equipments.filter(equipment => equipment.companyId === selectedCompany);
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

    // Create protocol content
    const protocolContent = `
PROTOCOLO DE ${protocolType.toUpperCase()} DE EQUIPAMENTO

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DADOS DA EMPRESA:
Nome: ${company.name}
CNPJ: ${company.cnpj || 'N/A'}
Contato: ${company.contact || 'N/A'}

DADOS DO EQUIPAMENTO:
Tipo: ${equipment.type}
Número de Série: ${equipment.serialNumber}
Data de Entrada: ${new Date(equipment.entryDate).toLocaleDateString('pt-BR')}
Data de Saída: ${equipment.exitDate ? new Date(equipment.exitDate).toLocaleDateString('pt-BR') : 'N/A'}
Status: ${equipment.exitDate ? 'Retirado' : 'Em Estoque'}

DADOS DO PROTOCOLO:
Tipo: ${protocolType === 'entrada' ? 'Entrada' : 'Saída'}
Data do Protocolo: ${new Date(selectedDate).toLocaleDateString('pt-BR')}
Hora de Geração: ${new Date().toLocaleTimeString('pt-BR')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESPONSÁVEL PELA ${protocolType.toUpperCase()}:

Nome: _________________________________________________

Assinatura: ___________________________________________

Data: _________________________________________________


RESPONSÁVEL PELA TACOM:

Nome: _________________________________________________

Assinatura: ___________________________________________

Data: _________________________________________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Este protocolo foi gerado automaticamente pelo Sistema TACOM
${new Date().toLocaleString('pt-BR')}
    `;

    // Create and download PDF-like file (as text for now)
    const blob = new Blob([protocolContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `protocolo_${protocolType}_${equipment.serialNumber}_${selectedDate}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "Protocolo gerado com sucesso!",
    });
  };

  const filteredEquipments = getFilteredEquipments();

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
              <Label htmlFor="equipment">Equipamento *</Label>
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
                        {equipment.type} - {equipment.serialNumber}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <p className="text-lg">{equipment.type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Número de Série</Label>
                    <p className="text-lg font-mono">{equipment.serialNumber}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Data de Entrada</Label>
                    <p className="text-lg">{new Date(equipment.entryDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      equipment.exitDate 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {equipment.exitDate ? 'Retirado' : 'Em Estoque'}
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
