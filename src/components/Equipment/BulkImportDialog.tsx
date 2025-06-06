
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { insertCcit5UsedEquipments, insertCcit5ForTacomRS, getCcit5UsedEquipmentsList } from '@/utils/equipmentBulkInsert';
import { Upload, Zap } from 'lucide-react';

interface Company {
  id: string;
  name: string;
}

interface BulkImportDialogProps {
  companies: Company[];
  onImportComplete: () => void;
}

const BulkImportDialog: React.FC<BulkImportDialogProps> = ({ companies, onImportComplete }) => {
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const estados = [
    'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
    'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
    'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
    'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
    'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
  ];

  const handleImport = async () => {
    if (!selectedCompany || !selectedState) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma empresa e um estado.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await insertCcit5UsedEquipments(selectedCompany, selectedState);
      
      toast({
        title: "Sucesso",
        description: `${getCcit5UsedEquipmentsList().length} equipamentos CCIT 5.0 importados com sucesso!`,
      });
      
      onImportComplete();
      setOpen(false);
      setSelectedCompany('');
      setSelectedState('');
    } catch (error) {
      console.error('Erro ao importar equipamentos:', error);
      toast({
        title: "Erro",
        description: "Erro ao importar equipamentos. Verifique se os números de série não existem já no sistema.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickImportTacom = async () => {
    setLoading(true);
    try {
      await insertCcit5ForTacomRS();
      
      toast({
        title: "Sucesso",
        description: `${getCcit5UsedEquipmentsList().length} equipamentos CCIT 5.0 importados para FILIAL - TACOM (RS) com sucesso!`,
      });
      
      onImportComplete();
      setOpen(false);
    } catch (error) {
      console.error('Erro ao importar equipamentos para TACOM:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao importar equipamentos para TACOM-RS.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const equipmentsList = getCcit5UsedEquipmentsList();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Importar CCIT 5.0 Usados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Equipamentos CCIT 5.0 Usados</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Equipamentos a serem importados:</h3>
            <p className="text-sm text-blue-700 mb-2">
              {equipmentsList.length} equipamentos CCIT 5.0 usados serão adicionados ao estoque.
            </p>
            <div className="text-xs text-blue-600 max-h-32 overflow-y-auto">
              {equipmentsList.join(', ')}
            </div>
          </div>

          {/* Importação rápida para TACOM-RS */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-900 mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Importação Rápida - FILIAL TACOM (RS)
            </h3>
            <p className="text-sm text-green-700 mb-3">
              Importe diretamente para a FILIAL - TACOM do Rio Grande do Sul.
            </p>
            <Button 
              onClick={handleQuickImportTacom} 
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Importando...' : `Importar para TACOM-RS (${equipmentsList.length} equipamentos)`}
            </Button>
          </div>

          {/* Importação personalizada */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-3">Ou selecione empresa e estado manualmente:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Empresa *</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {estados.map(estado => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                onClick={handleImport} 
                disabled={loading || !selectedCompany || !selectedState}
                className="flex-1"
              >
                {loading ? 'Importando...' : `Importar ${equipmentsList.length} Equipamentos`}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;
