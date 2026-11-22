import React, { useRef, useState } from 'react';
import { Check, FileText, Upload } from 'lucide-react';
import {
  gerarExemploOFX,
  parseOFX,
  type ResultadoParseOFX,
  type TransacaoOFXParseada,
} from '../services/ofxParser';
import {
  LISTA_CATEGORIAS,
  formatarDataBR,
} from '../services/transacoesService';
import type { CategoriaId, NovaTransacaoInput, Transacao } from '../types/finance';
import { ValorBRL } from './ValorBRL';

interface ImportarOFXViewProps {
  ano: number;
  mes: number;
  transacoesExistentes: Transacao[];
  modoPrivacidade: boolean;
  onImportarLote: (novas: NovaTransacaoInput[]) => Promise<void>;
}

export const ImportarOFXView: React.FC<ImportarOFXViewProps> = ({
  ano,
  mes,
  transacoesExistentes,
  modoPrivacidade,
  onImportarLote,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [resultado, setResultado] = useState<ResultadoParseOFX | null>(null);
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set());
  const [erro, setErro] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);

  const fitidsExistentes = new Set(
    transacoesExistentes.map((t) => t.fitid).filter(Boolean)
  );

  const processarConteudoOFX = (conteudo: string) => {
    setErro(null);
    setMensagemSucesso(null);

    const parsed = parseOFX(conteudo);
    if (parsed.transacoes.length === 0) {
      setResultado(null);
      setErro('Não encontramos movimentações (<STMTTRN>) válidas neste arquivo OFX.');
      return;
    }

    const comDuplicidade: TransacaoOFXParseada[] = parsed.transacoes.map((t) => ({
      ...t,
      duplicada: fitidsExistentes.has(t.fitid),
    }));

    const indicesSelecionados = new Set<number>();
    comDuplicidade.forEach((t, idx) => {
      if (!t.duplicada) indicesSelecionados.add(idx);
    });

    setResultado({ ...parsed, transacoes: comDuplicidade });
    setSelecionadas(indicesSelecionados);
  };

  const lerArquivo = async (file: File) => {
    const nome = file.name.toLowerCase();
    if (!nome.endsWith('.ofx') && !nome.endsWith('.qfx')) {
      setErro('Selecione um arquivo bancário no formato .ofx ou .qfx.');
      return;
    }
    const texto = await file.text();
    processarConteudoOFX(texto);
  };

  const handleAlterarCategoria = (indice: number, novaCategoria: CategoriaId) => {
    if (!resultado) return;
    const atualizadas = resultado.transacoes.map((item, idx) =>
      idx === indice ? { ...item, categoria: novaCategoria } : item
    );
    setResultado({ ...resultado, transacoes: atualizadas });
  };

  const alternarSelecao = (indice: number) => {
    const proximo = new Set(selecionadas);
    if (proximo.has(indice)) proximo.delete(indice);
    else proximo.add(indice);
    setSelecionadas(proximo);
  };

  const confirmarImportacao = async () => {
    if (!resultado || selecionadas.size === 0) return;
    setImportando(true);
    try {
      const paraImportar: NovaTransacaoInput[] = resultado.transacoes
        .filter((_, idx) => selecionadas.has(idx))
        .map(({ duplicada: _d, trnType: _t, ...rest }) => rest);

      await onImportarLote(paraImportar);
      setMensagemSucesso(
        `${paraImportar.length} ${
          paraImportar.length === 1 ? 'lançamento importado' : 'lançamentos importados'
        } com sucesso.`
      );
      setResultado(null);
      setSelecionadas(new Set());
    } finally {
      setImportando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
          Importar Extrato OFX
        </h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
          Importe arquivos .ofx de bancos brasileiros com categorização automática e detecção de duplicidades.
        </p>
      </div>

      {/* Área de upload */}
      <section
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          setArrastando(false);
          const arquivo = e.dataTransfer.files?.[0];
          if (arquivo) void lerArquivo(arquivo);
        }}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          arrastando
            ? 'border-teal-600 bg-teal-50/40 dark:border-teal-400 dark:bg-teal-950/20'
            : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".ofx,.qfx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void lerArquivo(file);
            e.target.value = '';
          }}
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center justify-center mx-auto">
            <Upload className="w-5 h-5" />
          </div>

          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">
              Arraste seu extrato .OFX para cá ou selecione do dispositivo
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Compatível com Nubank, Itaú, Inter, Bradesco, Banco do Brasil e Santander.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-medium hover:bg-slate-800 dark:hover:bg-white transition-colors cursor-pointer"
            >
              Selecionar arquivo .OFX
            </button>

            <button
              type="button"
              onClick={() => processarConteudoOFX(gerarExemploOFX(ano, mes))}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              Testar com extrato de exemplo
            </button>
          </div>
        </div>
      </section>

      {erro && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-sm text-rose-700 dark:text-rose-300"
        >
          {erro}
        </div>
      )}

      {mensagemSucesso && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* Pré-visualização das transações do arquivo OFX */}
      {resultado && (
        <section className="rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="p-5 border-b border-slate-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                Pré-visualização do Extrato
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Banco {resultado.bancoId}
                <span aria-hidden="true"> · </span>
                Conta {resultado.contaId}
                <span aria-hidden="true"> · </span>
                {resultado.transacoes.length} movimentações lidas
                {resultado.saldoFinal !== undefined && (
                  <>
                    <span aria-hidden="true"> · </span>
                    Saldo final:{' '}
                    <ValorBRL
                      valor={resultado.saldoFinal}
                      modoPrivacidade={modoPrivacidade}
                      className="font-medium text-slate-700 dark:text-zinc-200"
                    />
                  </>
                )}
              </p>
            </div>

            <button
              type="button"
              disabled={selecionadas.size === 0 || importando}
              onClick={confirmarImportacao}
              className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white text-xs font-medium transition-colors whitespace-nowrap cursor-pointer"
            >
              {importando
                ? 'Importando...'
                : `Importar ${selecionadas.size} selecionados`}
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-zinc-800/70">
            {resultado.transacoes.map((item, idx) => {
              const marcado = selecionadas.has(idx);
              const valorSinal = item.tipo === 'receita' ? item.valor : -item.valor;

              return (
                <div
                  key={item.fitid}
                  className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => alternarSelecao(idx)}
                      aria-label={`Selecionar ${item.descricao}`}
                      className="mt-1 w-4 h-4 accent-teal-600 rounded cursor-pointer shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-zinc-100 truncate">
                        {item.descricao}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                        <span className="tabular-nums">{formatarDataBR(item.data)}</span>
                        <span aria-hidden="true"> · </span>
                        <span>{item.conta}</span>
                        {item.duplicada && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              Já importado anteriormente
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pl-7 sm:pl-0 shrink-0">
                    <select
                      aria-label={`Categoria para ${item.descricao}`}
                      value={item.categoria}
                      onChange={(e) =>
                        handleAlterarCategoria(idx, e.target.value as CategoriaId)
                      }
                      className="h-9 px-2.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 cursor-pointer"
                    >
                      {LISTA_CATEGORIAS.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nome}
                        </option>
                      ))}
                    </select>

                    <ValorBRL
                      valor={valorSinal}
                      modoPrivacidade={modoPrivacidade}
                      comSinal
                      className={`text-sm font-medium min-w-[100px] text-right ${
                        item.tipo === 'receita'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-zinc-100'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
