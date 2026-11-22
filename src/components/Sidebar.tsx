import React from 'react';
import {
  ArrowLeftRight,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart,
  Upload,
} from 'lucide-react';
import type { AbaNavegacao } from '../types/finance';

interface SidebarProps {
  abaAtiva: AbaNavegacao;
  onSelecionarAba: (aba: AbaNavegacao) => void;
  retraida: boolean;
  onAlternarRetracao: () => void;
}

interface ItemNav {
  id: AbaNavegacao;
  rotulo: string;
  rotuloCurto: string;
  icone: React.ComponentType<{ className?: string }>;
}

const ITENS_NAVEGACAO: ItemNav[] = [
  { id: 'visao-geral', rotulo: 'Visão Geral', rotuloCurto: 'Início', icone: LayoutDashboard },
  { id: 'lancamentos', rotulo: 'Lançamentos', rotuloCurto: 'Extrato', icone: ArrowLeftRight },
  { id: 'categorias', rotulo: 'Categorias & Metas', rotuloCurto: 'Metas', icone: PieChart },
  { id: 'importar-ofx', rotulo: 'Importar OFX', rotuloCurto: 'Importar', icone: Upload },
];

export const Sidebar: React.FC<SidebarProps> = ({
  abaAtiva,
  onSelecionarAba,
  retraida,
  onAlternarRetracao,
}) => {
  return (
    <>
      {/* Menu lateral retrátil no computador (md+) */}
      <aside
        aria-label="Navegação principal"
        className={`hidden md:flex flex-col justify-between shrink-0 border-r border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 transition-[width] duration-200 ease-out sticky top-16 h-[calc(100vh-4rem)] ${
          retraida ? 'w-[76px]' : 'w-60'
        }`}
      >
        <nav className="p-3 space-y-1">
          {ITENS_NAVEGACAO.map((item) => {
            const Icone = item.icone;
            const ativo = abaAtiva === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelecionarAba(item.id)}
                title={retraida ? item.rotulo : undefined}
                aria-current={ativo ? 'page' : undefined}
                className={`w-full min-h-[42px] flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  retraida ? 'justify-center px-0' : ''
                } ${
                  ativo
                    ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                <Icone className="w-[18px] h-[18px] shrink-0" />
                {!retraida && <span className="truncate">{item.rotulo}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200/80 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={onAlternarRetracao}
            aria-label={retraida ? 'Expandir menu lateral' : 'Retrair menu lateral'}
            className={`w-full min-h-[40px] flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer ${
              retraida ? 'justify-center px-0' : ''
            }`}
          >
            {retraida ? (
              <PanelLeftOpen className="w-4 h-4 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Recolher menu</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Barra de navegação inferior no celular (< md) */}
      <nav
        aria-label="Navegação inferior"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-slate-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md"
      >
        <div className="grid grid-cols-4 h-full">
          {ITENS_NAVEGACAO.map((item) => {
            const Icone = item.icone;
            const ativo = abaAtiva === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelecionarAba(item.id)}
                aria-current={ativo ? 'page' : undefined}
                className={`min-h-[44px] flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                  ativo
                    ? 'text-teal-700 dark:text-teal-400'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                <Icone className="w-5 h-5" />
                <span className="text-[11px] font-medium leading-none tracking-tight whitespace-nowrap">
                  {item.rotuloCurto}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
