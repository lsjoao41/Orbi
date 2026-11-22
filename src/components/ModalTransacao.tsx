import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { CONTAS_PADRAO, LISTA_CATEGORIAS } from '../services/transacoesService';
import type {
  CategoriaId,
  NovaTransacaoInput,
  StatusTransacao,
  TipoTransacao,
  Transacao,
} from '../types/finance';

interface ModalTransacaoProps {
  aberto: boolean;
  transacaoEdicao: Transacao | null;
  anoPadrao: number;
  mesPadrao: number;
  onFechar: () => void;
  onSalvar: (dados: NovaTransacaoInput, idEdicao?: string) => Promise<void>;
}

export const ModalTransacao: React.FC<ModalTransacaoProps> = ({
  aberto,
  transacaoEdicao,
  anoPadrao,
  mesPadrao,
  onFechar,
  onSalvar,
}) => {
  const [tipo, setTipo] = useState<TipoTransacao>('despesa');
  const [descricao, setDescricao] = useState('');
  const [valorTexto, setValorTexto] = useState('');
  const [data, setData] = useState('');
  const [categoria, setCategoria] = useState<CategoriaId>('alimentacao');
  const [conta, setConta] = useState(CONTAS_PADRAO[0]);
  const [status, setStatus] = useState<StatusTransacao>('pago');
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;

    setErro(null);
    if (transacaoEdicao) {
      setTipo(transacaoEdicao.tipo);
      setDescricao(transacaoEdicao.descricao);
      setValorTexto(transacaoEdicao.valor.toFixed(2).replace('.', ','));
      setData(transacaoEdicao.data);
      setCategoria(transacaoEdicao.categoria);
      setConta(transacaoEdicao.conta);
      setStatus(transacaoEdicao.status);
      setObservacoes(transacaoEdicao.observacoes ?? '');
    } else {
      const hoje = new Date();
      const mesmoMes =
        hoje.getFullYear() === anoPadrao && hoje.getMonth() === mesPadrao;
      const dia = mesmoMes ? String(hoje.getDate()).padStart(2, '0') : '01';
      const dataInicial = `${anoPadrao}-${String(mesPadrao + 1).padStart(2, '0')}-${dia}`;

      setTipo('despesa');
      setDescricao('');
      setValorTexto('');
      setData(dataInicial);
      setCategoria('alimentacao');
      setConta(CONTAS_PADRAO[0]);
      setStatus('pago');
      setObservacoes('');
    }
  }, [aberto, transacaoEdicao, anoPadrao, mesPadrao]);

  if (!aberto) return null;

  const handleTipoChange = (novoTipo: TipoTransacao) => {
    setTipo(novoTipo);
    if (novoTipo === 'receita' && categoria !== 'salario' && categoria !== 'investimentos') {
      setCategoria('salario');
    } else if (novoTipo === 'despesa' && (categoria === 'salario' || categoria === 'investimentos')) {
      setCategoria('alimentacao');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const descLimpa = descricao.trim();
    if (!descLimpa) {
      setErro('Informe uma descrição para o lançamento.');
      return;
    }

    const normalizado = valorTexto
      .trim()
      .replace(/R\$\s?/i, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const valorNumerico = Number.parseFloat(normalizado);

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      setErro('Informe um valor válido maior que zero.');
      return;
    }

    setSalvando(true);
    try {
      await onSalvar(
        {
          descricao: descLimpa,
          valor: valorNumerico,
          tipo,
          data,
          categoria,
          conta,
          status,
          observacoes: observacoes.trim() || undefined,
        },
        transacaoEdicao?.id
      );
      onFechar();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-transacao-titulo"
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between">
          <h2
            id="modal-transacao-titulo"
            className="text-base font-semibold text-slate-900 dark:text-zinc-100"
          >
            {transacaoEdicao ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar janela"
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200/70 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => handleTipoChange('despesa')}
              className={`py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                tipo === 'despesa'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => handleTipoChange('receita')}
              className={`py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                tipo === 'receita'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400'
              }`}
            >
              Receita
            </button>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="campo-descricao"
              className="block text-xs font-medium text-slate-700 dark:text-zinc-300"
            >
              Descrição
            </label>
            <input
              id="campo-descricao"
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Supermercado, Salário, Aluguel..."
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="campo-valor"
                className="block text-xs font-medium text-slate-700 dark:text-zinc-300"
              >
                Valor (R$)
              </label>
              <input
                id="campo-valor"
                type="text"
                inputMode="decimal"
                value={valorTexto}
                onChange={(e) => setValorTexto(e.target.value)}
                placeholder="0,00"
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600/30"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="campo-data"
                className="block text-xs font-medium text-slate-700 dark:text-zinc-300"
              >
                Data
              </label>
              <input
                id="campo-data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-600/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="campo-categoria"
                className="block text-xs font-medium text-slate-700 dark:text-zinc-300"
              >
                Categoria
              </label>
              <select
                id="campo-categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaId)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
              >
                {LISTA_CATEGORIAS.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="campo-conta"
                className="block text-xs font-medium text-slate-700 dark:text-zinc-300"
              >
                Conta ou Cartão
              </label>
              <select
                id="campo-conta"
                value={conta}
                onChange={(e) => setConta(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
              >
                {CONTAS_PADRAO.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
              Situação
            </span>
            <div className="flex items-center gap-4 pt-1">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="radio"
                  name="status-transacao"
                  checked={status === 'pago'}
                  onChange={() => setStatus('pago')}
                  className="accent-teal-600"
                />
                {tipo === 'receita' ? 'Recebido' : 'Pago'}
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-zinc-300 cursor-pointer">
                <input
                  type="radio"
                  name="status-transacao"
                  checked={status === 'pendente'}
                  onChange={() => setStatus('pendente')}
                  className="accent-teal-600"
                />
                Pendente
              </label>
            </div>
          </div>

          {erro && (
            <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">
              {erro}
            </p>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs sm:text-sm font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs sm:text-sm font-medium hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 transition-colors cursor-pointer"
            >
              {salvando ? 'Salvando...' : 'Salvar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
