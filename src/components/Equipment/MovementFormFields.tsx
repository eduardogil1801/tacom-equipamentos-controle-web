import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import MovementStatusSelector from './MovementStatusSelector';
import MovementEquipmentSelector from './MovementEquipmentSelector';

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
  empresa_origem?: string;
  tipo_manutencao_id: string;
  defeito_reclamado_id: string;
  defeito_encontrado_id: string;
  tipo_equipamento: string;
  modelo_equipamento: string;
  status_equipamento: string;
}

interface MovementFormFieldsProps {
  movementData: MovementData;
  companies: Company[];
  maintenanceTypes: MaintenanceType[];
  equipmentTypes: EquipmentType[];
  isDestinationTacom: boolean;
  selectedEquipments: any[];
  onInputChange: (field: string, value: string) => void;
  onEquipmentSelect: (equipments: any[]) => void;
  onRemoveEquipment: (equipmentId: string) => void;
}

const MovementFormFields: React.FC<MovementFormFieldsProps> = ({
  movementData,
  companies,
  maintenanceTypes = [],
  equipmentTypes,
  isDestinationTacom,
  selectedEquipments,
  onInputChange,
  onEquipmentSelect,
  onRemoveEquipment
}) => {
  
  // Filtrar por código DR e DE
  const defeitosReclamados = maintenanceTypes.filter(type => 
    type.codigo.toUpperCase().startsWith('DR')
  );
  
  const defeitosEncontrados = maintenanceTypes.filter(type => 
    type.codigo.toUpperCase().startsWith('DE') || type.codigo.toUpperCase().startsWith('ER')
  );

  // Verificar se deve mostrar campos de defeitos
  const shouldShowDefeitosFields = 
    movementData.tipo_movimento === 'manutencao' || 
    movementData.tipo_movimento === 'movimentacao_interna' || 
    movementData.tipo_movimento === 'envio_manutencao' ||
    movementData.tipo_movimento === 'devolucao' ||
    movementData.tipo_movimento === 'retorno_manutencao';

  const getDestinationCompanies = () => {
    if (movementData.tipo_movimento === 'envio_manutencao') {
      return companies.filter(c => c.name === 'TACOM PROJETOS (CTG)');
    }
    return companies;
  };

  const getOriginCompanies = () => {
    if (movementData.tipo_movimento === 'envio_manutencao') {
      return companies.filter(c => 
        c.name === 'TACOM SISTEMAS POA' || c.name === 'TACOM PROJETOS SC'
      );
    }
    return companies;
  };

  React.useEffect(() => {
    if (movementData.tipo_movimento === 'movimentacao_interna') {
      const tacomCompany = companies.find(c => c.name === 'TACOM SISTEMAS POA');
      if (tacomCompany) {
        onInputChange('empresa_destino', tacomCompany.id);
        onInputChange('empresa_origem', tacomCompany.name);
      }
    } else if (movementData.tipo_movimento === 'envio_manutencao') {
      const tacomCtgCompany = companies.find(c => c.name === 'TACOM PROJETOS (CTG)');
      if (tacomCtgCompany) {
        onInputChange('empresa_destino', tacomCtgCompany.id);
      }
    }
  }, [movementData.tipo_movimento, companies, onInputChange]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lado Esquerdo */}
        <div className="space-y-4">
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
                <SelectItem value="movimentacao">Alocação</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="devolucao">Devolução</SelectItem>
                <SelectItem value="retorno_manutencao">Retorno de Manutenção</SelectItem>
                <SelectItem value="movimentacao_interna">Movimentação Interna</SelectItem>
                <SelectItem value="envio_manutencao">Envio Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tipo_equipamento">Tipo de Equipamento *</Label>
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

          <MovementEquipmentSelector
            selectedEquipments={selectedEquipments}
            onEquipmentSelect={onEquipmentSelect}
            onRemoveEquipment={onRemoveEquipment}
            equipmentType={movementData.tipo_equipamento}
            companyFilter={movementData.tipo_movimento === 'movimentacao_interna' ? 'TACOM SISTEMAS POA' : undefined}
          />

          <div>
            <Label htmlFor="empresa_origem">Empresa Origem</Label>
            {movementData.tipo_movimento === 'envio_manutencao' ? (
              <Select
                value={movementData.empresa_origem}
                onValueChange={(value) => onInputChange('empresa_origem', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa origem" />
                </SelectTrigger>
                <SelectContent>
                  {getOriginCompanies().map((company) => (
                    <SelectItem key={company.id} value={company.name}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="empresa_origem"
                value={movementData.empresa_origem || ''}
                readOnly
                placeholder="Será preenchido automaticamente"
                className="bg-gray-50"
              />
            )}
          </div>

          <div>
            <Label htmlFor="empresa_destino">Empresa Destino *</Label>
            <Select
              value={movementData.empresa_destino}
              onValueChange={(value) => onInputChange('empresa_destino', value)}
              disabled={movementData.tipo_movimento === 'movimentacao_interna' || movementData.tipo_movimento === 'envio_manutencao'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a empresa destino" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {getDestinationCompanies().map((company) => (
                  <SelectItem 
                    key={company.id} 
                    value={company.id}
                    className="text-sm"
                  >
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lado Direito */}
        <div className="space-y-4">
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

          {/* CAMPOS DR e DE - Corrigidos sem value vazio */}
          {shouldShowDefeitosFields && (
            <>
              <div>
                <Label htmlFor="defeito_reclamado_id" className="text-red-600 font-semibold">
                  DR - Defeito Reclamado *
                </Label>
                <Select
                  value={movementData.defeito_reclamado_id || 'NONE'}
                  onValueChange={(value) => onInputChange('defeito_reclamado_id', value === 'NONE' ? '' : value)}
                >
                  <SelectTrigger className="border-red-300">
                    <SelectValue placeholder="Selecione o defeito reclamado" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="NONE">-- Nenhum --</SelectItem>
                    {defeitosReclamados.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.codigo} - {type.descricao}
                      </SelectItem>
                    ))}
                    {defeitosReclamados.length === 0 && (
                      <SelectItem value="NO_DATA" disabled>
                        Nenhum defeito DR cadastrado
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-red-600 mt-1">
                  Defeito reportado inicialmente pelo cliente
                </p>
              </div>

              <div>
                <Label htmlFor="defeito_encontrado_id" className="text-orange-600 font-semibold">
                  DE - Defeito Encontrado
                </Label>
                <Select
                  value={movementData.defeito_encontrado_id || 'NONE'}
                  onValueChange={(value) => onInputChange('defeito_encontrado_id', value === 'NONE' ? '' : value)}
                >
                  <SelectTrigger className="border-orange-300">
                    <SelectValue placeholder="Selecione o defeito encontrado" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="NONE">-- Nenhum --</SelectItem>
                    {defeitosEncontrados.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.codigo} - {type.descricao}
                      </SelectItem>
                    ))}
                    {defeitosEncontrados.length === 0 && (
                      <SelectItem value="NO_DATA" disabled>
                        Nenhum defeito DE/ER cadastrado
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-orange-600 mt-1">
                  Defeito realmente identificado durante a manutenção
                </p>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="modelo_equipamento">Modelo do Equipamento</Label>
            <Input
              id="modelo_equipamento"
              value={movementData.modelo_equipamento || ''}
              onChange={(e) => onInputChange('modelo_equipamento', e.target.value)}
              placeholder="Ex: Com DVR, Sem DVR, etc."
            />
            <p className="text-xs text-gray-600 mt-1">
              Opcional - para especificar variações do equipamento
            </p>
          </div>

          {(isDestinationTacom || 
            movementData.tipo_movimento === 'movimentacao_interna' || 
            movementData.tipo_movimento === 'envio_manutencao' ||
            movementData.tipo_movimento === 'devolucao' ||
            movementData.tipo_movimento === 'manutencao') && (
            <MovementStatusSelector
              isRequired={true}
              value={movementData.status_equipamento}
              onChange={(value) => onInputChange('status_equipamento', value)}
              label="Status do Equipamento"
              isDestinationTacom={isDestinationTacom || movementData.tipo_movimento === 'devolucao' || movementData.tipo_movimento === 'manutencao'}
            />
          )}
        </div>
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