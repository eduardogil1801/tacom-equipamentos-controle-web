-- Remover o índice único problemático que impede múltiplas movimentações
DROP INDEX IF EXISTS idx_movimentacoes_no_duplicates;

-- Desabilitar o trigger que está causando conflitos com movimentações manuais
DROP TRIGGER IF EXISTS trigger_registrar_movimentacao_v4 ON equipamentos;
DROP TRIGGER IF EXISTS trigger_registrar_movimentacao_v3 ON equipamentos;
DROP TRIGGER IF EXISTS trigger_registrar_movimentacao_v2 ON equipamentos;
DROP TRIGGER IF EXISTS trigger_registrar_movimentacao ON equipamentos;

-- Criar apenas índices de performance sem constraints únicos
CREATE INDEX IF NOT EXISTS idx_movimentacoes_equipamento_data 
ON movimentacoes (id_equipamento, data_movimento DESC);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_tipo_data 
ON movimentacoes (tipo_movimento, data_movimento DESC);

CREATE INDEX IF NOT EXISTS idx_movimentacoes_usuario_data 
ON movimentacoes (usuario_responsavel, data_movimento DESC);