
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface FleetFormActionsProps {
  loading: boolean;
}

const FleetFormActions: React.FC<FleetFormActionsProps> = ({ loading }) => {
  return (
    <div className="flex gap-4 pt-4">
      <Button 
        type="submit" 
        className="bg-primary hover:bg-primary/90 flex items-center gap-2" 
        disabled={loading}
      >
        {loading ? (
          'Salvando...'
        ) : (
          <>
            <Save className="h-4 w-4" />
            Salvar Frota
          </>
        )}
      </Button>
    </div>
  );
};

export default FleetFormActions;
