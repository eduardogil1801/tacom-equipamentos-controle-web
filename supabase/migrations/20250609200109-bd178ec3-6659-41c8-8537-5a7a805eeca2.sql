
-- Adicionar coluna telemetria na tabela frota
ALTER TABLE public.frota 
ADD COLUMN telemetria integer DEFAULT 0;
