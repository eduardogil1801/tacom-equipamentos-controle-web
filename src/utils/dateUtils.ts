// Função para obter o mês atual no formato correto para o input type="month"
export const getCurrentLocalMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); // +1 porque getMonth() retorna 0-11
  
  return `${year}-${month}`;
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