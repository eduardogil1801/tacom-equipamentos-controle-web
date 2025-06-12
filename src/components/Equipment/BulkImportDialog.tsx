
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

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
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      // Mapear dados para o formato esperado
      const mappedData: EquipmentData[] = jsonData.slice(0, 5).map((row: any) => ({
        tipo: row['Tipo'] || row['tipo'] || '',
        numero_serie: row['Número de Série'] || row['numero_serie'] || row['Serial'] || '',
        modelo: row['Modelo'] || row['modelo'] || '',
        empresa: row['Empresa'] || row['empresa'] || '',
        estado: row['Estado'] || row['estado'] || ''
      }));

      setPreviewData(mappedData);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro",
        description: "Erro ao processar arquivo. Verifique se é um arquivo Excel válido.",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Tipo': 'Tablet',
        'Número de Série': 'TAB001',
        'Modelo': 'Samsung Galaxy Tab A',
        'Empresa': 'Empresa Exemplo',
        'Estado': 'RS'
      },
      {
        'Tipo': 'Smartphone',
        'Número de Série': 'PHONE001',
        'Modelo': 'iPhone 13',
        'Empresa': 'Outra Empresa',
        'Estado': 'SP'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template_equipamentos.xlsx');
  };

  const validateData = (data: any[]): { valid: EquipmentData[], errors: string[] } => {
    const valid: EquipmentData[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 porque começamos da linha 2 no Excel (linha 1 é cabeçalho)
      
      // Mapear diferentes possíveis nomes de colunas
      const tipo = row['Tipo'] || row['tipo'] || '';
      const numero_serie = row['Número de Série'] || row['numero_serie'] || row['Serial'] || '';
      const modelo = row['Modelo'] || row['modelo'] || '';
      const empresa = row['Empresa'] || row['empresa'] || '';
      const estado = row['Estado'] || row['estado'] || '';

      // Validações obrigatórias
      if (!tipo || !numero_serie || !empresa) {
        errors.push(`Linha ${rowNumber}: Campos obrigatórios faltando (Tipo, Número de Série, Empresa)`);
        return;
      }

      valid.push({
        tipo: tipo.toString().trim(),
        numero_serie: numero_serie.toString().trim(),
        modelo: modelo ? modelo.toString().trim() : undefined,
        empresa: empresa.toString().trim(),
        estado: estado ? estado.toString().trim() : ''
      });
    });

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
      console.log('Iniciando processamento do arquivo:', file.name);
      
      // Ler arquivo Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      console.log('Dados brutos do Excel:', jsonData.length, 'linhas');

      if (jsonData.length === 0) {
        throw new Error('Arquivo está vazio ou não possui dados válidos');
      }

      // Validar dados
      const { valid, errors } = validateData(jsonData);

      if (errors.length > 0) {
        console.error('Erros de validação:', errors);
        toast({
          title: "Erros de Validação",
          description: `${errors.length} erro(s) encontrado(s). Verifique o console para detalhes.`,
          variant: "destructive",
        });
        errors.forEach(error => console.error(error));
        setIsProcessing(false);
        return;
      }

      console.log('Dados válidos após validação:', valid.length);

      // Carregar empresas para mapear nomes para IDs
      const { data: empresas, error: empresasError } = await supabase
        .from('empresas')
        .select('id, name');

      if (empresasError) {
        throw new Error(`Erro ao carregar empresas: ${empresasError.message}`);
      }

      console.log('Empresas carregadas:', empresas?.length);

      // Criar mapa de empresas (nome -> id)
      const empresasMap = new Map<string, string>();
      empresas?.forEach(empresa => {
        empresasMap.set(empresa.name.toLowerCase(), empresa.id);
      });

      // Verificar se todas as empresas existem
      const empresasNaoEncontradas = valid
        .map(eq => eq.empresa.toLowerCase())
        .filter(nomeEmpresa => !empresasMap.has(nomeEmpresa));

      if (empresasNaoEncontradas.length > 0) {
        const empresasUnicas = [...new Set(empresasNaoEncontradas)];
        throw new Error(`Empresas não encontradas: ${empresasUnicas.join(', ')}`);
      }

          // Verificar equipamentos duplicados
          const numerosExistentes = new Set<string>();
          const { data: equipamentosExistentes } = await supabase
            .from('equipamentos')
            .select('numero_serie');

          equipamentosExistentes?.forEach(eq => {
            numerosExistentes.add(eq.numero_serie.toLowerCase());
          });

          // Filtrar equipamentos que não são duplicados
          const equipamentosNovos = valid.filter(eq => 
            !numerosExistentes.has(eq.numero_serie.toLowerCase())
          );

          if (equipamentosNovos.length === 0) {
            throw new Error('Todos os equipamentos já existem no sistema');
          }

          if (numerosExistentes.size > 0) {
            console.log(`${numerosExistentes.size} equipamentos duplicados serão ignorados`);
          }

          // Usar data atual do sistema sem conversões de fuso horário
          const dataAtual = new Date().toISOString().split('T')[0];
          
          console.log('Data de entrada definida para:', dataAtual);
          console.log('Timestamp atual:', new Date().toISOString());
          
          const equipamentosParaInserir = equipamentosNovos.map(eq => {
            const empresaId = empresasMap.get(eq.empresa.toLowerCase());
            return {
              tipo: eq.tipo,
              numero_serie: eq.numero_serie,
              modelo: eq.modelo || null,
              id_empresa: empresaId,
              estado: eq.estado || null,
              data_entrada: dataAtual,
              status: 'disponivel'
            };
          });

          console.log('Equipamentos preparados para inserção:', equipamentosParaInserir.length);
          console.log('Amostra do primeiro equipamento:', equipamentosParaInserir[0]);

          // Inserir em lotes de 500 para evitar limitações
          const batchSize = 500;
          let totalInseridos = 0;

          for (let i = 0; i < equipamentosParaInserir.length; i += batchSize) {
            const batch = equipamentosParaInserir.slice(i, i + batchSize);
            
            console.log(`Inserindo lote ${Math.floor(i / batchSize) + 1}:`, batch.length, 'equipamentos');

            const { data, error } = await supabase
              .from('equipamentos')
              .insert(batch)
              .select('id, numero_serie, data_entrada');

            if (error) {
              console.error('Erro ao inserir lote:', error);
              throw new Error(`Erro ao inserir lote: ${error.message}`);
            }

            totalInseridos += data?.length || 0;
            console.log(`Lote inserido com sucesso. Total inserido até agora: ${totalInseridos}`);
            console.log('Dados inseridos com verificação de data:', data?.slice(0, 3));
          }

          const duplicatas = valid.length - equipamentosNovos.length;

          toast({
            title: "Importação Concluída",
            description: `${totalInseridos} equipamentos importados com sucesso${duplicatas > 0 ? `. ${duplicatas} duplicatas ignoradas` : ''}.`,
          });

          console.log('Importação finalizada:', {
            totalProcessados: valid.length,
            totalInseridos,
            duplicatasIgnoradas: duplicatas
          });

          onImportComplete();
          onClose();
        } catch (error) {
          console.error('Erro na importação:', error);
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
              {/* Seção de Template */}
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

              {/* Seção de Upload */}
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

                {/* Preview dos dados */}
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
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Instruções */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Instruções:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• O arquivo deve estar no formato Excel (.xlsx ou .xls)</li>
                  <li>• Campos obrigatórios: Tipo, Número de Série, Empresa</li>
                  <li>• Campos opcionais: Modelo, Estado</li>
                  <li>• Equipamentos duplicados (mesmo número de série) serão ignorados</li>
                  <li>• A data de entrada será definida como a data atual</li>
                </ul>
              </div>

              {/* Botões */}
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
