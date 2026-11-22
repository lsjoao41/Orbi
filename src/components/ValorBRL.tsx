import React from 'react';
import { formatarMoedaBRL } from '../services/transacoesService';

interface ValorBRLProps {
  valor: number;
  modoPrivacidade: boolean;
  comSinal?: boolean;
  className?: string;
}

export const ValorBRL: React.FC<ValorBRLProps> = ({
  valor,
  modoPrivacidade,
  comSinal = false,
  className = '',
}) => {
  const texto = formatarMoedaBRL(valor, comSinal);

  return (
    <span
      className={`tabular-nums transition-[filter] duration-150 ${
        modoPrivacidade ? 'blur-[7px] select-none pointer-events-none' : ''
      } ${className}`}
      aria-label={modoPrivacidade ? 'Valor oculto pelo modo privacidade' : texto}
    >
      {texto}
    </span>
  );
};
