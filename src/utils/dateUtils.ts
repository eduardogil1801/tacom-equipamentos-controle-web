
/**
 * Obtém a data atual no formato YYYY-MM-DD (formato usado pelos inputs date)
 * Sempre retorna a data local atual, evitando problemas de fuso horário
 */
export const getCurrentLocalDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Obtém o mês atual no formato YYYY-MM (usado em inputs month)
 */
export const getCurrentLocalMonth = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Converte uma data no formato YYYY-MM-DD para o formato brasileiro DD/MM/YYYY
 */
export const formatDateToBR = (dateString: string): string => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Converte uma data no formato brasileiro DD/MM/YYYY para YYYY-MM-DD
 */
export const formatDateFromBR = (dateString: string): string => {
  if (!dateString) return '';
  const [day, month, year] = dateString.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};
