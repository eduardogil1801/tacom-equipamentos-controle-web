
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'disponivel':
        return { label: 'Disponível', className: 'bg-green-100 text-green-800 hover:bg-green-200' };
      case 'em_uso':
        return { label: 'Em Uso', className: 'bg-blue-100 text-blue-800 hover:bg-blue-200' };
      case 'manutencao':
        return { label: 'Manutenção', className: 'bg-orange-100 text-orange-800 hover:bg-orange-200' };
      case 'aguardando_manutencao':
        return { label: 'Aguardando Manutenção', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' };
      case 'danificado':
        return { label: 'Danificado', className: 'bg-red-100 text-red-800 hover:bg-red-200' };
      case 'indisponivel':
        return { label: 'Indisponível', className: 'bg-black text-white hover:bg-gray-800' };
      case 'devolvido':
        return { label: 'Devolvido', className: 'bg-black text-white hover:bg-gray-800' };
      default:
        return { label: status || 'Desconhecido', className: 'bg-gray-100 text-gray-800 hover:bg-gray-200' };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${className || ''}`}
    >
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
