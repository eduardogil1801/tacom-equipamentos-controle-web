/**
 * Utilitários para contornar o limite padrão de 1000 linhas por consulta do Supabase.
 */

export const SUPABASE_PAGE_SIZE = 1000;

/**
 * Executa a consulta em páginas de 1000 linhas até trazer todos os registros.
 * `build` recebe o intervalo e deve devolver a query já com `.range(from, to)`.
 */
export async function fetchAllRows<T = any>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>
): Promise<T[]> {
  const all: T[] = [];

  for (let from = 0; ; from += SUPABASE_PAGE_SIZE) {
    const { data, error } = await build(from, from + SUPABASE_PAGE_SIZE - 1);
    if (error) throw error;
    if (data?.length) all.push(...data);
    if (!data || data.length < SUPABASE_PAGE_SIZE) break;
  }

  return all;
}

/**
 * Estado (UF) efetivo de um equipamento: usa o estado da empresa e,
 * na falta dele, o estado gravado no próprio equipamento.
 */
export const getEquipmentEstado = (equipment: any): string =>
  equipment?.empresas?.estado || equipment?.estado || '';
