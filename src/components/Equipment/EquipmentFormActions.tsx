
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface EquipmentFormActionsProps {
  loading: boolean;
  onCancel: () => void;
}

const EquipmentFormActions: React.FC<EquipmentFormActionsProps> = ({
  loading,
  onCancel
}) => {
  return (
    <div className="flex justify-end gap-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" disabled={loading}>
        <Save className="h-4 w-4 mr-2" />
        {loading ? 'Salvando...' : 'Salvar'}
      </Button>
    </div>
  );
};

export default EquipmentFormActions;
