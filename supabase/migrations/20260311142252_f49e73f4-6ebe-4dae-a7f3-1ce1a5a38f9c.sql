-- Desabilitar os 3 triggers que criam movimentações duplicadas
-- A aplicação já gerencia a criação de movimentações manualmente via useMovementForm
DROP TRIGGER IF EXISTS registrar_movimentacao_trigger ON equipamentos;
DROP TRIGGER IF EXISTS trigger_movimentacao ON equipamentos;
DROP TRIGGER IF EXISTS trigger_registrar_movimentacao_v5 ON equipamentos;