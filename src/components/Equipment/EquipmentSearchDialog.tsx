import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  modelo?: string;
  empresas?: {
    name: string;
  };
}

interface EquipmentSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (equipments: Equipment[]) => void;
  equipmentType?: string;
  companyFilter?: string;
}

const EquipmentSearchDialog: React.FC<EquipmentSearchDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  equipmentType,
  companyFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setFilteredEquipments([]);
      setSelectedEquipments(new Set());
    }
  }, [isOpen]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim()) {
        searchEquipments();
      } else {
        setFilteredEquipments([]);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const searchEquipments = async () => {
    if (!searchTerm.trim()) {
      setFilteredEquipments([]);
      return;
    }

    setLoading(true);
    try {
      console.log('Buscando equipamentos com termo:', searchTerm);
      
      // Check if it's a space-separated search
      const isMultipleSearch = searchTerm.includes(' ');
      
      let query = supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name
          )
        `)
        .order('numero_serie');

      if (isMultipleSearch) {
        // Handle space-separated search
        const serialNumbers = searchTerm
          .split(' ')
          .map(s => s.trim())
          .filter(Boolean);

        console.log('Buscando números de série:', serialNumbers);

        if (serialNumbers.length > 0) {
          query = query.in('numero_serie', serialNumbers);
        }
      } else {
        // Handle single search term - busca apenas no início do número de série
        query = query.ilike('numero_serie', `${searchTerm.trim()}%`);
      }

      // Filter by equipment type if specified
      if (equipmentType) {
        query = query.eq('tipo', equipmentType);
      }

      // Filter by company if specified
      if (companyFilter) {
        query = query.eq('empresas.name', companyFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro na busca:', error);
        throw error;
      }

      console.log('Equipamentos encontrados:', data);
      setFilteredEquipments(data || []);
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
      setFilteredEquipments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentToggle = (equipmentId: string) => {
    const newSelected = new Set(selectedEquipments);
    if (newSelected.has(equipmentId)) {
      newSelected.delete(equipmentId);
    } else {
      newSelected.add(equipmentId);
    }
    setSelectedEquipments(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedEquipments.size === filteredEquipments.length && filteredEquipments.length > 0) {
      setSelectedEquipments(new Set());
    } else {
      setSelectedEquipments(new Set(filteredEquipments.map(eq => eq.id)));
    }
  };

  const handleConfirm = () => {
    const selectedEquipmentsList = filteredEquipments.filter(eq => selectedEquipments.has(eq.id));
    console.log('Equipamentos confirmados:', selectedEquipmentsList);
    onConfirm(selectedEquipmentsList);
    setSelectedEquipments(new Set());
    setSearchTerm('');
    onClose();
  };

  const handleCancel = () => {
    setSelectedEquipments(new Set());
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Buscar Equipamentos</DialogTitle>
          <DialogDescription>
            Selecione os equipamentos que deseja incluir na movimentação
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          <div className="space-y-2">
            <Label htmlFor="search">
              Buscar por número de série
            </Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Digite os primeiros números ou múltiplos separados por espaço (ex: 412 40412 41200)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon" onClick={searchEquipments}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {equipmentType && (
              <p className="text-sm text-gray-600">
                Filtrando por tipo: <strong>{equipmentType}</strong>
              </p>
            )}
            <p className="text-xs text-gray-500">
              A busca procura equipamentos que começam com os números digitados
            </p>
          </div>

          {filteredEquipments.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="selectAll"
                checked={selectedEquipments.size === filteredEquipments.length && filteredEquipments.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="selectAll">
                Selecionar todos ({filteredEquipments.length} equipamentos)
              </Label>
            </div>
          )}

          <div className="flex-1 overflow-y-auto border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">Buscando equipamentos...</div>
              </div>
            ) : filteredEquipments.length === 0 && searchTerm ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">
                  Nenhum equipamento encontrado para "{searchTerm}"
                </div>
              </div>
            ) : filteredEquipments.length === 0 && !searchTerm ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">
                  Digite no campo de busca para encontrar equipamentos
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {filteredEquipments.map((equipment) => (
                  <div
                    key={equipment.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleEquipmentToggle(equipment.id)}
                  >
                    <Checkbox
                      checked={selectedEquipments.has(equipment.id)}
                      onChange={() => handleEquipmentToggle(equipment.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{equipment.numero_serie}</div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{equipment.tipo}</span>
                        {equipment.modelo && ` - ${equipment.modelo}`}
                        {equipment.empresas?.name && ` - ${equipment.empresas.name}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0">
          <div className="flex justify-between items-center w-full">
            <span className="text-sm text-gray-600">
              {selectedEquipments.size} equipamento(s) selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirm}
                disabled={selectedEquipments.size === 0}
              >
                Confirmar Seleção
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentSearchDialog;
