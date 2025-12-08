-- Adicionar política de DELETE para tipos_manutencao
CREATE POLICY "Permitir exclusão de tipos de manutenção" 
ON public.tipos_manutencao 
FOR DELETE 
USING (true);