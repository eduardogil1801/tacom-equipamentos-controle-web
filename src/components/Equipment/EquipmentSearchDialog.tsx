
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
}

const EquipmentSearchDialog: React.FC<EquipmentSearchDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  equipmentType
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadEquipments();
    }
  }, [isOpen, equipmentType]);

  useEffect(() => {
    filterEquipments();
  }, [searchTerm, equipments]);

  const loadEquipments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name
          )
        `)
        .order('numero_serie');

      // Filtrar por tipo se especificado
      if (equipmentType) {
        query = query.eq('tipo', equipmentType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEquipments(data || []);
      setFilteredEquipments(data || []);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEquipments = () => {
    if (!searchTerm.trim()) {
      setFilteredEquipments(equipments);
      return;
    }

    const filtered = equipments.filter(equipment =>
      equipment.numero_serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (equipment.modelo && equipment.modelo.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setFilteredEquipments(filtered);
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
    if (selectedEquipments.size === filteredEquipments.length) {
      setSelectedEquipments(new Set());
    } else {
      setSelectedEquipments(new Set(filteredEquipments.map(eq => eq.id)));
    }
  };

  const handleConfirm = () => {
    const selectedEquipmentsList = equipments.filter(eq => selectedEquipments.has(eq.id));
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
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar por número de série, tipo ou modelo</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Digite para buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {equipmentType && (
              <p className="text-sm text-gray-600">
                Filtrando por tipo: <strong>{equipmentType}</strong>
              </p>
            )}
          </div>

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

          <div className="flex-1 overflow-y-auto border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">Carregando equipamentos...</div>
              </div>
            ) : filteredEquipments.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-sm text-gray-500">Nenhum equipamento encontrado</div>
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
                        {equipment.tipo} - {equipment.modelo || 'Sem modelo'} - {equipment.empresas?.name || 'N/A'}
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
