
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import MovementStatusSelector from './MovementStatusSelector';

interface Company {
  id: string;
  name: string;
}

interface MaintenanceType {
  id: string;
  descricao: string;
  codigo: string;
}

interface EquipmentType {
  id: string;
  nome: string;
}

interface MovementData {
  tipo_movimento: string;
  data_movimento: string;
  observacoes: string;
  empresa_destino: string;
  tipo_manutencao_id: string;
  tipo_equipamento: string;
  status_equipamento: string;
}

interface MovementFormFieldsProps {
  movementData: MovementData;
  companies: Company[];
  maintenanceTypes: MaintenanceType[];
  equipmentTypes: EquipmentType[];
  isDestinationTacom: boolean;
  onInputChange: (field: string, value: string) => void;
}

const MovementFormFields: React.FC<MovementFormFieldsProps> = ({
  movementData,
  companies,
  maintenanceTypes,
  equipmentTypes,
  isDestinationTacom,
  onInputChange
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tipo_movimento">Tipo de Movimentação *</Label>
          <Select
            value={movementData.tipo_movimento}
            onValueChange={(value) => onInputChange('tipo_movimento', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="saida">Saída</SelectItem>
              <SelectItem value="movimentacao">Movimentação</SelectItem>
              <SelectItem value="manutencao">Manutenção</SelectItem>
              <SelectItem value="aguardando_manutencao">Aguardando Manutenção</SelectItem>
              <SelectItem value="danificado">Danificado</SelectItem>
              <SelectItem value="indisponivel">Indisponível</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="data_movimento">Data da Movimentação *</Label>
          <Input
            id="data_movimento"
            type="date"
            value={movementData.data_movimento}
            onChange={(e) => onInputChange('data_movimento', e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="empresa_destino">
            Empresa Destino {movementData.tipo_movimento === 'movimentacao' && '*'}
          </Label>
          <Select
            value={movementData.empresa_destino}
            onValueChange={(value) => onInputChange('empresa_destino', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a empresa destino" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {movementData.tipo_movimento === 'movimentacao' && (
            <p className="text-xs text-gray-600 mt-1">
              ⚠️ Obrigatório para movimentações entre empresas
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="tipo_manutencao_id">Tipo de Manutenção</Label>
          <Select
            value={movementData.tipo_manutencao_id}
            onValueChange={(value) => onInputChange('tipo_manutencao_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo de manutenção" />
            </SelectTrigger>
            <SelectContent>
              {maintenanceTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.descricao} ({type.codigo})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="tipo_equipamento">Tipo de Equipamento</Label>
          <Select
            value={movementData.tipo_equipamento}
            onValueChange={(value) => onInputChange('tipo_equipamento', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {equipmentTypes.map((type) => (
                <SelectItem key={type.id} value={type.nome}>
                  {type.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <MovementStatusSelector
          isRequired={isDestinationTacom}
          value={movementData.status_equipamento}
          onChange={(value) => onInputChange('status_equipamento', value)}
          label={isDestinationTacom ? "Status para TACOM" : "Status do Equipamento"}
        />
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={movementData.observacoes}
          onChange={(e) => onInputChange('observacoes', e.target.value)}
          placeholder="Digite observações sobre a movimentação..."
          rows={3}
        />
      </div>
    </>
  );
};

export default MovementFormFields;
