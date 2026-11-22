import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import type {
  CategoriaConfig,
  CategoriaId,
  CategoriaResumo,
  NovaTransacaoInput,
  OrcamentoCategoria,
  PontoHistorico,
  ResumoMensal,
  Transacao,
} from '../types/finance';
import { getFirebaseDb, isFirebaseConfigured } from './firebase';

const STORAGE_KEY_TRANSACOES = 'orbe_transacoes_v1';
const STORAGE_KEY_ORCAMENTOS = 'orbe_orcamentos_v1';

export const CATEGORIAS: Record<CategoriaId, CategoriaConfig> = {
  moradia: {
    id: 'moradia',
    nome: 'Moradia',
    tipoPadrao: 'despesa',
    corHex: '#0F766E',
    corBarra: 'bg-teal-600 dark:bg-teal-500',
  },
  alimentacao: {
    id: 'alimentacao',
    nome: 'Alimentação',
    tipoPadrao: 'despesa',
    corHex: '#0D9488',
    corBarra: 'bg-emerald-600 dark:bg-emerald-500',
  },
  transporte: {
    id: 'transporte',
    nome: 'Transporte',
    tipoPadrao: 'despesa',
    corHex: '#0284C7',
    corBarra: 'bg-sky-600 dark:bg-sky-500',
  },
  saude: {
    id: 'saude',
    nome: 'Saúde',
    tipoPadrao: 'despesa',
    corHex: '#E11D48',
    corBarra: 'bg-rose-600 dark:bg-rose-500',
  },
  lazer: {
    id: 'lazer',
    nome: 'Lazer',
    tipoPadrao: 'despesa',
    corHex: '#D97706',
    corBarra: 'bg-amber-600 dark:bg-amber-500',
  },
  assinaturas: {
    id: 'assinaturas',
    nome: 'Assinaturas',
    tipoPadrao: 'despesa',
    corHex: '#4F46E5',
    corBarra: 'bg-indigo-600 dark:bg-indigo-500',
  },
  educacao: {
    id: 'educacao',
    nome: 'Educação',
    tipoPadrao: 'despesa',
    corHex: '#7C3AED',
    corBarra: 'bg-violet-600 dark:bg-violet-500',
  },
  salario: {
    id: 'salario',
    nome: 'Salário e Renda',
    tipoPadrao: 'receita',
    corHex: '#16A34A',
    corBarra: 'bg-green-600 dark:bg-green-500',
  },
  investimentos: {
    id: 'investimentos',
    nome: 'Investimentos',
    tipoPadrao: 'receita',
    corHex: '#059669',
    corBarra: 'bg-emerald-700 dark:bg-emerald-400',
  },
  outros: {
    id: 'outros',
    nome: 'Outros',
    tipoPadrao: 'despesa',
    corHex: '#64748B',
    corBarra: 'bg-slate-500 dark:bg-zinc-500',
  },
};

export const LISTA_CATEGORIAS = Object.values(CATEGORIAS);

export const CONTAS_PADRAO = [
  'Nubank · Conta',
  'Itaú · Corrente',
  'Cartão de Crédito',
  'Carteira',
  'Corretora',
];

const ORCAMENTOS_INICIAIS: OrcamentoCategoria[] = [
  { categoria: 'moradia', limite: 2800 },
  { categoria: 'alimentacao', limite: 1400 },
  { categoria: 'transporte', limite: 650 },
  { categoria: 'assinaturas', limite: 250 },
  { categoria: 'saude', limite: 500 },
  { categoria: 'lazer', limite: 600 },
  { categoria: 'educacao', limite: 400 },
];

function criarChaveMes(ano: number, mesIndex: number): string {
  return `${ano}-${String(mesIndex + 1).padStart(2, '0')}`;
}

function deslocarMes(ano: number, mesIndex: number, delta: number): { ano: number; mes: number } {
  const d = new Date(ano, mesIndex + delta, 1);
  return { ano: d.getFullYear(), mes: d.getMonth() };
}

