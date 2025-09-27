import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  categoria_defeito?: 'defeito_reclamado' | 'defeito_encontrado' | 'outro';
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
  defeito_reclamado_id?: string;  
  defeito_encontrado_id?: string; 
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
  
  // Verificar se os novos campos existem baseado na estrutura dos dados
  const hasNewFields = maintenanceTypes.length > 0 && 
    maintenanceTypes.some(type => 'categoria_defeito' in type && type.categoria_defeito);

  // Filtrar tipos por categoria
  const defeitosReclamados = hasNewFields 
    ? maintenanceTypes.filter(type => type.categoria_defeito === 'defeito_reclamado')
    : [];
  
  const defeitosEncontrados = hasNewFields
    ? maintenanceTypes.filter(type => type.categoria_defeito === 'defeito_encontrado')
    : [];
  
  const outrosDefeitos = hasNewFields
    ? maintenanceTypes.filter(type => !type.categoria_defeito || type.categoria_defeito === 'outro')
    : maintenanceTypes;

  // Verificar quando mostrar os novos campos de defeitos
  const shouldShowNewDefeitosFields = hasNewFields && (
    movementData.tipo_movimento === 'manutencao' || 
    movementData.tipo_movimento === 'movimentacao_interna' || 
    movementData.tipo_movimento === 'envio_manutencao' ||
    movementData.tipo_movimento === 'devolucao' ||
    movementData.tipo_movimento === 'retorno_manutencao'
  );

  // Campo legado quando não há novos campos ou para outros casos
  const shouldShowLegacyField = !shouldShowNewDefeitosFields && (
    movementData.tipo_movimento === 'manutencao' ||
    movementData.tipo_movimento === 'movimentacao_interna' || 
    movementData.tipo_movimento === 'envio_manutencao' ||
    movementData.tipo_movimento === 'devolucao' ||
    movementData.tipo_movimento === 'retorno_manutencao'
  );

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

          {/* NOVOS CAMPOS DE DEFEITOS - Agora aparecem destacados */}
          {shouldShowNewDefeitosFields && (
            <div className="space-y-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🔧</span>
                <h3 className="font-semibold text-blue-800">Campos de Defeitos (Novo Sistema)</h3>
                <Badge className="bg-green-100 text-green-800 text-xs">ATIVO</Badge>
              </div>
              
              {/* Defeito Reclamado */}
              <div>
                <Label htmlFor="defeito_reclamado_id" className="text-blue-800 font-medium">
                  Defeito Reclamado (DR) *
                </Label>
                <Select
                  value={movementData.defeito_reclamado_id || ''}
                  onValueChange={(value) => onInputChange('defeito_reclamado_id', value)}
                >
                  <SelectTrigger className="border-blue-300 focus:border-blue-500">
                    <SelectValue placeholder="Selecione o defeito reclamado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum defeito reclamado</SelectItem>
                    {defeitosReclamados.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-100 text-red-800 text-xs">DR</Badge>
                          {type.descricao} ({type.codigo})
                        </div>
                      </SelectItem>
                    ))}
                    {defeitosReclamados.length === 0 && outrosDefeitos.length > 0 && (
                      <>
                        <SelectItem value="" disabled className="font-semibold text-blue-600">
                          ── Outros Defeitos Disponíveis ──
                        </SelectItem>
                        {outrosDefeitos.slice(0, 10).map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.descricao} ({type.codigo})
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-blue-600 mt-1">
                  Defeito reportado inicialmente pelo cliente
                </p>
              </div>

              {/* Defeito Encontrado */}
              <div>
                <Label htmlFor="defeito_encontrado_id" className="text-orange-800 font-medium">
                  Defeito Encontrado (DE/ER)
                </Label>
                <Select
                  value={movementData.defeito_encontrado_id || ''}
                  onValueChange={(value) => onInputChange('defeito_encontrado_id', value)}
                >
                  <SelectTrigger className="border-orange-300 focus:border-orange-500">
                    <SelectValue placeholder="Selecione o defeito encontrado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum defeito encontrado</SelectItem>
                    {defeitosEncontrados.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-orange-100 text-orange-800 text-xs">
                            {type.codigo.startsWith('DE') ? 'DE' : 'ER'}
                          </Badge>
                          {type.descricao} ({type.codigo})
                        </div>
                      </SelectItem>
                    ))}
                    {defeitosEncontrados.length === 0 && outrosDefeitos.length > 0 && (
                      <>
                        <SelectItem value="" disabled className="font-semibold text-orange-600">
                          ── Outros Defeitos Disponíveis ──
                        </SelectItem>
                        {outrosDefeitos.slice(0, 10).map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.descricao} ({type.codigo})
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-orange-600 mt-1">
                  Defeito realmente identificado durante a manutenção
                </p>
              </div>
            </div>
          )}

          {/* CAMPO LEGADO - quando novos campos não estão disponíveis */}
          {shouldShowLegacyField && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <Label htmlFor="tipo_manutencao_id" className="flex items-center gap-2">
                Tipo de Manutenção {shouldShowLegacyField && '*'}
                {!hasNewFields && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                    MODO LEGADO
                  </Badge>
                )}
              </Label>
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
              
              {!hasNewFields && (
                <p className="text-xs text-yellow-600 mt-1">
                  Execute a migração SQL para ter campos separados de defeitos
                </p>
              )}
            </div>
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

      {/* Banner informativo sobre o status dos campos */}
      <div className="mt-6">
        {hasNewFields ? (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-green-500 text-xl">✅</div>
              <div>
                <h3 className="font-semibold text-green-800 mb-1">
                  Sistema de Defeitos Ativado!
                </h3>
                <p className="text-sm text-green-700 mb-2">
                  Os campos de <strong>Defeito Reclamado (DR)</strong> e <strong>Defeito Encontrado (DE/ER)</strong> estão funcionando perfeitamente.
                </p>
                <div className="flex gap-2 text-xs">
                  <Badge className="bg-red-100 text-red-800">DR = Defeito Reclamado</Badge>
                  <Badge className="bg-orange-100 text-orange-800">DE/ER = Defeito Encontrado</Badge>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-blue-500 text-xl">🚀</div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">
                  Sistema de Defeitos Disponível!
                </h3>
                <p className="text-sm text-blue-700 mb-2">
                  Execute a migração SQL para ativar os campos separados de <strong>Defeito Reclamado (DR)</strong> e <strong>Defeito Encontrado (DE/ER)</strong>.
                </p>
                <p className="text-xs text-blue-600">
                  Isso permitirá um controle mais preciso entre o que foi reportado e o que foi realmente encontrado.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MovementFormFields;