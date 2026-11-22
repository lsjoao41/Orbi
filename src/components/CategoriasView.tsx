import React, { useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import {
  LISTA_CATEGORIAS,
  formatarMesAnoLabel,
} from '../services/transacoesService';
import type {
  CategoriaId,
  OrcamentoCategoria,
  Transacao,
} from '../types/finance';
import { ValorBRL } from './ValorBRL';

interface CategoriasViewProps {
  ano: number;
  mes: number;
  transacoesMes: Transacao[];
  orcamentos: OrcamentoCategoria[];
  modoPrivacidade: boolean;
  onSalvarOrcamento: (categoria: CategoriaId, limite: number) => Promise<void>;
}

export const CategoriasView: React.FC<CategoriasViewProps> = ({
  ano,
  mes,
  transacoesMes,
  orcamentos,
  modoPrivacidade,
  onSalvarOrcamento,
}) => {
  const [editandoId, setEditandoId] = useState<CategoriaId | null>(null);
  const [valorInput, setValorInput] = useState('');

  const mesLabel = formatarMesAnoLabel(ano, mes);
  const categoriasDespesa = LISTA_CATEGORIAS.filter(
    (c) => c.tipoPadrao === 'despesa'
  );

  const gastosPorCategoria = new Map<CategoriaId, number>();
  for (const t of transacoesMes) {
    if (t.tipo === 'despesa') {
      gastosPorCategoria.set(
        t.categoria,
        (gastosPorCategoria.get(t.categoria) ?? 0) + t.valor
      );
    }
  }

  const orcamentoMap = new Map(orcamentos.map((o) => [o.categoria, o.limite]));

  const iniciarEdicao = (catId: CategoriaId, limiteAtual: number) => {
    setEditandoId(catId);
    setValorInput(limiteAtual > 0 ? String(limiteAtual) : '');
  };

  const confirmarEdicao = async (catId: CategoriaId) => {
    const parsed = Number.parseFloat(valorInput.replace(',', '.'));
    const novoLimite = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    await onSalvarOrcamento(catId, novoLimite);
    setEditandoId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
          Categorias e Metas
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
          Acompanhe limites mensais de gastos em {mesLabel}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categoriasDespesa.map((cat) => {
          const gasto = gastosPorCategoria.get(cat.id) ?? 0;
          const limite = orcamentoMap.get(cat.id) ?? 0;
          const percentual =
            limite > 0 ? Math.min(100, Math.round((gasto / limite) * 100)) : 0;
          const excedeu = limite > 0 && gasto > limite;
          const editando = editandoId === cat.id;

          return (
            <div
              key={cat.id}
              className="rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                    {cat.nome}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    {limite > 0 ? (
                      excedeu ? (
                        <span className="text-rose-600 dark:text-rose-400 font-medium">
                          Acima do limite planejado
                        </span>
                      ) : (
                        <span>Dentro do orçamento ({percentual}% utilizado)</span>
                      )
                    ) : (
                      <span>Sem meta definida</span>
                    )}
                  </p>
                </div>

                {editando ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={valorInput}
                      onChange={(e) => setValorInput(e.target.value)}
                      placeholder="R$ 0"
                      aria-label={`Meta mensal para ${cat.nome}`}
                      className="w-24 h-8 px-2.5 rounded-lg border border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs text-slate-900 dark:text-zinc-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                    />
                    <button
                      type="button"
                      onClick={() => confirmarEdicao(cat.id)}
                      aria-label="Salvar meta"
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-950 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => iniciarEdicao(cat.id, limite)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {limite > 0 ? 'Editar meta' : 'Definir meta'}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between text-sm">
                  <ValorBRL
                    valor={gasto}
                    modoPrivacidade={modoPrivacidade}
                    className="font-semibold text-slate-900 dark:text-zinc-100"
                  />
                  {limite > 0 && (
                    <span className="text-xs text-slate-500 dark:text-zinc-400">
                      de{' '}
                      <ValorBRL
                        valor={limite}
                        modoPrivacidade={modoPrivacidade}
                      />
                    </span>
                  )}
                </div>

                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width] duration-200 ${
                      excedeu
                        ? 'bg-rose-600 dark:bg-rose-500'
                        : cat.corBarra
                    }`}
                    style={{ width: `${limite > 0 ? Math.max(gasto > 0 ? 4 : 0, percentual) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