function gerarTransacoesIniciais(): Transacao[] {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth();
  const anterior = deslocarMes(anoAtual, mesAtual, -1);
  const doisMesesAtras = deslocarMes(anoAtual, mesAtual, -2);

  const cur = criarChaveMes(anoAtual, mesAtual);
  const prev = criarChaveMes(anterior.ano, anterior.mes);
  const prev2 = criarChaveMes(doisMesesAtras.ano, doisMesesAtras.mes);

  return [
    {
      id: 'tx-101',
      descricao: 'Salário Mensal',
      valor: 8400,
      tipo: 'receita',
      data: `${cur}-05`,
      categoria: 'salario',
      conta: 'Itaú · Corrente',
      status: 'pago',
      criadoEm: `${cur}-05T09:00:00.000Z`,
    },
    {
      id: 'tx-102',
      descricao: 'Aluguel e Condomínio',
      valor: 2450,
      tipo: 'despesa',
      data: `${cur}-06`,
      categoria: 'moradia',
      conta: 'Itaú · Corrente',
      status: 'pago',
      criadoEm: `${cur}-06T10:30:00.000Z`,
    },
    {
      id: 'tx-103',
      descricao: 'Supermercado Pão de Açúcar',
      valor: 684.5,
      tipo: 'despesa',
      data: `${cur}-08`,
      categoria: 'alimentacao',
      conta: 'Cartão de Crédito',
      status: 'pago',
      criadoEm: `${cur}-08T18:15:00.000Z`,
    },
    {
      id: 'tx-104',
      descricao: 'Energia Elétrica (Enel)',
      valor: 192.4,
      tipo: 'despesa',
      data: `${cur}-10`,
      categoria: 'moradia',
      conta: 'Nubank · Conta',
      status: 'pago',
      criadoEm: `${cur}-10T11:00:00.000Z`,
    },
    {
      id: 'tx-105',
      descricao: 'Dividendos FIIs & CDB',
      valor: 420.8,
      tipo: 'receita',
      data: `${cur}-14`,
      categoria: 'investimentos',
      conta: 'Corretora',
      status: 'pago',
      criadoEm: `${cur}-14T08:45:00.000Z`,
    },
    {
      id: 'tx-106',
      descricao: 'Spotify Família + iCloud+',
      valor: 54.8,
      tipo: 'despesa',
      data: `${cur}-15`,
      categoria: 'assinaturas',
      conta: 'Cartão de Crédito',
      status: 'pago',
      criadoEm: `${cur}-15T06:00:00.000Z`,
    },
    {
      id: 'tx-107',
      descricao: 'Restaurante Mocotó',
      valor: 218.0,
      tipo: 'despesa',
      data: `${cur}-17`,
      categoria: 'alimentacao',
      conta: 'Cartão de Crédito',
      status: 'pago',
      criadoEm: `${cur}-17T21:10:00.000Z`,
    },
    {
      id: 'tx-108',
      descricao: 'Abastecimento Posto Shell',
      valor: 245.0,
      tipo: 'despesa',
      data: `${cur}-19`,
      categoria: 'transporte',
      conta: 'Cartão de Crédito',
      status: 'pago',
      criadoEm: `${cur}-19T16:40:00.000Z`,
    },
    {
      id: 'tx-109',
      descricao: 'Plano de Saúde (Coparticipação)',
      valor: 310.0,
      tipo: 'despesa',
      data: `${cur}-25`,
      categoria: 'saude',
      conta: 'Nubank · Conta',
      status: 'pendente',
      criadoEm: `${cur}-20T12:00:00.000Z`,
    },
    // Mês anterior
    {
      id: 'tx-201',
      descricao: 'Salário Mensal',
      valor: 8400,
      tipo: 'receita',
      data: `${prev}-05`,
      categoria: 'salario',
      conta: 'Itaú · Corrente',
      status: 'pago',
      criadoEm: `${prev}-05T09:00:00.000Z`,
    },
    {
      id: 'tx-202',
      descricao: 'Aluguel e Condomínio',
      valor: 2450,
      tipo: 'despesa',
      data: `${prev}-06`,
      categoria: 'moradia',
      conta: 'Itaú · Corrente',
      status: 'pago',
      criadoEm: `${prev}-06T10:30:00.000Z`,
    },
    {
      id: 'tx-203',
      descricao: 'Supermercado Hortifruti',
      valor: 940.2,
      tipo: 'despesa',
      data: `${prev}-11`,
      categoria: 'alimentacao',
      conta: 'Cartão de Crédito',
      status: 'pago',
      criadoEm: `${prev}-11T19:00:00.000Z`,
    },
    {
      id: 'tx-204',
      descricao: 'Curso Especialização Finanças',
      valor: 380.0,
      tipo: 'despesa',
      data: `${prev}-18`,
      categoria: 'educacao',
      conta: 'Cartão de Crédito',
      status: 'pago',
      criadoEm: `${prev}-18T14:20:00.000Z`,
    },
    // 2 meses atrás
    {
      id: 'tx-301',
      descricao: 'Salário Mensal',
      valor: 8200,
      tipo: 'receita',
      data: `${prev2}-05`,
      categoria: 'salario',
      conta: 'Itaú · Corrente',
      status: 'pago',
      criadoEm: `${prev2}-05T09:00:00.000Z`,
    },
    {
      id: 'tx-302',
      descricao: 'Aluguel e Despesas Fixas',
      valor: 2790,
      tipo: 'despesa',
      data: `${prev2}-07`,
      categoria: 'moradia',
      conta: 'Itaú · Corrente',
      status: 'pago',
      criadoEm: `${prev2}-07T09:00:00.000Z`,
    },
    {
      id: 'tx-303',
      descricao: 'Alimentação & Mercado',
      valor: 1120,
      tipo: 'despesa',
      data: `${prev2}-16`,
      categoria: 'alimentacao',
      conta: 'Cartão de Crédito',
      status: 'pago',
      criadoEm: `${prev2}-16T18:00:00.000Z`,
    },
  ];
}

