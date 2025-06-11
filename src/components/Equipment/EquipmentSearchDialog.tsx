
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Search } from 'lucide-react';
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
  onConfirm: (selectedEquipments: Equipment[]) => void;
}

const EquipmentSearchDialog: React.FC<EquipmentSearchDialogProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [filteredEquipments, setFilteredEquipments] = useState<Equipment[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<Equipment[]>([]);
  const [multipleSelection, setMultipleSelection] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadEquipments();
      setSelectedEquipments([]);
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    filterEquipments();
  }, [searchTerm, equipments]);

  const loadEquipments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`
          *,
          empresas (
            name
          )
        `)
        .order('numero_serie');

      if (error) throw error;
      setEquipments(data || []);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEquipments = () => {
    if (!searchTerm) {
      setFilteredEquipments(equipments);
      return;
    }

    const filtered = equipments.filter(eq =>
      eq.numero_serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (eq.modelo && eq.modelo.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredEquipments(filtered);
  };

  const handleEquipmentSelect = (equipment: Equipment, isSelected: boolean) => {
    if (multipleSelection) {
      if (isSelected) {
        setSelectedEquipments(prev => [...prev, equipment]);
      } else {
        setSelectedEquipments(prev => prev.filter(eq => eq.id !== equipment.id));
      }
    } else {
      if (isSelected) {
        setSelectedEquipments([equipment]);
      } else {
        setSelectedEquipments([]);
      }
    }
  };

  const removeSelectedEquipment = (equipmentId: string) => {
    setSelectedEquipments(prev => prev.filter(eq => eq.id !== equipmentId));
  };

  const handleConfirm = () => {
    if (selectedEquipments.length > 0) {
      onConfirm(selectedEquipments);
      handleClose();
    }
  };

  const handleClose = () => {
    onClose();
    setSelectedEquipments([]);
    setSearchTerm('');
    setMultipleSelection(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Buscar e Selecionar Equipamentos</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 min-h-0">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="multiple"
              checked={multipleSelection}
              onCheckedChange={(checked) => setMultipleSelection(!!checked)}
            />
            <Label htmlFor="multiple">Ativar seleção múltipla de equipamentos</Label>
          </div>

          <div>
            <Label htmlFor="search">Número de Série *</Label>
            <Input
              id="search"
              placeholder="Digite para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex-1 min-h-0">
            <div className="grid grid-cols-1 gap-4 max-h-60 overflow-y-auto">
              {loading ? (
                <div className="text-center py-4">Carregando equipamentos...</div>
              ) : filteredEquipments.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Nenhum equipamento encontrado
                </div>
              ) : (
                filteredEquipments.map((equipment) => {
                  const isSelected = selectedEquipments.some(eq => eq.id === equipment.id);
                  return (
                    <div
                      key={equipment.id}
                      className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        isSelected ? 'bg-blue-50 border-blue-300' : 'border-gray-200'
                      }`}
                      onClick={() => handleEquipmentSelect(equipment, !isSelected)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleEquipmentSelect(equipment, !!checked)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{equipment.numero_serie}</div>
                        <div className="text-sm text-gray-600">
                          {equipment.tipo} - {equipment.empresas?.name || 'N/A'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {selectedEquipments.length > 0 && (
            <Card className="flex-shrink-0">
              <CardHeader>
                <CardTitle>Equipamentos Selecionados ({selectedEquipments.length}):</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedEquipments.map((equipment) => (
                    <div
                      key={equipment.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span>
                        {equipment.numero_serie} - {equipment.tipo}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSelectedEquipment(equipment.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedEquipments.length === 0}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Confirmar Seleção
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EquipmentSearchDialog;
