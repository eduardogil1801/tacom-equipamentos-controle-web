-- Fix remaining TACOM equipment where origin = destination
-- Pattern: TACOM equipment moves between TACOM POA and TACOM CTG

-- TACOM CTG devolucao/retorno_manutencao: returning FROM TACOM POA TO TACOM CTG
UPDATE movimentacoes 
SET empresa_origem_nome = 'TACOM SISTEMAS POA'
WHERE empresa_origem_nome = 'TACOM PROJETOS (CTG)' 
AND empresa_destino_nome = 'TACOM PROJETOS (CTG)'
AND tipo_movimento IN ('devolucao', 'retorno_manutencao');

-- TACOM POA devolucao/retorno_manutencao: returning FROM TACOM CTG TO TACOM POA
UPDATE movimentacoes 
SET empresa_origem_nome = 'TACOM PROJETOS (CTG)'
WHERE empresa_origem_nome = 'TACOM SISTEMAS POA' 
AND empresa_destino_nome = 'TACOM SISTEMAS POA'
AND tipo_movimento IN ('devolucao', 'retorno_manutencao');

-- TACOM CTG movimentacao: going FROM TACOM CTG TO TACOM POA
UPDATE movimentacoes 
SET empresa_destino_nome = 'TACOM SISTEMAS POA'
WHERE empresa_origem_nome = 'TACOM PROJETOS (CTG)' 
AND empresa_destino_nome = 'TACOM PROJETOS (CTG)'
AND tipo_movimento = 'movimentacao';

-- TACOM POA movimentacao: going FROM TACOM POA TO TACOM CTG
UPDATE movimentacoes 
SET empresa_destino_nome = 'TACOM PROJETOS (CTG)'
WHERE empresa_origem_nome = 'TACOM SISTEMAS POA' 
AND empresa_destino_nome = 'TACOM SISTEMAS POA'
AND tipo_movimento = 'movimentacao';