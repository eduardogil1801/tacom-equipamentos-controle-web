import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MovementStatusSelector from './MovementStatusSelector';

interface MaintenanceType {
  id: string;
  codigo: string;
  descricao: string;
  categoria_defeito?: 'defeito_reclamado' | 'defeito_encontrado' | 'outro';
}

interface MovementFormFieldsProps {
  movementData: any;
  onInputChange: (field: string, value: any) => void;
  maintenanceTypes?: MaintenanceType[];
  isDestinationTacom: boolean;
}

const MovementFormFields: React.FC<MovementFormFieldsProps> = ({
  movementData = {}, // Valor padrão
  onInputChange,
  maintenanceTypes = [], // Valor padrão
  isDestinationTacom
}) => {
  // Verificar se os tipos de manutenção têm o campo categoria_defeito
  const hasCategoriasField = maintenanceTypes.length > 0 && 
    maintenanceTypes.some(type => 'categoria_defeito' in type);

  // Filtrar tipos de manutenção por categoria - só se o campo existir
  const defeitosReclamados = hasCategoriasField 
    ? maintenanceTypes.filter(type => type.categoria_defeito === 'defeito_reclamado')
    : [];
  
  const defeitosEncontrados = hasCategoriasField
    ? maintenanceTypes.filter(type => type.categoria_defeito === 'defeito_encontrado')
    : [];
  
  const outrosDefeitos = hasCategoriasField
    ? maintenanceTypes.filter(type => !type.categoria_defeito || type.categoria_defeito === 'outro')
    : maintenanceTypes; // Se não tem campo, todos são "outros"

  // Verificar se deve mostrar campos de defeito (só se a migração foi aplicada)
  const shouldShowDefeitosFields = hasCategoriasField && (
    movementData.tipo_movimento === 'manutencao' || 
    movementData.tipo_movimento === 'movimentacao_interna' || 
    movementData.tipo_movimento === 'envio_manutencao' ||
    movementData.tipo_movimento === 'devolucao' ||
    movementData.tipo_movimento === 'retorno_manutencao'
  );

  // Campo legado sempre aparece quando não há campos novos ou para casos específicos
  const shouldShowLegacyMaintenanceField = !shouldShowDefeitosFields && (
    movementData.tipo_movimento === 'manutencao' ||
    movementData.tipo_movimento === 'movimentacao_interna' || 
    movementData.tipo_movimento === 'envio_manutencao' ||
    movementData.tipo_movimento === 'devolucao' ||
    movementData.tipo_movimento === 'retorno_manutencao'
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tipo_equipamento">
            Tipo de Equipamento {(movementData.equipamentos?.length || 0) > 0 && '*'}
          </Label>
          <Input
            id="tipo_equipamento"
            value={movementData.tipo_equipamento || ''}
            onChange={(e) => onInputChange('tipo_equipamento', e.target.value)}
            placeholder="Ex: Validador, GPS, Câmera"
            required={(movementData.equipamentos?.length || 0) > 0}
          />
        </div>

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

        {/* NOVOS Campos de Defeitos - só aparecem se a migração foi aplicada */}
        {shouldShowDefeitosFields && (
          <div className="md:col-span-2">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <h3 className="font-semibold text-blue-800 mb-2">
                🔧 Campos de Defeitos (Nova Funcionalidade)
              </h3>
              <p className="text-sm text-blue-700">
                Agora você pode distinguir entre o defeito reportado inicialmente e o defeito realmente encontrado.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Defeito Reclamado */}
              <div>
                <Label htmlFor="defeito_reclamado">
                  Defeito Reclamado (DR) *
                </Label>
                <Select
                  value={movementData.defeito_reclamado_id || ''}
                  onValueChange={(value) => onInputChange('defeito_reclamado_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o defeito reclamado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum defeito reclamado</SelectItem>
                    {defeitosReclamados.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.descricao} ({type.codigo})
                      </SelectItem>
                    ))}
                    {defeitosReclamados.length === 0 && outrosDefeitos.length > 0 && (
                      <>
                        <SelectItem value="" disabled className="font-semibold">
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
                <p className="text-xs text-gray-600 mt-1">
                  Defeito reportado inicialmente pelo cliente
                </p>
              </div>

              {/* Defeito Encontrado */}
              <div>
                <Label htmlFor="defeito_encontrado">
                  Defeito Encontrado (ER)
                </Label>
                <Select
                  value={movementData.defeito_encontrado_id || ''}
                  onValueChange={(value) => onInputChange('defeito_encontrado_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o defeito encontrado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum defeito encontrado</SelectItem>
                    {defeitosEncontrados.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.descricao} ({type.codigo})
                      </SelectItem>
                    ))}
                    {defeitosEncontrados.length === 0 && outrosDefeitos.length > 0 && (
                      <>
                        <SelectItem value="" disabled className="font-semibold">
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
                <p className="text-xs text-gray-600 mt-1">
                  Defeito realmente identificado durante a manutenção
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Campo LEGADO para compatibilidade */}
        {shouldShowLegacyMaintenanceField && (
          <div className="md:col-span-2">
            <Label htmlFor="tipo_manutencao_id">
              Tipo de Manutenção {shouldShowLegacyMaintenanceField && '*'}
              {!hasCategoriasField && (
                <span className="text-blue-600 text-sm font-normal ml-2">
                  (Para usar os novos campos de defeitos, execute a migração SQL)
                </span>
              )}
            </Label>
            <Select
              value={movementData.tipo_manutencao_id || ''}
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
            
            {!hasCategoriasField && (
              <p className="text-xs text-orange-600 mt-1">
                💡 Dica: Execute a migração SQL para ter campos separados de "Defeito Reclamado" e "Defeito Encontrado"
              </p>
            )}
          </div>
        )}

        {/* Campo de status sempre aparece quando destino é TACOM, movimentação interna, envio manutenção, devolução OU manutenção */}
        {(isDestinationTacom || 
          movementData.tipo_movimento === 'movimentacao_interna' || 
          movementData.tipo_movimento === 'envio_manutencao' ||
          movementData.tipo_movimento === 'devolucao' ||
          movementData.tipo_movimento === 'manutencao') && (
          <div className="md:col-span-2">
            <MovementStatusSelector
              isRequired={true}
              value={movementData.status_equipamento || ''}
              onChange={(value) => onInputChange('status_equipamento', value)}
              label="Status do Equipamento"
              isDestinationTacom={isDestinationTacom || movementData.tipo_movimento === 'devolucao' || movementData.tipo_movimento === 'manutencao'}
            />
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={movementData.observacoes || ''}
          onChange={(e) => onInputChange('observacoes', e.target.value)}
          placeholder="Digite observações sobre a movimentação..."
          rows={3}
        />
      </div>

      {/* Banner informativo sobre as melhorias */}
      {!hasCategoriasField && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="text-blue-500 text-xl">🚀</div>
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">
                Nova Funcionalidade Disponível!
              </h3>
              <p className="text-sm text-blue-700 mb-2">
                Agora você pode distinguir entre <strong>Defeito Reclamado (DR)</strong> e <strong>Defeito Encontrado (ER)</strong> 
                para um controle mais preciso das manutenções.
              </p>
              <p className="text-xs text-blue-600">
                Para ativar essa funcionalidade, execute a migração SQL fornecida e atualize os tipos do Supabase.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MovementFormFields;