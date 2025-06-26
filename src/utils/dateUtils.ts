
/**
 * Obtém a data atual no formato YYYY-MM-DD (formato usado pelos inputs date)
 * CORREÇÃO: Sempre retorna a data local atual, evitando problemas de fuso horário
 */
export const getCurrentLocalDate = (): string => {
  const today = new Date();
  // CORREÇÃO: Usar getDate(), getMonth() e getFullYear() para garantir hora local
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const result = `${year}-${month}-${day}`;
  
  console.log('Data atual calculada (local):', result);
  console.log('Data objeto original:', today);
  console.log('Timezone offset:', today.getTimezoneOffset());
  
  return result;
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

/**
 * Obtém a data atual no formato DD/MM/YYYY (formato brasileiro)
 */
export const getCurrentLocalDateBR = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
};

/**
 * CORREÇÃO: Função para converter data de input date para data do banco
 * Evita problemas de fuso horário
 */
export const formatDateForDatabase = (dateString: string): string => {
  if (!dateString) return '';
  
  // Se já está no formato YYYY-MM-DD, retorna como está
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString;
  }
  
  // Se está no formato DD/MM/YYYY, converte
  if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    return formatDateFromBR(dateString);
  }
  
  return dateString;
};