function lerLocalStorageTransacoes(): Transacao[] {
  const bruto = localStorage.getItem(STORAGE_KEY_TRANSACOES);
  if (bruto === null) {
    const iniciais = gerarTransacoesIniciais();
    localStorage.setItem(STORAGE_KEY_TRANSACOES, JSON.stringify(iniciais));
    return iniciais;
  }
  try {
    const parsed = JSON.parse(bruto);
    return Array.isArray(parsed) ? (parsed as Transacao[]) : [];
  } catch {
    return [];
  }
}

function salvarLocalStorageTransacoes(lista: Transacao[]): void {
  localStorage.setItem(STORAGE_KEY_TRANSACOES, JSON.stringify(lista));
}

export async function listarTransacoes(): Promise<Transacao[]> {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    const q = query(collection(db, 'transacoes'), orderBy('data', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...(d.data() as Transacao), id: d.id }));
  }

  return lerLocalStorageTransacoes().sort((a, b) => b.data.localeCompare(a.data));
}

export async function criarTransacao(input: NovaTransacaoInput): Promise<Transacao> {
  const id = `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const nova: Transacao = {
    ...input,
    id,
    criadoEm: new Date().toISOString(),
  };

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    await setDoc(doc(db, 'transacoes', id), nova);
    return nova;
  }

  const atuais = lerLocalStorageTransacoes();
  salvarLocalStorageTransacoes([nova, ...atuais]);
  return nova;
}

export async function atualizarTransacao(
  id: string,
  dados: Partial<NovaTransacaoInput>
): Promise<void> {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    await updateDoc(doc(db, 'transacoes', id), dados);
    return;
  }

  const atuais = lerLocalStorageTransacoes();
  const atualizados = atuais.map((t) => (t.id === id ? { ...t, ...dados } : t));
  salvarLocalStorageTransacoes(atualizados);
}

export async function excluirTransacao(id: string): Promise<void> {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    await deleteDoc(doc(db, 'transacoes', id));
    return;
  }

  const atuais = lerLocalStorageTransacoes();
  salvarLocalStorageTransacoes(atuais.filter((t) => t.id !== id));
}

export async function importarTransacoesEmLote(
  novas: NovaTransacaoInput[]
): Promise<Transacao[]> {
  if (novas.length === 0) return [];

  const agora = new Date().toISOString();
  const criadas: Transacao[] = novas.map((item, idx) => ({
    ...item,
    id: `tx-ofx-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    criadoEm: agora,
  }));

  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    const batch = writeBatch(db);
    for (const item of criadas) {
      batch.set(doc(db, 'transacoes', item.id), item);
    }
    await batch.commit();
    return criadas;
  }

  const atuais = lerLocalStorageTransacoes();
  salvarLocalStorageTransacoes([...criadas, ...atuais]);
  return criadas;
}

export async function limparTodasTransacoes(): Promise<void> {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    const snap = await getDocs(collection(db, 'transacoes'));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    return;
  }
  salvarLocalStorageTransacoes([]);
}

export async function listarOrcamentos(): Promise<OrcamentoCategoria[]> {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    const snap = await getDocs(collection(db, 'orcamentos'));
    if (!snap.empty) {
      return snap.docs.map((d) => d.data() as OrcamentoCategoria);
    }
  }

  const bruto = localStorage.getItem(STORAGE_KEY_ORCAMENTOS);
  if (bruto === null) {
    localStorage.setItem(STORAGE_KEY_ORCAMENTOS, JSON.stringify(ORCAMENTOS_INICIAIS));
    return ORCAMENTOS_INICIAIS;
  }
  try {
    const parsed = JSON.parse(bruto);
    return Array.isArray(parsed) ? (parsed as OrcamentoCategoria[]) : ORCAMENTOS_INICIAIS;
  } catch {
    return ORCAMENTOS_INICIAIS;
  }
}

