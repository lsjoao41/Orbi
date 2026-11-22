import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import {
  CATEGORIAS,
  LISTA_CATEGORIAS,
  formatarDataBR,
  formatarMesAnoLabel,
} from '../services/transacoesService';
import type { CategoriaId, TipoTransacao, Transacao } from '../types/finance';
import { ValorBRL } from './ValorBRL';

interface LancamentosViewProps {
  ano: number;
  mes: number;
  transacoesMes: Transacao[];
  modoPrivacidade: boolean;
  onNovoLancamento: () => void;
  onEditarTransacao: (transacao: Transacao) => void;
  onExcluirTransacao: (id: string) => void;
  onAlternarStatus: (transacao: Transacao) => void;
}

export const LancamentosView: React.FC<LancamentosViewProps> = ({
  ano,
  mes,
  transacoesMes,
  modoPrivacidade,
  onNovoLancamento,
  onEditarTransacao,
  onExcluirTransacao,
  onAlternarStatus,
}) => {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | TipoTransacao>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<'todas' | CategoriaId>('todas');
  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState<string | null>(null);

  const mesLabel = formatarMesAnoLabel(ano, mes);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return transacoesMes.filter((t) => {
      if (filtroTipo !== 'todos' && t.tipo !== filtroTipo) return false;
      if (filtroCategoria !== 'todas' && t.categoria !== filtroCategoria) return false;
      if (termo) {
        const catNome = (CATEGORIAS[t.categoria]?.nome ?? '').toLowerCase();
        const match =
          t.descricao.toLowerCase().includes(termo) ||
          t.conta.toLowerCase().includes(termo) ||
          catNome.includes(termo);
        if (!match) return false;
      }
      return true;
    });
  }, [transacoesMes, busca, filtroTipo, filtroCategoria]);

  const totaisFiltrados = useMemo(() => {
    return filtradas.reduce(
      (acc, t) => {
        if (t.tipo === 'receita') acc.receitas += t.valor;
        else acc.despesas += t.valor;
        return acc;
      },
      { receitas: 0, despesas: 0 }
    );
  }, [filtradas]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho da seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
            Lançamentos
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Extrato completo de {mesLabel}
            <span aria-hidden="true"> · </span>
            <span className="tabular-nums">{filtradas.length}</span>{' '}
            {filtradas.length === 1 ? 'registro' : 'registros'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
          <div className="text-slate-600 dark:text-zinc-400">
            Receitas:{' '}
            <ValorBRL
              valor={totaisFiltrados.receitas}
              modoPrivacidade={modoPrivacidade}
              className="font-semibold text-emerald-700 dark:text-emerald-400"
            />
          </div>
          <span aria-hidden="true" className="text-slate-300 dark:text-zinc-700">
            |
          </span>
          <div className="text-slate-600 dark:text-zinc-400">
            Despesas:{' '}
            <ValorBRL
              valor={totaisFiltrados.despesas}
              modoPrivacidade={modoPrivacidade}
              className="font-semibold text-slate-900 dark:text-zinc-100"
            />
          </div>
        </div>
      </div>

      {/* Barra de Filtros + Botão Novo Lançamento */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por descrição, categoria ou conta..."
            className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Controle segmentado de tipo */}
          <div
            role="group"
            aria-label="Filtrar por tipo"
            className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200/70 dark:border-zinc-800"
          >
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'receita', label: 'Receitas' },
                { id: 'despesa', label: 'Despesas' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFiltroTipo(opt.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  filtroTipo === opt.id
                    ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <select
            aria-label="Filtrar por categoria"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value as 'todas' | CategoriaId)}
            className="h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950 text-xs sm:text-sm text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-600/30 cursor-pointer"
          >
            <option value="todas">Todas as categorias</option>
            {LISTA_CATEGORIAS.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={onNovoLancamento}
            className="h-10 px-4 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-slate-800 dark:hover:bg-white text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Lista / Tabela */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden">
        {filtradas.length === 0 ? (
          <div className="py-14 px-6 text-center">
            <p className="text-sm font-medium text-slate-800 dark:text-zinc-200">
              Nenhum lançamento encontrado para os filtros selecionados.
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Ajuste a busca acima ou adicione uma nova movimentação em {mesLabel}.
            </p>
            <button
              type="button"
              onClick={onNovoLancamento}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-medium hover:bg-slate-800 dark:hover:bg-white transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Lançamento
            </button>
          </div>
        ) : (
          <>
            {/* Tabela Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-zinc-800/80 text-xs font-medium text-slate-500 dark:text-zinc-400">
                    <th className="py-3.5 px-5">Data</th>
                    <th className="py-3.5 px-5">Descrição</th>
                    <th className="py-3.5 px-5">Categoria</th>
                    <th className="py-3.5 px-5">Conta</th>
                    <th className="py-3.5 px-5">Situação</th>
                    <th className="py-3.5 px-5 text-right">Valor</th>
                    <th className="py-3.5 px-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/70 text-sm">
                  {filtradas.map((t) => {
                    const cat = CATEGORIAS[t.categoria] ?? CATEGORIAS.outros;
                    const valorComSinal = t.tipo === 'receita' ? t.valor : -t.valor;
                    const confirmando = confirmandoExclusaoId === t.id;

                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-5 text-slate-500 dark:text-zinc-400 tabular-nums whitespace-nowrap">
                          {formatarDataBR(t.data)}
                        </td>
                        <td className="py-3.5 px-5 font-medium text-slate-900 dark:text-zinc-100 max-w-[260px] truncate">
                          {t.descricao}
                        </td>
                        <td className="py-3.5 px-5 text-slate-600 dark:text-zinc-300 whitespace-nowrap">
                          {cat.nome}
                        </td>
                        <td className="py-3.5 px-5 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                          {t.conta}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onAlternarStatus(t)}
                            className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ${
                              t.status === 'pago'
                                ? 'text-emerald-700 dark:text-emerald-400 hover:underline'
                                : 'text-amber-600 dark:text-amber-400 hover:underline'
                            }`}
                          >
                            {t.status === 'pago' ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Pago
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5" />
                                Pendente
                              </>
                            )}
                          </button>
                        </td>
                        <td
                          className={`py-3.5 px-5 text-right font-medium whitespace-nowrap ${
                            t.tipo === 'receita'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-slate-900 dark:text-zinc-100'
                          }`}
                        >
                          <ValorBRL
                            valor={valorComSinal}
                            modoPrivacidade={modoPrivacidade}
                            comSinal
                          />
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          {confirmando ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  onExcluirTransacao(t.id);
                                  setConfirmandoExclusaoId(null);
                                }}
                                className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                              >
                                Confirmar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmandoExclusaoId(null)}
                                className="text-xs text-slate-500 dark:text-zinc-400 hover:underline cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onEditarTransacao(t)}
                                aria-label={`Editar ${t.descricao}`}
                                className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmandoExclusaoId(t.id)}
                                aria-label={`Excluir ${t.descricao}`}
                                className="p-2 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Lista Mobile */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-800/70">
              {filtradas.map((t) => {
                const cat = CATEGORIAS[t.categoria] ?? CATEGORIAS.outros;
                const valorComSinal = t.tipo === 'receita' ? t.valor : -t.valor;
                const confirmando = confirmandoExclusaoId === t.id;

                return (
                  <div key={t.id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-zinc-100 truncate">
                          {t.descricao}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                          <span>{cat.nome}</span>
                          <span aria-hidden="true"> · </span>
                          <span>{t.conta}</span>
                          <span aria-hidden="true"> · </span>
                          <span className="tabular-nums">{formatarDataBR(t.data)}</span>
                        </p>
                      </div>
                      <div
                        className={`text-sm font-semibold shrink-0 ${
                          t.tipo === 'receita'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-slate-900 dark:text-zinc-100'
                        }`}
                      >
                        <ValorBRL
                          valor={valorComSinal}
                          modoPrivacidade={modoPrivacidade}
                          comSinal
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => onAlternarStatus(t)}
                        className={`min-h-[36px] inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                          t.status === 'pago'
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {t.status === 'pago' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Pago
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" />
                            Pendente
                          </>
                        )}
                      </button>

                      {confirmando ? (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              onExcluirTransacao(t.id);
                              setConfirmandoExclusaoId(null);
                            }}
                            className="min-h-[36px] px-2 text-xs font-medium text-rose-600 dark:text-rose-400 cursor-pointer"
                          >
                            Confirmar exclusão
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmandoExclusaoId(null)}
                            className="min-h-[36px] px-2 text-xs text-slate-500 dark:text-zinc-400 cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditarTransacao(t)}
                            aria-label={`Editar ${t.descricao}`}
                            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmandoExclusaoId(t.id)}
                            aria-label={`Excluir ${t.descricao}`}
                            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
