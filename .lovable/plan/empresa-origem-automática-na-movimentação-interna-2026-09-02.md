# Empresa Origem automática na Movimentação Interna

## Objetivo
Na Movimentação Interna, manter a Empresa Origem sempre automática, vinda da empresa atual do equipamento selecionado, enquanto a Empresa Destino continua podendo alternar entre TACOM SISTEMAS POA e TACOM PROJETOS SC.

## O que muda
- A Empresa Origem deixa de ser sobrescrita pela empresa escolhida no destino; ela volta a exibir apenas a empresa do(s) equipamento(s) selecionado(s), em campo somente leitura.
- O que é gravado no histórico continua sendo a empresa real do equipamento, então tela e registro passam a mostrar sempre o mesmo valor.
- Empresa Destino segue como lista com as duas empresas internas (POA e SC), com POA como padrão.
- A busca de equipamentos continua filtrando pela empresa interna escolhida no destino.

## Detalhes técnicos
- `src/components/Equipment/MovementFormFields.tsx`: no efeito de `movimentacao_interna`, remover as chamadas `onInputChange('empresa_origem', ...)`; definir apenas o destino padrão quando ainda não houver uma empresa interna selecionada. Ajustar as dependências do efeito para não depender mais de `empresa_origem`.
- Nenhuma mudança em `src/hooks/useMovementForm.tsx`: `updateOriginCompany` já preenche a origem a partir de `equipment.id_empresa`, e a gravação (`empresa_origem_nome`) já usa a empresa do equipamento.
