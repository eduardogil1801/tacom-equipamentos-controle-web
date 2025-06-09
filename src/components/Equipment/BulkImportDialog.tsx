
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { bulkInsertEquipments } from '@/utils/equipmentBulkInsert';

interface Company {
  id: string;
  name: string;
}

interface BulkImportDialogProps {
  companies: Company[];
  onImportComplete: () => void;
}

const BulkImportDialog: React.FC<BulkImportDialogProps> = ({ companies, onImportComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateCSVTemplate = () => {
    const headers = ['Tipo', 'Modelo', 'Série', 'Empresa', 'Estado', 'Status', 'Entrada', 'Saída'];
    const sampleData = [
      'CCIT 5.0,H2,ABC123456,Nome da Empresa,Rio Grande do Sul,disponivel,2024-01-15,',
      'PM (Painel de Motorista),V2000,DEF789012,Nome da Empresa,Santa Catarina,em_uso,2024-01-16,',
      'UPEX,,GHI345678,Nome da Empresa,Rio Grande do Sul,aguardando_manutencao,2024-01-17,'
    ];

    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'modelo_importacao_equipamentos.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Sucesso",
      description: "Modelo CSV baixado com sucesso!",
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo CSV válido.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const values = line.split(',').map(v => v.trim());
        const item: any = {};
        headers.forEach((header, index) => {
          item[header] = values[index] || '';
        });
        data.push(item);
      }
    }

    return data;
  };

  const validateData = (data: any[]): string[] => {
    const errors: string[] = [];
    const requiredFields = ['Tipo', 'Série', 'Empresa', 'Estado', 'Entrada'];

    data.forEach((item, index) => {
      const row = index + 2; // +2 because index starts at 0 and we skip header

      requiredFields.forEach(field => {
        if (!item[field]) {
          errors.push(`Linha ${row}: Campo '${field}' é obrigatório`);
        }
      });

      // Validar se a empresa existe
      if (item.Empresa) {
        const companyExists = companies.some(c => c.name === item.Empresa);
        if (!companyExists) {
          errors.push(`Linha ${row}: Empresa '${item.Empresa}' não encontrada`);
        }
      }

      // Validar data de entrada
      if (item.Entrada && !Date.parse(item.Entrada)) {
        errors.push(`Linha ${row}: Data de entrada inválida`);
      }

      // Validar data de saída se fornecida
      if (item.Saída && item.Saída !== '' && !Date.parse(item.Saída)) {
        errors.push(`Linha ${row}: Data de saída inválida`);
      }

      // Validar se data de saída é posterior à data de entrada
      if (item.Entrada && item.Saída && item.Saída !== '') {
        const entryDate = new Date(item.Entrada);
        const exitDate = new Date(item.Saída);
        if (exitDate < entryDate) {
          errors.push(`Linha ${row}: Data de saída não pode ser anterior à data de entrada`);
        }
      }
    });

    return errors;
  };

  const transformData = (data: any[]) => {
    return data.map(item => {
      const company = companies.find(c => c.name === item.Empresa);
      
      return {
        tipo: item.Tipo,
        modelo: item.Modelo || null,
        numero_serie: item.Série,
        data_entrada: item.Entrada,
        data_saida: item.Saída && item.Saída !== '' ? item.Saída : null,
        id_empresa: company?.id || '',
        estado: item.Estado,
        status: item.Status || 'disponivel'
      };
    });
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo CSV.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const text = await file.text();
      const rawData = parseCSV(text);

      if (rawData.length === 0) {
        throw new Error('Arquivo CSV vazio ou formato inválido');
      }

      // Validar dados
      const errors = validateData(rawData);
      if (errors.length > 0) {
        throw new Error(`Erros de validação:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? '\n...' : ''}`);
      }

      // Transformar dados para o formato correto
      const transformedData = transformData(rawData);

      // Importar dados
      await bulkInsertEquipments(transformedData);

      toast({
        title: "Sucesso",
        description: `${transformedData.length} equipamentos importados com sucesso!`,
      });

      setFile(null);
      setIsOpen(false);
      onImportComplete();

    } catch (error: any) {
      console.error('Error importing data:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao importar dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Importar Dados
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Dados de Equipamentos</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>Faça o upload de um arquivo CSV com os dados dos equipamentos.</p>
            <p className="mt-2">
              <strong>Campos obrigatórios:</strong> Tipo, Série, Empresa, Estado, Entrada
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={generateCSVTemplate}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar Modelo CSV
            </Button>

            <div className="space-y-2">
              <Label htmlFor="csvFile">Arquivo CSV</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {file && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <FileText className="h-4 w-4" />
                    {file.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || loading}
            >
              {loading ? 'Importando...' : 'Importar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;
