
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search, X } from 'lucide-react';
import EquipmentSearchDialog from './EquipmentSearchDialog';

interface Equipment {
  id: string;
  numero_serie: string;
  tipo: string;
  modelo?: string;
  empresas?: {
    name: string;
  };
}

interface MovementEquipmentSelectorProps {
  selectedEquipments: Equipment[];
  onEquipmentSelect: (equipments: Equipment[]) => void;
  onRemoveEquipment: (equipmentId: string) => void;
  equipmentType: string;
}

const MovementEquipmentSelector: React.FC<MovementEquipmentSelectorProps> = ({
  selectedEquipments,
  onEquipmentSelect,
  onRemoveEquipment,
  equipmentType
}) => {
  const [showSearch, setShowSearch] = useState(false);

  const handleEquipmentSelect = (equipments: Equipment[]) => {
    console.log('Equipamentos selecionados:', equipments);
    onEquipmentSelect(equipments);
    setShowSearch(false);
  };

  return (
    <>
      <div>
        <Label>Equipamentos Selecionados</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            {selectedEquipments.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                {selectedEquipments.map((equipment) => (
                  <div key={equipment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                    <div>
                      <p className="font-medium">{equipment.numero_serie}</p>
                      <p className="text-sm text-gray-600">
                        {equipment.tipo} {equipment.modelo && `- ${equipment.modelo}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        Empresa: {equipment.empresas?.name || 'N/A'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveEquipment(equipment.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 border rounded-lg border-dashed">
                <p className="text-gray-500">Nenhum equipamento selecionado</p>
              </div>
            )}
          </div>
          <Button type="button" onClick={() => setShowSearch(true)}>
            <Search className="h-4 w-4 mr-2" />
            Buscar Equipamentos
          </Button>
        </div>
      </div>

      {showSearch && (
        <EquipmentSearchDialog
          isOpen={showSearch}
          onClose={() => setShowSearch(false)}
          onConfirm={handleEquipmentSelect}
          equipmentType={equipmentType}
        />
      )}
    </>
  );
};

export default MovementEquipmentSelector;
