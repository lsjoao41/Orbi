import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Plus,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  CATEGORIAS,
  formatarDataBR,
  formatarMesAnoLabel,
} from '../services/transacoesService';
import type {
  AbaNavegacao,
  CategoriaResumo,
  PontoHistorico,
  ResumoMensal,
  Transacao,
} from '../types/finance';
import { ValorBRL } from './ValorBRL';

interface VisaoGeralViewProps {
  ano: number;
  mes: number;
  resumo: ResumoMensal;
  transacoesMes: Transacao[];
  categoriasResumo: CategoriaResumo[];
  historico: PontoHistorico[];
  modoPrivacidade: boolean;
  onNovoLancamento: () => void;
  onIrParaAba: (aba: AbaNavegacao) => void;
  onEditarTransacao: (transacao: Transacao) => void;
}

export const VisaoGeralView: React.FC<VisaoGeralViewProps> = ({
  ano,
  mes,
  resumo,
  transacoesMes,
  categoriasResumo,
  historico,
  modoPrivacidade,
  onNovoLancamento,
  onIrParaAba,
  onEditarTransacao,
}) => {
  const [mesFocado, setMesFocado] = useState<PontoHistorico | null>(null);
  const mesLabel = formatarMesAnoLabel(ano, mes);

  const maxValorGrafico = Math.max(
    1,
    ...historico.flatMap((p) => [p.receitas, p.despesas])
  );

  const recentes = transacoesMes.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Título contextual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
            Visão Geral
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Resumo financeiro de {mesLabel}
            {resumo.totalPendentes > 0 && (
              <>
                <span aria-hidden="true"> · </span>
                <span>
                  {resumo.totalPendentes}{' '}
                  {resumo.totalPendentes === 1 ? 'lançamento pendente' : 'lançamentos pendentes'}
                </span>
              </>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onNovoLancamento}
          className="self-start sm:self-auto min-h-[38px] px-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Linha de KPIs (4 colunas) */}
      <section aria-label="Indicadores do mês" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Saldo do Mês */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Saldo do Mês
            </span>
            <Wallet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
              <ValorBRL valor={resumo.saldo} modoPrivacidade={modoPrivacidade} />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 tabular-nums">
              {resumo.totalTransacoes}{' '}
              {resumo.totalTransacoes === 1 ? 'movimentação' : 'movimentações'}
            </p>
          </div>
        </div>

        {/* Receitas */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Receitas
            </span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-semibold tracking-tight text-emerald-700 dark:text-emerald-400">
              <ValorBRL valor={resumo.receitas} modoPrivacidade={modoPrivacidade} />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Entradas confirmadas e previstas
            </p>
          </div>
        </div>

        {/* Despesas */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Despesas
            </span>
            <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
              <ValorBRL valor={resumo.despesas} modoPrivacidade={modoPrivacidade} />
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Saídas acumuladas no período
            </p>
          </div>
        </div>

        {/* Taxa de Economia */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Taxa de Economia
            </span>
            <TrendingUp className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">
              {resumo.taxaEconomia}%
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              {resumo.receitas > 0
                ? 'Percentual retido sobre receitas'
                : 'Registre receitas para calcular'}
            </p>
          </div>
        </div>
      </section>

      {/* Grid Principal: Fluxo de 6 meses + Despesas por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Fluxo Semestral + Últimos Lançamentos */}
        <div className="lg:col-span-7 space-y-6">
          {/* Gráfico minimalista de fluxo de caixa */}
          <section className="rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                  Fluxo de Caixa
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  Comparativo dos últimos 6 meses
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-teal-600 dark:bg-teal-400 inline-block" />
                  Receitas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-zinc-600 inline-block" />
                  Despesas
                </span>
              </div>
            </div>

            {/* Detalhe interativo do mês em foco */}
            <div className="min-h-[28px] mb-3 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400 border-b border-slate-100 dark:border-zinc-800/80 pb-2">
              {mesFocado ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="font-medium text-slate-900 dark:text-zinc-100">
                    {mesFocado.rotulo} ({mesFocado.chaveMes})
                  </span>
                  <span>
                    Receitas:{' '}
                    <ValorBRL
                      valor={mesFocado.receitas}
                      modoPrivacidade={modoPrivacidade}
                      className="font-medium text-emerald-700 dark:text-emerald-400"
                    />
                  </span>
                  <span>
                    Despesas:{' '}
                    <ValorBRL
                      valor={mesFocado.despesas}
                      modoPrivacidade={modoPrivacidade}
                      className="font-medium text-slate-900 dark:text-zinc-100"
                    />
                  </span>
                </div>
              ) : (
                <span>Passe o cursor ou toque em um mês para ver os valores exatos</span>
              )}
            </div>

            {/* Barras SVG/Flex responsivas */}
            <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-4">
              {historico.map((ponto) => {
                const alturaReceita = Math.max(
                  ponto.receitas > 0 ? 6 : 2,
                  Math.round((ponto.receitas / maxValorGrafico) * 100)
                );
                const alturaDespesa = Math.max(
                  ponto.despesas > 0 ? 6 : 2,
                  Math.round((ponto.despesas / maxValorGrafico) * 100)
                );

                return (
                  <button
                    key={ponto.chaveMes}
                    type="button"
                    onMouseEnter={() => setMesFocado(ponto)}
                    onFocus={() => setMesFocado(ponto)}
                    onClick={() => setMesFocado(ponto)}
                    className="flex-1 h-full flex flex-col items-center justify-end gap-2 group cursor-pointer focus:outline-none"
                  >
                    <div className="w-full flex-1 flex items-end justify-center gap-1.5 px-1">
                      <div
                        style={{ height: `${alturaReceita}%` }}
                        className="w-3 sm:w-4 rounded-t-md bg-teal-600 dark:bg-teal-400 transition-opacity group-hover:opacity-85"
                      />
                      <div
                        style={{ height: `${alturaDespesa}%` }}
                        className="w-3 sm:w-4 rounded-t-md bg-slate-300 dark:bg-zinc-600 transition-opacity group-hover:opacity-85"
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-100 tabular-nums">
                      {ponto.rotulo}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Lançamentos Recentes do Mês */}
          <section className="rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                Lançamentos Recentes
              </h2>
              <button
                type="button"
                onClick={() => onIrParaAba('lancamentos')}
                className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                Ver todos
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentes.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-slate-600 dark:text-zinc-400">
                  Nenhum lançamento registrado em {mesLabel}.
                </p>
                <button
                  type="button"
                  onClick={onNovoLancamento}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-medium hover:bg-slate-800 dark:hover:bg-white transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registrar primeiro lançamento
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {recentes.map((t) => {
                  const cat = CATEGORIAS[t.categoria] ?? CATEGORIAS.outros;
                  const valorComSinal = t.tipo === 'receita' ? t.valor : -t.valor;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onEditarTransacao(t)}
                      className="w-full py-3.5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-zinc-100 truncate">
                          {t.descricao}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                          <span>{cat.nome}</span>
                          <span aria-hidden="true"> · </span>
                          <span>{t.conta}</span>
                          <span aria-hidden="true"> · </span>
                          <span className="tabular-nums">{formatarDataBR(t.data)}</span>
                          {t.status === 'pendente' && (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                Pendente
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      <div
                        className={`text-sm font-medium shrink-0 ${
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
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Coluna Direita: Despesas por Categoria */}
        <div className="lg:col-span-5">
          <section className="rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5 sm:p-6 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                    Despesas por Categoria
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                    Distribuição em {mesLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onIrParaAba('categorias')}
                  className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline whitespace-nowrap cursor-pointer"
                >
                  Ajustar metas
                </button>
              </div>

              {categoriasResumo.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-500 dark:text-zinc-400">
                    Sem despesas registradas neste mês.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {categoriasResumo.map((item) => (
                    <div key={item.categoria.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium text-slate-800 dark:text-zinc-200 truncate">
                            {item.categoria.nome}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-zinc-500 tabular-nums shrink-0">
                            {item.percentual}%
                          </span>
                        </div>
                        <ValorBRL
                          valor={item.total}
                          modoPrivacidade={modoPrivacidade}
                          className="text-sm font-medium text-slate-900 dark:text-zinc-100 shrink-0"
                        />
                      </div>

                      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.categoria.corBarra}`}
                          style={{ width: `${Math.max(4, item.percentual)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {categoriasResumo.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
                <span>Total de despesas no período</span>
                <ValorBRL
                  valor={resumo.despesas}
                  modoPrivacidade={modoPrivacidade}
                  className="text-sm font-semibold text-slate-900 dark:text-zinc-100"
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
