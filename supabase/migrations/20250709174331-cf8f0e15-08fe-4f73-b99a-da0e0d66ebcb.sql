-- Remover o trigger antigo e criar o novo com a função atualizada
DROP TRIGGER IF EXISTS trigger_registrar_movimentacao ON equipamentos;

-- Criar o novo trigger com a função v3
CREATE TRIGGER trigger_registrar_movimentacao_v3
  AFTER INSERT OR UPDATE ON equipamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.registrar_movimentacao_v3();