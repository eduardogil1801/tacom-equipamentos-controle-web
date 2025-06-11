
-- Habilitar RLS na tabela frota se ainda não estiver habilitado
ALTER TABLE public.frota ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir inserção de dados na tabela frota
CREATE POLICY "Allow insert on frota" ON public.frota
FOR INSERT 
WITH CHECK (true);

-- Criar política para permitir leitura de dados na tabela frota
CREATE POLICY "Allow select on frota" ON public.frota
FOR SELECT 
USING (true);

-- Criar política para permitir atualização de dados na tabela frota
CREATE POLICY "Allow update on frota" ON public.frota
FOR UPDATE 
USING (true);

-- Criar política para permitir exclusão de dados na tabela frota
CREATE POLICY "Allow delete on frota" ON public.frota
FOR DELETE 
USING (true);
