
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Company {
  id: string;
  name: string;
  estado?: string;
}

interface EquipmentType {
  id: string;
  nome: string;
}

interface FormData {
  numero_serie: string;
  tipo: string;
  modelo: string;
  estado: string;
  status: string;
  data_entrada: string;
  id_empresa: string;
}

interface EquipmentFormFieldsProps {
  formData: FormData;
  equipmentTypes: EquipmentType[];
  companies: Company[];
  onInputChange: (field: string, value: string) => void;
  onCompanyChange: (companyId: string) => void;
}

const EquipmentFormFields: React.FC<EquipmentFormFieldsProps> = ({
  formData,
  equipmentTypes,
  companies,
  onInputChange,
  onCompanyChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="numero_serie">Número de Série *</Label>
        <Input
          id="numero_serie"
          value={formData.numero_serie}
          onChange={(e) => onInputChange('numero_serie', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="tipo">Tipo *</Label>
        <Select
          value={formData.tipo}
          onValueChange={(value) => onInputChange('tipo', value)}
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

      <div>
        <Label htmlFor="modelo">Modelo</Label>
        <Input
          id="modelo"
          value={formData.modelo}
          onChange={(e) => onInputChange('modelo', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="empresa">Empresa *</Label>
        <Select
          value={formData.id_empresa}
          onValueChange={onCompanyChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma empresa" />
          </SelectTrigger>
          <SelectContent>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="estado">Estado</Label>
        <Input
          id="estado"
          value={formData.estado}
          readOnly
          className="bg-gray-100"
          placeholder="Estado será preenchido automaticamente"
        />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => onInputChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="disponivel">Disponível</SelectItem>
            <SelectItem value="em_uso">Em Uso</SelectItem>
            <SelectItem value="manutencao">Manutenção</SelectItem>
            <SelectItem value="aguardando_manutencao">Aguardando Manutenção</SelectItem>
            <SelectItem value="danificado">Danificado</SelectItem>
            <SelectItem value="indisponivel">Indisponível</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="data_entrada">Data de Entrada</Label>
        <Input
          id="data_entrada"
          type="date"
          value={formData.data_entrada}
          onChange={(e) => onInputChange('data_entrada', e.target.value)}
          required
        />
      </div>
    </div>
  );
};

export default EquipmentFormFields;
