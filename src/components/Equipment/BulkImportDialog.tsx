
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface BulkImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EquipmentRow {
  numero_serie: string;
  tipo: string;
}

const BulkImportDialog: React.FC<BulkImportDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const downloadTemplate = () => {
    const templateData = [
      { numero_serie: '12345', tipo: 'DVR' },
      { numero_serie: '67890', tipo: 'CAMERA' },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Equipamentos');
    XLSX.writeFile(wb, 'template_equipamentos.xlsx');
    
    toast({
      title: "Template baixado",
      description: "Template de importação baixado com sucesso!",
    });
  };

  const validateEquipmentData = (data: any[]): { valid: EquipmentRow[], errors: string[] } => {
    const valid: EquipmentRow[] = [];
    const errors: string[] = [];

    data.forEach((row, index) => {
      const rowNumber = index + 2; // +2 porque começa na linha 2 (header na linha 1)
      
      // Converter numero_serie para string, independente do tipo
      const numero_serie = row.numero_serie ? String(row.numero_serie).trim() : '';
      const tipo = row.tipo ? String(row.tipo).trim().toUpperCase() : '';

      if (!numero_serie) {
        errors.push(`Linha ${rowNumber}: Número de série é obrigatório`);
        return;
      }

      if (!tipo) {
        errors.push(`Linha ${rowNumber}: Tipo é obrigatório`);
        return;
      }

      valid.push({
        numero_serie,
        tipo
      });
    });

    return { valid, errors };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setErrors([]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo Excel",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setErrors([]);

    try {
      // Verificar se empresa TACOM existe
      const { data: empresas, error: empresaError } = await supabase
        .from('empresas')
        .select('id')
        .ilike('name', '%tacom%sistema%poa%')
        .limit(1);

      if (empresaError) throw empresaError;

      if (!empresas || empresas.length === 0) {
        throw new Error('Empresa TACOM SISTEMAS POA não encontrada. Por favor, cadastre a empresa primeiro.');
      }

      const empresaId = empresas[0].id;

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          console.log('Dados lidos do Excel:', jsonData);
          console.log('Total de linhas:', jsonData.length);

          const { valid, errors: validationErrors } = validateEquipmentData(jsonData);
          
          if (validationErrors.length > 0) {
            setErrors(validationErrors);
            setIsImporting(false);
            return;
          }

          if (valid.length === 0) {
            throw new Error('Nenhum equipamento válido encontrado no arquivo');
          }

          console.log('Equipamentos válidos para importação:', valid.length);

          // Verificar duplicatas no banco
          const numerosSerieExistentes = valid.map(eq => eq.numero_serie);
          const { data: equipamentosExistentes } = await supabase
            .from('equipamentos')
            .select('numero_serie')
            .in('numero_serie', numerosSerieExistentes);

          const numerosExistentes = new Set(equipamentosExistentes?.map(eq => eq.numero_serie) || []);
          const equipamentosNovos = valid.filter(eq => !numerosExistentes.has(eq.numero_serie));

          if (equipamentosNovos.length === 0) {
            throw new Error('Todos os equipamentos já existem no sistema');
          }

          if (numerosExistentes.size > 0) {
            console.log(`${numerosExistentes.size} equipamentos duplicados serão ignorados`);
          }

          // Preparar dados para inserção
          const dataAtual = new Date().toISOString().split('T')[0];
          const equipamentosParaInserir = equipamentosNovos.map(eq => ({
            numero_serie: eq.numero_serie,
            tipo: eq.tipo,
            id_empresa: empresaId,
            data_entrada: dataAtual,
            modelo: '',
            status: 'disponivel',
            em_manutencao: false
          }));

          console.log('Equipamentos para inserir:', equipamentosParaInserir.length);

          // Inserir em lotes de 500 para evitar limitações
          const batchSize = 500;
          let totalInseridos = 0;

          for (let i = 0; i < equipamentosParaInserir.length; i += batchSize) {
            const batch = equipamentosParaInserir.slice(i, i + batchSize);
            console.log(`Inserindo lote ${Math.floor(i / batchSize) + 1}:`, batch.length, 'equipamentos');
            
            const { error: insertError, data } = await supabase
              .from('equipamentos')
              .insert(batch)
              .select('id');

            if (insertError) {
              console.error('Erro ao inserir lote:', insertError);
              throw insertError;
            }

            totalInseridos += data?.length || 0;
            console.log(`Lote inserido com sucesso. Total inserido até agora: ${totalInseridos}`);
          }

          const duplicatas = valid.length - equipamentosNovos.length;
          
          toast({
            title: "Importação concluída",
            description: `${totalInseridos} equipamentos importados com sucesso${duplicatas > 0 ? `. ${duplicatas} duplicatas ignoradas` : ''}.`,
          });

          onSuccess();
          onClose();
        } catch (error) {
          console.error('Erro durante importação:', error);
          toast({
            title: "Erro na importação",
            description: error instanceof Error ? error.message : "Erro desconhecido durante a importação",
            variant: "destructive",
          });
        } finally {
          setIsImporting(false);
        }
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Erro ao preparar importação:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao preparar importação",
        variant: "destructive",
      });
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importação em Lote</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar Template Excel
            </Button>
          </div>

          <div>
            <Label htmlFor="file">Arquivo Excel (.xlsx)</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isImporting}
            />
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                <AlertCircle className="h-4 w-4" />
                Erros encontrados:
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={!file || isImporting}
              className="flex-1 flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isImporting ? 'Importando...' : 'Importar'}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isImporting}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;
