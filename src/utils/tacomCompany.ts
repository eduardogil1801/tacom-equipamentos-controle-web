/**
 * Detecta se uma empresa é "interna TACOM" pelo nome.
 * Regra: nome começa com "TACOM" (case-insensitive).
 * TC-SAPI e demais empresas clientes NÃO são consideradas TACOM.
 */
export const isTacomCompanyName = (name?: string | null): boolean => {
  if (!name) return false;
  return name.trim().toUpperCase().startsWith('TACOM');
};
