
-- Adicionar campo usuario_responsavel na tabela movimentacoes (caso não exista)
ALTER TABLE movimentacoes 
ADD COLUMN IF NOT EXISTS usuario_responsavel text;

-- Criar tabela de estados para gerenciar estados permitidos
CREATE TABLE IF NOT EXISTS estados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Inserir estados padrão
INSERT INTO estados (nome) VALUES 
  ('Rio Grande do Sul'),
  ('Santa Catarina')
ON CONFLICT (nome) DO NOTHING;

-- Modificar tabela empresas para usar referência aos estados
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS estado_id uuid REFERENCES estados(id);

-- Atualizar empresas existentes com os estados padrão
UPDATE empresas 
SET estado_id = (SELECT id FROM estados WHERE nome = 'Rio Grande do Sul') 
WHERE estado = 'Rio Grande do Sul' OR estado IS NULL;

UPDATE empresas 
SET estado_id = (SELECT id FROM estados WHERE nome = 'Santa Catarina') 
WHERE estado = 'Santa Catarina';

-- Adicionar campos adicionais na tabela empresas
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS telefone text;

-- Atualizar tabela frota para melhor estrutura
ALTER TABLE frota 
ADD COLUMN IF NOT EXISTS usuario_responsavel text;