export async function salvarOrcamento(
  categoria: CategoriaId,
  limite: number
): Promise<OrcamentoCategoria[]> {
  const db = getFirebaseDb();
  if (db && isFirebaseConfigured()) {
    await setDoc(doc(db, 'orcamentos', categoria), { categoria, limite });
  }

  const atuais = await listarOrcamentos();
  const existe = atuais.some((o) => o.categoria === categoria);
  const atualizados = existe
    ? atuais.map((o) => (o.categoria === categoria ? { ...o, limite } : o))
    : [...atuais, { categoria, limite }];

  localStorage.setItem(STORAGE_KEY_ORCAMENTOS, JSON.stringify(atualizados));
  return atualizados;
}

// Funções puras de formatação e cálculo financeiro

export function formatarMoedaBRL(valor: number, comSinal = false): string {
  const abs = Math.abs(valor);
  const formatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);

  if (comSinal) {
    if (valor > 0) return `+ ${formatado}`;
    if (valor < 0) return `- ${formatado}`;
  } else if (valor < 0) {
    return `-${formatado}`;
  }

  return formatado;
}

export function formatarDataBR(dataISO: string): string {
  const partes = dataISO.split('-');
  if (partes.length !== 3) return dataISO;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export function formatarMesAnoLabel(ano: number, mesIndex: number): string {
  const nomes = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return `${nomes[mesIndex] ?? ''} ${ano}`;
}

export function filtrarPorMes(
  transacoes: Transacao[],
  ano: number,
  mesIndex: number
): Transacao[] {
  const prefixo = criarChaveMes(ano, mesIndex);
  return transacoes
    .filter((t) => t.data.startsWith(prefixo))
    .sort((a, b) => b.data.localeCompare(a.data));
}

export function calcularResumoMensal(transacoesMes: Transacao[]): ResumoMensal {
  let receitas = 0;
  let despesas = 0;
  let totalPendentes = 0;

  for (const t of transacoesMes) {
    if (t.tipo === 'receita') {
      receitas += t.valor;
    } else {
      despesas += t.valor;
    }
    if (t.status === 'pendente') {
      totalPendentes += 1;
    }
  }

  const saldo = receitas - despesas;
  const taxaEconomia = receitas > 0 ? Math.max(0, Math.round((saldo / receitas) * 100)) : 0;

  return {
    receitas,
    despesas,
    saldo,
    taxaEconomia,
    totalTransacoes: transacoesMes.length,
    totalPendentes,
  };
}

export function agruparDespesasPorCategoria(
  transacoesMes: Transacao[],
  orcamentos: OrcamentoCategoria[]
): CategoriaResumo[] {
  const despesas = transacoesMes.filter((t) => t.tipo === 'despesa');
  const totalDespesas = despesas.reduce((acc, t) => acc + t.valor, 0);

  const mapa = new Map<CategoriaId, { total: number; quantidade: number }>();

  for (const t of despesas) {
    const atual = mapa.get(t.categoria) ?? { total: 0, quantidade: 0 };
    mapa.set(t.categoria, {
      total: atual.total + t.valor,
      quantidade: atual.quantidade + 1,
    });
  }

  const orcamentoMap = new Map(orcamentos.map((o) => [o.categoria, o.limite]));

  const resultado: CategoriaResumo[] = [];
  for (const [catId, dados] of mapa.entries()) {
    const config = CATEGORIAS[catId] ?? CATEGORIAS.outros;
    resultado.push({
      categoria: config,
      total: dados.total,
      percentual: totalDespesas > 0 ? Math.round((dados.total / totalDespesas) * 100) : 0,
      quantidade: dados.quantidade,
      orcamento: orcamentoMap.get(catId),
    });
  }

  return resultado.sort((a, b) => b.total - a.total);
}

export function calcularHistoricoMeses(
  transacoes: Transacao[],
  anoBase: number,
  mesBase: number,
  quantidadeMeses = 6
): PontoHistorico[] {
  const nomesCurtos = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const pontos: PontoHistorico[] = [];

  for (let i = quantidadeMeses - 1; i >= 0; i--) {
    const { ano, mes } = deslocarMes(anoBase, mesBase, -i);
    const chaveMes = criarChaveMes(ano, mes);
    const doMes = filtrarPorMes(transacoes, ano, mes);
    const resumo = calcularResumoMensal(doMes);

    pontos.push({
      chaveMes,
      rotulo: nomesCurtos[mes] ?? '',
      receitas: resumo.receitas,
      despesas: resumo.despesas,
      saldo: resumo.saldo,
    });
  }

  return pontos;
}
