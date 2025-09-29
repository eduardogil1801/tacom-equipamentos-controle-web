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
  categoria_id?: string;
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
  defeito_reclamado_id: string;  // DR
  defeito_encontrado_id: string; // DE
  tipo_equipamento: string;
  modelo_equipamento: string;
  status_equipamento: string;
}

interface MovementFormFieldsProps {
  movementData: MovementData;
  companies: Company[];
  maintenanceTypes: MaintenanceType[];
  equipmentTypes: EquipmentType[];
  categorias: Array<{id: string; codigo: string; nome: string; cor: string}>;
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
  categorias = [],
  isDestinationTacom,
  selectedEquipments,
  onInputChange,
  onEquipmentSelect,
  onRemoveEquipment
}) => {
  
  // Encontrar categoria DR e DE
  const categoriaDR = categorias.find(c => c.codigo === 'DR');
  const categoriaDE = categorias.find(c => c.codigo === 'DE');

  // Filtrar defeitos por categoria
  const defeitosReclamados = maintenanceTypes.filter(
    type => type.categoria_id === categoriaDR?.id
  );
  
  const defeitosEncontrados = maintenanceTypes.filter(
    type => type.categoria_id === categoriaDE?.id
  );

  // Verificar se deve mostrar campos de defeitos (para manutenção e relacionados)
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

  // Auto-preencher campos para movimentação interna e envio manutenção
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
                    <div className="w-full">
                      {company.name}
                    </div>
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

          {/* NOVOS CAMPOS COM CATEGORIAS */}
          {shouldShowDefeitosFields && (
            <div className="space-y-4">
              {/* DR - Defeito Reclamado */}
              <div>
                <Label 
                  htmlFor="defeito_reclamado_id"
                  className="flex items-center gap-2"
                >
                  <span 
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoriaDR?.cor || '#ef4444' }}
                  />
                  DR - Defeito Reclamado
                  {shouldShowDefeitosFields && ' *'}
                </Label>
                <Select
                  value={movementData.defeito_reclamado_id}
                  onValueChange={(value) => onInputChange('defeito_reclamado_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o defeito reclamado" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="">Nenhum</SelectItem>
                    {defeitosReclamados.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.codigo} - {type.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600 mt-1">
                  Defeito reportado inicialmente pelo cliente
                </p>
              </div>

              {/* DE - Defeito Encontrado */}
              <div>
                <Label 
                  htmlFor="defeito_encontrado_id"
                  className="flex items-center gap-2"
                >
                  <span 
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: categoriaDE?.cor || '#f97316' }}
                  />
                  DE - Defeito Encontrado
                </Label>
                <Select
                  value={movementData.defeito_encontrado_id}
                  onValueChange={(value) => onInputChange('defeito_encontrado_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o defeito encontrado" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="">Nenhum</SelectItem>
                    {defeitosEncontrados.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.codigo} - {type.descricao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600 mt-1">
                  Defeito realmente identificado durante a manutenção
                </p>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="modelo_equipamento">Modelo do Equipamento</Label>
            <Input
              id="modelo_equipamento"
              value={movementData.modelo_equipamento}
              onChange={(e) => onInputChange('modelo_equipamento', e.target.value)}
              placeholder="Ex: Com DVR, Sem DVR, etc."
            />
            <p className="text-xs text-gray-600 mt-1">
              Opcional - para especificar variações do equipamento
            </p>
          </div>

          {/* Campo de status */}
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