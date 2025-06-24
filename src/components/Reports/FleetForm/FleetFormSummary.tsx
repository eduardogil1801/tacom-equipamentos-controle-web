
import React from 'react';

interface FleetFormSummaryProps {
  total: number;
}

const FleetFormSummary: React.FC<FleetFormSummaryProps> = ({ total }) => {
  return (
    <div className="bg-blue-50 p-4 rounded">
      <div className="text-lg font-semibold text-blue-800">
        Total da Frota: {total}
      </div>
      <div className="text-sm text-blue-600 mt-1">
        Soma automática de todos os tipos de sistema
      </div>
    </div>
  );
};

export default FleetFormSummary;
