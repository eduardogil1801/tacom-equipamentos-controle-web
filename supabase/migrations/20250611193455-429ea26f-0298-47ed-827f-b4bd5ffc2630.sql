
-- Criar tabela para regras de manutenção
CREATE TABLE public.maintenance_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_manutencao_id UUID NOT NULL REFERENCES public.tipos_manutencao(id) ON DELETE CASCADE,
  status_resultante TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tipo_manutencao_id, status_resultante)
);

-- Habilitar RLS na tabela
ALTER TABLE public.maintenance_rules ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir que todos os usuários autenticados vejam as regras
CREATE POLICY "Authenticated users can view maintenance rules" 
  ON public.maintenance_rules 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Criar política para permitir que todos os usuários autenticados criem regras
CREATE POLICY "Authenticated users can create maintenance rules" 
  ON public.maintenance_rules 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Criar política para permitir que todos os usuários autenticados atualizem regras
CREATE POLICY "Authenticated users can update maintenance rules" 
  ON public.maintenance_rules 
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- Criar política para permitir que todos os usuários autenticados excluam regras
CREATE POLICY "Authenticated users can delete maintenance rules" 
  ON public.maintenance_rules 
  FOR DELETE 
  TO authenticated 
  USING (true);
