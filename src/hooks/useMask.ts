
import { useState, useCallback } from 'react';

export const useMask = () => {
  const formatCNPJ = useCallback((value: string) => {
    // Remove tudo que não é dígito
    const cleanValue = value.replace(/\D/g, '');
    
    // Aplica a máscara 00.000.000/0000-00
    if (cleanValue.length <= 2) {
      return cleanValue;
    } else if (cleanValue.length <= 5) {
      return cleanValue.replace(/(\d{2})(\d{0,3})/, '$1.$2');
    } else if (cleanValue.length <= 8) {
      return cleanValue.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (cleanValue.length <= 12) {
      return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
    } else {
      return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
    }
  }, []);

  const formatPhone = useCallback((value: string) => {
    // Remove tudo que não é dígito
    const cleanValue = value.replace(/\D/g, '');
    
    // Aplica a máscara (00) 0000-0000 ou (00) 00000-0000
    if (cleanValue.length <= 2) {
      return cleanValue;
    } else if (cleanValue.length <= 6) {
      return cleanValue.replace(/(\d{2})(\d{0,4})/, '($1) $2');
    } else if (cleanValue.length <= 10) {
      return cleanValue.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      return cleanValue.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
  }, []);

  const removeMask = useCallback((value: string) => {
    return value.replace(/\D/g, '');
  }, []);

  return {
    formatCNPJ,
    formatPhone,
    removeMask
  };
};
