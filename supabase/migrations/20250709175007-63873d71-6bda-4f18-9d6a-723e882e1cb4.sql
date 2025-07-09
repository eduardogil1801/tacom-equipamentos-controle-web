-- Corrigir registros existentes para o usuário correto
UPDATE movimentacoes 
SET usuario_responsavel = 'Mauro Hubie'
WHERE usuario_responsavel = 'Eduardo Gil' OR usuario_responsavel = 'Sistema';