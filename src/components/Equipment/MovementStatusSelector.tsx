
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MovementStatusSelectorProps {
  isRequired: boolean;
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const MovementStatusSelector: React.FC<MovementStatusSelectorProps> = ({
  isRequired,
  value,
  onChange,
  label = "Status do Equipamento"
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="equipment_status">
        {label} {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Selecione o ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="disponivel">Disponível</SelectItem>
          <SelectItem value="em_uso">Em Uso</SelectItem>
          <SelectItem value="manutencao">Manutenção</SelectItem>
          <SelectItem value="aguardando_manutencao">Aguardando Manutenção</SelectItem>
          <SelectItem value="danificado">Danificado</SelectItem>
          <SelectItem value="indisponivel">Indisponível</SelectItem>
          <SelectItem value="devolvido">Devolvido</SelectItem>
        </SelectContent>
      </Select>
      {isRequired && (
        <p className="text-xs text-red-600">
          ⚠️ Status obrigatório para movimentações para TACOM
        </p>
      )}
    </div>
  );
};

export default MovementStatusSelector;
