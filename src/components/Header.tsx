import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Moon,
  Sun,
} from 'lucide-react';
import { formatarMesAnoLabel } from '../services/transacoesService';
import { OrbeLogo } from './OrbeLogo';

interface HeaderProps {
  ano: number;
  mes: number;
  onMesAnterior: () => void;
  onProximoMes: () => void;
  onSelecionarMesAno: (ano: number, mes: number) => void;
  onIrParaMesAtual: () => void;
  modoPrivacidade: boolean;
  onAlternarPrivacidade: () => void;
  temaEscuro: boolean;
  onAlternarTema: () => void;
}

const MESES_ABREVIADOS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export const Header: React.FC<HeaderProps> = ({
  ano,
  mes,
  onMesAnterior,
  onProximoMes,
  onSelecionarMesAno,
  onIrParaMesAtual,
  modoPrivacidade,
  onAlternarPrivacidade,
  temaEscuro,
  onAlternarTema,
}) => {
  const [popoverAberto, setPopoverAberto] = useState(false);
  const [anoPopover, setAnoPopover] = useState(ano);
  const popoverContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (popoverAberto) {
      setAnoPopover(ano);
    }
  }, [popoverAberto, ano]);

  useEffect(() => {
    if (!popoverAberto) return;

    const handleClickFora = (e: MouseEvent) => {
      if (
        popoverContainerRef.current &&
        !popoverContainerRef.current.contains(e.target as Node)
      ) {
        setPopoverAberto(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPopoverAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickFora);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickFora);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [popoverAberto]);

  const mesAnoCompleto = formatarMesAnoLabel(ano, mes);
  const mesAnoCurto = `${MESES_ABREVIADOS[mes]}/${String(ano).slice(-2)}`;

  const hoje = new Date();
  const anoAtualSistema = hoje.getFullYear();
  const mesAtualSistema = hoje.getMonth();
  const jaEstaNoMesAtual = ano === anoAtualSistema && mes === mesAtualSistema;

  return (
    <header className="sticky top-0 z-30 h-14 sm:h-16 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md">
      <div className="h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
        {/* Esquerda: Logo Orbe + Seletor de Mês/Ano com Popover */}
        <div className="flex items-center gap-2.5 sm:gap-5 min-w-0">
          <OrbeLogo />

          <div ref={popoverContainerRef} className="relative shrink-0">
            <div
              className="flex items-center gap-0.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/80 p-0.5"
              role="group"
              aria-label="Seletor de mês e ano"
            >
              <button
                type="button"
                onClick={onMesAnterior}
                aria-label="Mês anterior"
                className="min-h-[34px] min-w-[32px] sm:min-w-[34px] flex items-center justify-center rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setPopoverAberto((prev) => !prev)}
                aria-expanded={popoverAberto}
                aria-haspopup="dialog"
                aria-label={`Selecionar mês e ano (${mesAnoCompleto})`}
                className="min-h-[34px] px-2 sm:px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-800 transition-colors whitespace-nowrap tabular-nums cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span className="sm:hidden">{mesAnoCurto}</span>
                <span className="hidden sm:inline">{mesAnoCompleto}</span>
              </button>

              <button
                type="button"
                onClick={onProximoMes}
                aria-label="Próximo mês"
                className="min-h-[34px] min-w-[32px] sm:min-w-[34px] flex items-center justify-center rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Popover rápido de calendário (Ano + grade 4x3 de meses + Mês Atual) */}
            {popoverAberto && (
              <div
                role="dialog"
                aria-label="Seletor rápido de mês e ano"
                className="absolute left-0 top-full mt-2 z-50 w-[264px] sm:w-[280px] rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl p-3.5 space-y-3"
              >
                {/* Seletor de Ano */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setAnoPopover((prev) => prev - 1)}
                    aria-label="Ano anterior"
                    className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">
                    {anoPopover}
                  </span>

                  <button
                    type="button"
                    onClick={() => setAnoPopover((prev) => prev + 1)}
                    aria-label="Próximo ano"
                    className="min-h-[34px] min-w-[34px] flex items-center justify-center rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Grade 4x3 com os 12 meses */}
                <div className="grid grid-cols-4 gap-1.5">
                  {MESES_ABREVIADOS.map((sigla, idx) => {
                    const selecionado = ano === anoPopover && mes === idx;
                    const ehMesAtual =
                      anoActualMatch(anoAtualSistema, mesAtualSistema, anoPopover, idx);

                    return (
                      <button
                        key={sigla}
                        type="button"
                        onClick={() => {
                          onSelecionarMesAno(anoPopover, idx);
                          setPopoverAberto(false);
                        }}
                        className={`h-9 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                          selecionado
                            ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                            : ehMesAtual
                            ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/30 dark:bg-teal-950/40 dark:text-teal-300 dark:ring-teal-500/40 hover:bg-teal-100 dark:hover:bg-teal-950/70'
                            : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        {sigla}
                      </button>
                    );
                  })}
                </div>

                {/* Botão rápido Mês Atual */}
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    disabled={jaEstaNoMesAtual}
                    onClick={() => {
                      onIrParaMesAtual();
                      setPopoverAberto(false);
                    }}
                    className="w-full h-9 rounded-xl text-xs font-medium transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-default bg-slate-100 hover:bg-slate-200/80 text-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200"
                  >
                    Mês Atual ({MESES_ABREVIADOS[mesAtualSistema]} {anoAtualSistema})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Direita: Privacidade e Tema */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onAlternarPrivacidade}
            aria-label={modoPrivacidade ? 'Mostrar valores' : 'Ocultar valores (Modo Privacidade)'}
            title={modoPrivacidade ? 'Mostrar valores' : 'Ocultar valores'}
            className={`min-h-[40px] min-w-[40px] sm:min-h-[38px] sm:min-w-[38px] flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
              modoPrivacidade
                ? 'border-teal-600/40 bg-teal-50 text-teal-700 dark:border-teal-500/40 dark:bg-teal-950/50 dark:text-teal-300'
                : 'border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-100'
            }`}
          >
            {modoPrivacidade ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onAlternarTema}
            aria-label={temaEscuro ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={temaEscuro ? 'Modo Claro' : 'Modo Escuro'}
            className="min-h-[40px] min-w-[40px] sm:min-h-[38px] sm:min-w-[38px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
          >
            {temaEscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};

function anoActualMatch(
  anoSistema: number,
  mesSistema: number,
  anoAlvo: number,
  mesAlvo: number
): boolean {
  return anoSistema === anoAlvo && mesSistema === mesAlvo;
}
