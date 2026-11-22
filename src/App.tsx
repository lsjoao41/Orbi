import { useCallback, useEffect, useMemo, useState } from 'react';
import { CategoriasView } from './components/CategoriasView';
import { Header } from './components/Header';
import { ImportarOFXView } from './components/ImportarOFXView';
import { LancamentosView } from './components/LancamentosView';
import { ModalTransacao } from './components/ModalTransacao';
import { Sidebar } from './components/Sidebar';
import { VisaoGeralView } from './components/VisaoGeralView';
import {
  agruparDespesasPorCategoria,
  atualizarTransacao,
  calcularHistoricoMeses,
  calcularResumoMensal,
  criarTransacao,
  excluirTransacao,
  filtrarPorMes,
  importarTransacoesEmLote,
  listarOrcamentos,
  listarTransacoes,
  salvarOrcamento,
} from './services/transacoesService';
import type {
  AbaNavegacao,
  CategoriaId,
  NovaTransacaoInput,
  OrcamentoCategoria,
  Transacao,
} from './types/finance';

export default function App() {
  const [ano, setAno] = useState<number>(() => new Date().getFullYear());
  const [mes, setMes] = useState<number>(() => new Date().getMonth());

  const [abaAtiva, setAbaAtiva] = useState<AbaNavegacao>('visao-geral');
  const [sidebarRetraida, setSidebarRetraida] = useState<boolean>(() => {
    return localStorage.getItem('orbe_sidebar_retraida') === 'true';
  });

  const [modoPrivacidade, setModoPrivacidade] = useState<boolean>(() => {
    return localStorage.getItem('orbe_privacidade') === 'true';
  });

  const [temaEscuro, setTemaEscuro] = useState<boolean>(() => {
    const salvo = localStorage.getItem('orbe_tema');
    if (salvo === 'dark') return true;
    if (salvo === 'light') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [orcamentos, setOrcamentos] = useState<OrcamentoCategoria[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);

  const [modalAberto, setModalAberto] = useState<boolean>(false);
  const [transacaoEdicao, setTransacaoEdicao] = useState<Transacao | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', temaEscuro);
    localStorage.setItem('orbe_tema', temaEscuro ? 'dark' : 'light');
  }, [temaEscuro]);

  useEffect(() => {
    localStorage.setItem('orbe_privacidade', String(modoPrivacidade));
  }, [modoPrivacidade]);

  useEffect(() => {
    localStorage.setItem('orbe_sidebar_retraida', String(sidebarRetraida));
  }, [sidebarRetraida]);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    try {
      const [listaTx, listaOrc] = await Promise.all([
        listarTransacoes(),
        listarOrcamentos(),
      ]);
      setTransacoes(listaTx);
      setOrcamentos(listaOrc);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  const handleMesAnterior = () => {
    if (mes === 0) {
      setMes(11);
      setAno((prev) => prev - 1);
    } else {
      setMes((prev) => prev - 1);
    }
  };

  const handleProximoMes = () => {
    if (mes === 11) {
      setMes(0);
      setAno((prev) => prev + 1);
    } else {
      setMes((prev) => prev + 1);
    }
  };

  const handleSelecionarMesAno = (novoAno: number, novoMes: number) => {
    setAno(novoAno);
    setMes(novoMes);
  };

  const handleIrParaMesAtual = () => {
    const hoje = new Date();
    setAno(hoje.getFullYear());
    setMes(hoje.getMonth());
  };

  const handleAbrirNovo = () => {
    setTransacaoEdicao(null);
    setModalAberto(true);
  };

  const handleAbrirEdicao = (transacao: Transacao) => {
    setTransacaoEdicao(transacao);
    setModalAberto(true);
  };

  const handleSalvarTransacao = async (
    dados: NovaTransacaoInput,
    idEdicao?: string
  ) => {
    if (idEdicao) {
      await atualizarTransacao(idEdicao, dados);
      setTransacoes((prev) =>
        prev.map((t) => (t.id === idEdicao ? { ...t, ...dados } : t))
      );
    } else {
      const criada = await criarTransacao(dados);
      setTransacoes((prev) => [criada, ...prev]);
    }
  };

  const handleExcluirTransacao = async (id: string) => {
    await excluirTransacao(id);
    setTransacoes((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAlternarStatus = async (transacao: Transacao) => {
    const novoStatus = transacao.status === 'pago' ? 'pendente' : 'pago';
    await atualizarTransacao(transacao.id, { status: novoStatus });
    setTransacoes((prev) =>
      prev.map((t) =>
        t.id === transacao.id ? { ...t, status: novoStatus } : t
      )
    );
  };

  const handleSalvarOrcamento = async (
    categoria: CategoriaId,
    limite: number
  ) => {
    const atualizados = await salvarOrcamento(categoria, limite);
    setOrcamentos(atualizados);
  };

  const handleImportarLote = async (novas: NovaTransacaoInput[]) => {
    const criadas = await importarTransacoesEmLote(novas);
    setTransacoes((prev) => [...criadas, ...prev]);
  };

  const transacoesMes = useMemo(
    () => filtrarPorMes(transacoes, ano, mes),
    [transacoes, ano, mes]
  );

  const resumoMes = useMemo(
    () => calcularResumoMensal(transacoesMes),
    [transacoesMes]
  );

  const categoriasResumo = useMemo(
    () => agruparDespesasPorCategoria(transacoesMes, orcamentos),
    [transacoesMes, orcamentos]
  );

  const historicoSemestral = useMemo(
    () => calcularHistoricoMeses(transacoes, ano, mes, 6),
    [transacoes, ano, mes]
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Header
        ano={ano}
        mes={mes}
        onMesAnterior={handleMesAnterior}
        onProximoMes={handleProximoMes}
        onSelecionarMesAno={handleSelecionarMesAno}
        onIrParaMesAtual={handleIrParaMesAtual}
        modoPrivacidade={modoPrivacidade}
        onAlternarPrivacidade={() => setModoPrivacidade((v) => !v)}
        temaEscuro={temaEscuro}
        onAlternarTema={() => setTemaEscuro((v) => !v)}
      />

      <div className="flex-1 flex">
        <Sidebar
          abaAtiva={abaAtiva}
          onSelecionarAba={setAbaAtiva}
          retraida={sidebarRetraida}
          onAlternarRetracao={() => setSidebarRetraida((v) => !v)}
        />

        <main className="flex-1 min-w-0 px-4 sm:px-8 py-6 pb-24 md:pb-12">
          <div className="max-w-6xl mx-auto">
            {carregando ? (
              <div className="space-y-6" aria-busy="true" aria-label="Carregando dados financeiros">
                <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-zinc-800 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-28 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-5"
                    >
                      <div className="h-3 w-20 rounded bg-slate-200 dark:bg-zinc-800" />
                      <div className="h-7 w-32 rounded bg-slate-200 dark:bg-zinc-800 mt-4" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {abaAtiva === 'visao-geral' && (
                  <VisaoGeralView
                    ano={ano}
                    mes={mes}
                    resumo={resumoMes}
                    transacoesMes={transacoesMes}
                    categoriasResumo={categoriasResumo}
                    historico={historicoSemestral}
                    modoPrivacidade={modoPrivacidade}
                    onNovoLancamento={handleAbrirNovo}
                    onIrParaAba={setAbaAtiva}
                    onEditarTransacao={handleAbrirEdicao}
                  />
                )}

                {abaAtiva === 'lancamentos' && (
                  <LancamentosView
                    ano={ano}
                    mes={mes}
                    transacoesMes={transacoesMes}
                    modoPrivacidade={modoPrivacidade}
                    onNovoLancamento={handleAbrirNovo}
                    onEditarTransacao={handleAbrirEdicao}
                    onExcluirTransacao={handleExcluirTransacao}
                    onAlternarStatus={handleAlternarStatus}
                  />
                )}

                {abaAtiva === 'categorias' && (
                  <CategoriasView
                    ano={ano}
                    mes={mes}
                    transacoesMes={transacoesMes}
                    orcamentos={orcamentos}
                    modoPrivacidade={modoPrivacidade}
                    onSalvarOrcamento={handleSalvarOrcamento}
                  />
                )}

                {abaAtiva === 'importar-ofx' && (
                  <ImportarOFXView
                    ano={ano}
                    mes={mes}
                    transacoesExistentes={transacoes}
                    modoPrivacidade={modoPrivacidade}
                    onImportarLote={handleImportarLote}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <ModalTransacao
        aberto={modalAberto}
        transacaoEdicao={transacaoEdicao}
        anoPadrao={ano}
        mesPadrao={mes}
        onFechar={() => setModalAberto(false)}
        onSalvar={handleSalvarTransacao}
      />
    </div>
  );
}
