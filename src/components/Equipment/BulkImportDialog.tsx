
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

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

  const generateXLSXTemplate = () => {
    const data = [
      { 'Número de Série': 'ABC123456', 'Tipo de Equipamento': 'CCIT 5.0' },
      { 'Número de Série': 'DEF789012', 'Tipo de Equipamento': 'Terminal' },
      { 'Número de Série': 'GHI345678', 'Tipo de Equipamento': 'Validador' }
    ];

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Equipamentos');
    
    XLSX.writeFile(wb, 'modelo_importacao_equipamentos.xlsx');

    toast({
      title: "Sucesso",
      description: "Modelo XLSX baixado com sucesso!",
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione um arquivo Excel válido (.xlsx ou .xls).",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const parseXLSX = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const validateData = (data: any[]): string[] => {
    const errors: string[] = [];
    const requiredFields = ['Número de Série', 'Tipo de Equipamento'];

    data.forEach((item, index) => {
      const row = index + 2; // +2 because index starts at 0 and we skip header

      requiredFields.forEach(field => {
        if (!item[field]) {
          errors.push(`Linha ${row}: Campo '${field}' é obrigatório`);
        }
      });

      // Validar se número de série não está vazio
      if (item['Número de Série'] && typeof item['Número de Série'] !== 'string') {
        errors.push(`Linha ${row}: Número de série deve ser texto`);
      }
    });

    return errors;
  };

  const transformData = async (data: any[]) => {
    // Buscar a empresa TACOM Sistema POA
    const { data: tacomCompany, error } = await supabase
      .from('empresas')
      .select('id')
      .ilike('name', '%tacom%sistema%poa%')
      .limit(1);

    let tacomId = '';
    if (tacomCompany && tacomCompany.length > 0) {
      tacomId = tacomCompany[0].id;
    } else {
      // Se não encontrar, criar a empresa
      const { data: newCompany, error: createError } = await supabase
        .from('empresas')
        .insert([{ name: 'TACOM Sistema POA', estado: 'Rio Grande do Sul' }])
        .select()
        .single();
      
      if (createError) throw createError;
      tacomId = newCompany.id;
    }

    return data.map(item => ({
      tipo: item['Tipo de Equipamento'],
      numero_serie: String(item['Número de Série']),
      data_entrada: new Date().toISOString().split('T')[0],
      id_empresa: tacomId,
      estado: 'Rio Grande do Sul',
      status: 'disponivel',
      modelo: null
    }));
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo Excel.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const rawData = await parseXLSX(file);

      if (rawData.length === 0) {
        throw new Error('Arquivo Excel vazio ou formato inválido');
      }

      // Validar dados
      const errors = validateData(rawData);
      if (errors.length > 0) {
        throw new Error(`Erros de validação:\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? '\n...' : ''}`);
      }

      // Transformar dados para o formato correto
      const transformedData = await transformData(rawData);

      // Importar dados
      const { error: insertError } = await supabase
        .from('equipamentos')
        .insert(transformedData);

      if (insertError) throw insertError;

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
            <p>Faça o upload de um arquivo Excel com os dados dos equipamentos.</p>
            <p className="mt-2">
              <strong>Campos obrigatórios:</strong> Número de Série, Tipo de Equipamento
            </p>
            <p className="mt-1 text-xs">
              <strong>Observação:</strong> Data de entrada será definida automaticamente como hoje e empresa será definida como "TACOM Sistema POA"
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={generateXLSXTemplate}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar Modelo Excel
            </Button>

            <div className="space-y-2">
              <Label htmlFor="xlsxFile">Arquivo Excel</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="xlsxFile"
                  type="file"
                  accept=".xlsx,.xls"
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
