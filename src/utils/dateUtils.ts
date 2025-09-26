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

/**
 * Formata data para exibição evitando problemas de timezone
 * CORREÇÃO: Cria data local sem conversão de timezone
 */
export const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '-';
  
  // Criar data no formato local (sem conversão de timezone)
  const [year, month, day] = dateString.split('-');
  const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  return localDate.toLocaleDateString('pt-BR');
};

// Função para converter data MM/YYYY para YYYY-MM
export const convertToInputFormat = (mesReferencia: string): string => {
  if (!mesReferencia) return '';
  
  // Se já está no formato YYYY-MM, retornar como está
  if (mesReferencia.includes('-') && mesReferencia.length === 7) {
    return mesReferencia;
  }
  
  // Se está no formato MM/YYYY, converter para YYYY-MM
  if (mesReferencia.includes('/')) {
    const [month, year] = mesReferencia.split('/');
    return `${year}-${month.padStart(2, '0')}`;
  }
  
  return mesReferencia;
};

// Função para converter YYYY-MM para MM/YYYY (para exibição)
export const convertToDisplayFormat = (mesReferencia: string): string => {
  if (!mesReferencia) return '';
  
  // Se está no formato YYYY-MM, converter para MM/YYYY
  if (mesReferencia.includes('-')) {
    const [year, month] = mesReferencia.split('-');
    return `${month}/${year}`;
  }
  
  // Se já está no formato MM/YYYY, retornar como está
  return mesReferencia;
};

// Função para converter para formato de banco de dados (YYYY-MM-01)
export const convertToDatabaseFormat = (mesReferencia: string): string => {
  if (!mesReferencia) return '';
  
  // Se já está no formato YYYY-MM-DD, retornar como está
  if (mesReferencia.includes('-') && mesReferencia.length === 10) {
    return mesReferencia;
  }
  
  // Se está no formato YYYY-MM, adicionar -01
  if (mesReferencia.includes('-') && mesReferencia.length === 7) {
    return mesReferencia + '-01';
  }
  
  // Se está no formato MM/YYYY, converter para YYYY-MM-01
  if (mesReferencia.includes('/')) {
    const [month, year] = mesReferencia.split('/');
    return `${year}-${month.padStart(2, '0')}-01`;
  }
  
  return mesReferencia;
};

// Função para formatar data para exibição em relatórios (MM/YYYY)
export const formatMesReferenciaDisplay = (mesReferencia: string): string => {
  if (!mesReferencia) return '';
  
  const date = new Date(mesReferencia + (mesReferencia.length === 7 ? '-01' : ''));
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${month}/${year}`;
};

// Função para obter o primeiro dia do mês anterior
export const getPreviousMonth = (): string => {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  return `${year}-${month}`;
};