
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
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      console.log('Dados brutos do preview:', jsonData.slice(0, 3));

      // Mapear dados para o formato esperado com validação melhorada
      const mappedData: EquipmentData[] = jsonData.slice(0, 5).map((row: any) => {
        console.log('Linha sendo processada no preview:', row);
        
        return {
          tipo: (row['Tipo'] || row['tipo'] || '').toString().trim(),
          numero_serie: (row['Número de Série'] || row['numero_serie'] || row['Serial'] || '').toString().trim(),
          modelo: row['Modelo'] || row['modelo'] ? (row['Modelo'] || row['modelo']).toString().trim() : '',
          empresa: (row['Empresa'] || row['empresa'] || '').toString().trim(),
          estado: (row['Estado'] || row['estado'] || '').toString().trim(),
          status: (row['Status'] || row['status'] || 'disponivel').toString().trim()
        };
      });

      console.log('Dados mapeados para preview:', mappedData);
      setPreviewData(mappedData);
    } catch (error) {
      console.error('Erro ao processar arquivo no preview:', error);
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
        'Empresa': 'Central',
        'Estado': 'RS',
        'Status': 'disponivel'
      },
      {
        'Tipo': 'Smartphone',
        'Número de Série': 'PHONE001',
        'Modelo': 'iPhone 13',
        'Empresa': 'TACOM Sistemas POA',
        'Estado': 'SP',
        'Status': 'em_uso'
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

    console.log('=== VALIDANDO DADOS ===');
    console.log('Total de linhas recebidas:', data.length);

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 porque começamos da linha 2 no Excel (linha 1 é cabeçalho)
      
      console.log(`Validando linha ${rowNumber}:`, row);
      
      // Mapear diferentes possíveis nomes de colunas com tratamento de tipos
      const tipo = (row['Tipo'] || row['tipo'] || '').toString().trim();
      const numero_serie = (row['Número de Série'] || row['numero_serie'] || row['Serial'] || '').toString().trim();
      const modelo = row['Modelo'] || row['modelo'] ? (row['Modelo'] || row['modelo']).toString().trim() : '';
      const empresa = (row['Empresa'] || row['empresa'] || '').toString().trim();
      const estado = (row['Estado'] || row['estado'] || '').toString().trim();
      const status = (row['Status'] || row['status'] || 'disponivel').toString().trim();

      console.log(`Linha ${rowNumber} mapeada:`, { tipo, numero_serie, modelo, empresa, estado, status });

      // Validações obrigatórias
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

      // Validar status
      const validStatuses = ['disponivel', 'em_uso', 'manutencao', 'aguardando_manutencao', 'danificado', 'indisponivel'];
      const finalStatus = validStatuses.includes(status.toLowerCase()) ? status.toLowerCase() : 'disponivel';
      
      if (status && !validStatuses.includes(status.toLowerCase())) {
        console.warn(`Linha ${rowNumber}: Status "${status}" inválido, usando "disponivel"`);
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
      console.log('Arquivo:', file.name, 'Tamanho:', file.size);
      
      // Ler arquivo Excel
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      console.log('Dados brutos extraídos do Excel:', jsonData.length, 'linhas');
      console.log('Primeiras 3 linhas:', jsonData.slice(0, 3));

      if (jsonData.length === 0) {
        throw new Error('Arquivo está vazio ou não possui dados válidos');
      }

      // Validar dados
      const { valid, errors } = validateData(jsonData);

      if (errors.length > 0) {
        console.error('Erros de validação encontrados:', errors);
        toast({
          title: "Erros de Validação",
          description: `${errors.length} erro(s) encontrado(s). Verifique o console para detalhes.`,
          variant: "destructive",
        });
        errors.forEach(error => console.error('ERRO:', error));
        setIsProcessing(false);
        return;
      }

      console.log('=== CARREGANDO EMPRESAS DO BANCO ===');
      
      // Carregar empresas para mapear nomes para IDs
      const { data: empresas, error: empresasError } = await supabase
        .from('empresas')
        .select('id, name');

      if (empresasError) {
        console.error('Erro ao carregar empresas:', empresasError);
        throw new Error(`Erro ao carregar empresas: ${empresasError.message}`);
      }

      console.log('Empresas carregadas do banco:', empresas?.length);
      console.log('Lista de empresas:', empresas?.map(e => ({ id: e.id, name: e.name })));

      // Criar mapa de empresas (nome -> id) - case insensitive
      const empresasMap = new Map<string, string>();
      empresas?.forEach(empresa => {
        const nomeNormalizado = empresa.name.toLowerCase().trim();
        empresasMap.set(nomeNormalizado, empresa.id);
        console.log(`Mapeamento: "${nomeNormalizado}" -> ${empresa.id}`);
      });

      console.log('=== VERIFICANDO EMPRESAS DOS EQUIPAMENTOS ===');

      // Verificar se todas as empresas do arquivo existem no banco
      const empresasDoArquivo = [...new Set(valid.map(eq => eq.empresa.toLowerCase().trim()))];
      console.log('Empresas únicas no arquivo:', empresasDoArquivo);

      const empresasNaoEncontradas = empresasDoArquivo.filter(nomeEmpresa => {
        const encontrada = empresasMap.has(nomeEmpresa);
        console.log(`Empresa "${nomeEmpresa}": ${encontrada ? 'ENCONTRADA' : 'NÃO ENCONTRADA'}`);
        return !encontrada;
      });

      if (empresasNaoEncontradas.length > 0) {
        const erro = `Empresas não encontradas no sistema: ${empresasNaoEncontradas.join(', ')}`;
        console.error(erro);
        throw new Error(erro);
      }

      console.log('=== VERIFICANDO EQUIPAMENTOS DUPLICADOS ===');

      // Verificar equipamentos duplicados
      const { data: equipamentosExistentes, error: equipError } = await supabase
        .from('equipamentos')
        .select('numero_serie');

      if (equipError) {
        console.error('Erro ao verificar equipamentos existentes:', equipError);
        throw new Error(`Erro ao verificar duplicatas: ${equipError.message}`);
      }

      const numerosExistentes = new Set<string>();
      equipamentosExistentes?.forEach(eq => {
        numerosExistentes.add(eq.numero_serie.toLowerCase().trim());
      });

      console.log('Equipamentos já existentes no banco:', numerosExistentes.size);

      // Filtrar equipamentos que não são duplicados
      const equipamentosNovos = valid.filter(eq => {
        const isDuplicate = numerosExistentes.has(eq.numero_serie.toLowerCase().trim());
        if (isDuplicate) {
          console.log(`DUPLICATA IGNORADA: ${eq.numero_serie}`);
        }
        return !isDuplicate;
      });

      console.log('Equipamentos novos para inserir:', equipamentosNovos.length);

      if (equipamentosNovos.length === 0) {
        throw new Error('Todos os equipamentos já existem no sistema');
      }

      const duplicatas = valid.length - equipamentosNovos.length;
      if (duplicatas > 0) {
        console.log(`${duplicatas} equipamentos duplicados serão ignorados`);
      }

      console.log('=== PREPARANDO EQUIPAMENTOS PARA INSERÇÃO ===');

      // Obter data atual no formato correto
      const hoje = new Date();
      const dataAtual = hoje.getFullYear() + '-' + 
                      String(hoje.getMonth() + 1).padStart(2, '0') + '-' + 
                      String(hoje.getDate()).padStart(2, '0');
      
      console.log('Data de entrada definida:', dataAtual);
      
      const equipamentosParaInserir = equipamentosNovos.map(eq => {
        const empresaId = empresasMap.get(eq.empresa.toLowerCase().trim());
        const equipamento = {
          tipo: eq.tipo,
          numero_serie: eq.numero_serie,
          modelo: eq.modelo || null,
          id_empresa: empresaId,
          estado: eq.estado || null,
          data_entrada: dataAtual,
          status: eq.status || 'disponivel'
        };
        
        console.log('Equipamento preparado:', equipamento);
        return equipamento;
      });

      console.log('=== INSERINDO EQUIPAMENTOS NO BANCO ===');
      console.log('Total a inserir:', equipamentosParaInserir.length);

      // Inserir em lotes menores para melhor controle
      const batchSize = 100;
      let totalInseridos = 0;
      const errosInsercao = [];

      for (let i = 0; i < equipamentosParaInserir.length; i += batchSize) {
        const batch = equipamentosParaInserir.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        
        console.log(`=== LOTE ${batchNumber} (${batch.length} equipamentos) ===`);
        console.log('Amostra do lote:', batch[0]);

        const { data, error } = await supabase
          .from('equipamentos')
          .insert(batch)
          .select('id, numero_serie, data_entrada, status, id_empresa');

        if (error) {
          console.error(`Erro no lote ${batchNumber}:`, error);
          errosInsercao.push(`Lote ${batchNumber}: ${error.message}`);
          continue;
        }

        const inseridosNesteLote = data?.length || 0;
        totalInseridos += inseridosNesteLote;
        
        console.log(`Lote ${batchNumber} inserido: ${inseridosNesteLote} equipamentos`);
        console.log('Dados inseridos (amostra):', data?.slice(0, 2));
        console.log(`Total inserido até agora: ${totalInseridos}`);
      }

      console.log('=== RESULTADO FINAL ===');
      console.log('Total processado:', valid.length);
      console.log('Total inserido:', totalInseridos);
      console.log('Duplicatas ignoradas:', duplicatas);
      console.log('Erros de inserção:', errosInsercao.length);

      if (errosInsercao.length > 0) {
        console.error('Erros encontrados durante a inserção:', errosInsercao);
      }

      let mensagem = `${totalInseridos} equipamentos importados com sucesso`;
      if (duplicatas > 0) {
        mensagem += `, ${duplicatas} duplicatas ignoradas`;
      }
      if (errosInsercao.length > 0) {
        mensagem += `, ${errosInsercao.length} erros de inserção`;
      }

      toast({
        title: "Importação Concluída",
        description: mensagem,
        variant: totalInseridos > 0 ? "default" : "destructive",
      });

      if (totalInseridos > 0) {
        onImportComplete();
        onClose();
      }
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
                          <td className="border p-2">{item.status || 'disponivel'}</td>
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
              <li>• Campos opcionais: Modelo, Estado, Status</li>
              <li>• Status válidos: disponivel, em_uso, manutencao, aguardando_manutencao, danificado, indisponivel</li>
              <li>• A empresa especificada no arquivo será respeitada</li>
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
