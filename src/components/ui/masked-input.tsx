
import React, { forwardRef, useCallback } from 'react';
import { Input } from './input';
import { useMask } from '@/hooks/useMask';

interface MaskedInputProps extends React.ComponentProps<typeof Input> {
  mask: 'cnpj' | 'phone';
  onValueChange?: (value: string) => void;
}

const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, onValueChange, onChange, onFocus, value, ...props }, ref) => {
    const { formatCNPJ, formatPhone, removeMask } = useMask();

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      let formattedValue = '';

      switch (mask) {
        case 'cnpj':
          formattedValue = formatCNPJ(inputValue);
          break;
        case 'phone':
          formattedValue = formatPhone(inputValue);
          break;
        default:
          formattedValue = inputValue;
      }

      // Atualiza o valor formatado no input
      e.target.value = formattedValue;

      // Chama o onChange original se existir
      if (onChange) {
        onChange(e);
      }

      // Chama o onValueChange com o valor sem máscara se existir
      if (onValueChange) {
        onValueChange(removeMask(inputValue));
      }
    }, [mask, formatCNPJ, formatPhone, removeMask, onChange, onValueChange]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      // Auto-selecionar conteúdo
      e.target.select();
      
      // Chamar onFocus original se existir
      if (onFocus) {
        onFocus(e);
      }
    }, [onFocus]);

    return (
      <Input
        {...props}
        ref={ref}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
      />
    );
  }
);

MaskedInput.displayName = 'MaskedInput';

export { MaskedInput };
