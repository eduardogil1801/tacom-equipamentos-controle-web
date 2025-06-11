
-- Criar tabela para tipos de equipamento
CREATE TABLE public.tipos_equipamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar alguns tipos padrão
INSERT INTO public.tipos_equipamento (nome) VALUES 
('Validador'),
('GPS'),
('Câmera'),
('Telemetria'),
('CONNECTION 5.0');
