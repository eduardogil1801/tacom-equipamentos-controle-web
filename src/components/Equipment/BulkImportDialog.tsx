
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
// import * as XLSX from 'xlsx'; // Removed for compatibility

interface BulkImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface EquipmentData {
  tipo: string;
  numero_serie: string;
  modelo?: string;
  empresa: string;
  estado: string;
  status?: string;
}

const BulkImportDialog: React.FC<BulkImportDialogProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<EquipmentData[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      previewFile(selectedFile);
    }
  };

  const previewFile = async (file: File) => {
    toast({
      title: "Funcionalidade Indisponível",
      description: "A importação de Excel não está disponível no momento.",
      variant: "destructive",
    });
  };

  const downloadTemplate = () => {
    toast({
      title: "Funcionalidade Indisponível",
      description: "O download do template não está disponível no momento.",
      variant: "destructive",
    });
  };

  const validateData = (data: any[]): { valid: EquipmentData[], errors: string[] } => {
    const valid: EquipmentData[] = [];
    const errors: string[] = [];

    console.log('=== VALIDANDO DADOS ===');
    console.log('Total de linhas recebidas:', data.length);

    data.forEach((row, index) => {
      const rowNumber = index + 2;
      
      console.log(`Validando linha ${rowNumber}:`, row);
      
      const tipo = (row['Tipo'] || row['tipo'] || '').toString().trim();
      const numero_serie = (row['Número de Série'] || row['numero_serie'] || row['Serial'] || '').toString().trim();
      const modelo = row['Modelo'] || row['modelo'] ? (row['Modelo'] || row['modelo']).toString().trim() : '';
      const empresa = (row['Empresa'] || row['empresa'] || '').toString().trim();
      const estado = (row['Estado'] || row['estado'] || '').toString().trim();
      
      // CORREÇÃO: Mapear status corretamente
      let statusFromFile = '';
      if (row['Status'] || row['status']) {
        statusFromFile = (row['Status'] || row['status']).toString().trim();
      }

      console.log(`Linha ${rowNumber} mapeada:`, { tipo, numero_serie, modelo, empresa, estado, status: statusFromFile });

      if (!tipo || !numero_serie || !empresa) {
        const missingFields = [];
        if (!tipo) missingFields.push('Tipo');
        if (!numero_serie) missingFields.push('Número de Série');
        if (!empresa) missingFields.push('Empresa');
        
        const errorMsg = `Linha ${rowNumber}: Campos obrigatórios faltando: ${missingFields.join(', ')}`;
        console.error(errorMsg);
        errors.push(errorMsg);
        return;
      }

      // CORREÇÃO: Mapear status preservando o valor original
      const validStatuses = ['disponivel', 'em_uso', 'manutencao', 'aguardando_manutencao', 'danificado', 'indisponivel', 'devolvido'];
      let finalStatus = 'disponivel';
      
      if (statusFromFile) {
        const statusMap: { [key: string]: string } = {
          'disponivel': 'disponivel',
          'disponível': 'disponivel',
          'em_uso': 'em_uso',
          'em uso': 'em_uso',
          'manutencao': 'manutencao',
          'manutenção': 'manutencao',
          'aguardando_manutencao': 'aguardando_manutencao',
          'aguardando manutenção': 'aguardando_manutencao',
          'danificado': 'danificado',
          'indisponivel': 'indisponivel',
          'indisponível': 'indisponivel',
          'devolvido': 'devolvido'
        };
        
        const statusNormalizado = statusFromFile.toLowerCase().trim();
        if (statusMap[statusNormalizado]) {
          finalStatus = statusMap[statusNormalizado];
          console.log(`Linha ${rowNumber}: Status "${statusFromFile}" mapeado para "${finalStatus}"`);
        } else {
          console.warn(`Linha ${rowNumber}: Status "${statusFromFile}" não reconhecido, usando "disponivel"`);
          errors.push(`Linha ${rowNumber}: Status "${statusFromFile}" inválido. Valores válidos: ${Object.keys(statusMap).join(', ')}`);
        }
      }

      const validEquipment: EquipmentData = {
        tipo,
        numero_serie,
        modelo: modelo || undefined,
        empresa,
        estado,
        status: finalStatus
      };

      console.log(`Linha ${rowNumber} validada com sucesso:`, validEquipment);
      valid.push(validEquipment);
    });

    console.log('=== RESULTADO DA VALIDAÇÃO ===');
    console.log('Equipamentos válidos:', valid.length);
    console.log('Erros encontrados:', errors.length);
    
    return { valid, errors };
  };

  const processImport = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log('=== INICIANDO PROCESSAMENTO DA IMPORTAÇÃO ===');
      
      toast({
        title: "Funcionalidade Indisponível",
        description: "A importação de Excel não está disponível no momento.",
        variant: "destructive",
      });
      return;

      return;

    } catch (error) {
      console.error('=== ERRO GERAL NA IMPORTAÇÃO ===', error);
      toast({
        title: "Erro na Importação",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importação em Lote de Equipamentos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Template de Importação
            </h3>
            <p className="text-blue-700 text-sm mb-3">
              Baixe o template Excel com o formato correto para importação dos equipamentos.
            </p>
            <Button
              onClick={downloadTemplate}
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Template
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="file-upload">Selecionar Arquivo Excel</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="mt-2"
              />
            </div>

            {previewData.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Preview dos Dados (primeiras 5 linhas)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border p-2 text-left">Tipo</th>
                        <th className="border p-2 text-left">Número de Série</th>
                        <th className="border p-2 text-left">Modelo</th>
                        <th className="border p-2 text-left">Empresa</th>
                        <th className="border p-2 text-left">Estado</th>
                        <th className="border p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((item, index) => (
                        <tr key={index}>
                          <td className="border p-2">{item.tipo}</td>
                          <td className="border p-2">{item.numero_serie}</td>
                          <td className="border p-2">{item.modelo || '-'}</td>
                          <td className="border p-2">{item.empresa}</td>
                          <td className="border p-2">{item.estado || '-'}</td>
                          <td className="border p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              item.status === 'disponivel' ? 'bg-green-100 text-green-800' :
                              item.status === 'em_uso' ? 'bg-blue-100 text-blue-800' :
                              item.status === 'manutencao' ? 'bg-orange-100 text-orange-800' :
                              item.status === 'danificado' ? 'bg-red-100 text-red-800' :
                              item.status === 'devolvido' ? 'bg-black text-white' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Instruções:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• O arquivo deve estar no formato Excel (.xlsx ou .xls)</li>
              <li>• Campos obrigatórios: Tipo, Número de Série, Empresa</li>
              <li>• Campos opcionais: Modelo, Estado, Status</li>
              <li>• Status válidos: disponivel, em_uso, manutencao, aguardando_manutencao, danificado, indisponivel, devolvido</li>
              <li>• <strong>O status será preservado conforme especificado no arquivo</strong></li>
              <li>• Equipamentos com mesmo número mas tipos diferentes são aceitos</li>
              <li>• Duplicatas são verificadas por tipo + número de série</li>
              <li>• A data de entrada será definida como a data atual</li>
            </ul>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button
              onClick={processImport}
              disabled={!file || isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Importar Equipamentos
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;
