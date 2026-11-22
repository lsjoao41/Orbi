export type TipoTransacao = 'receita' | 'despesa';

export type StatusTransacao = 'pago' | 'pendente';

export type CategoriaId =
  | 'moradia'
  | 'alimentacao'
  | 'transporte'
  | 'saude'
  | 'lazer'
  | 'assinaturas'
  | 'educacao'
  | 'salario'
  | 'investimentos'
  | 'outros';

export interface CategoriaConfig {
  id: CategoriaId;
  nome: string;
  tipoPadrao: TipoTransacao;
  corHex: string;
  corBarra: string;
}

export interface Transacao {
  id: string;
  descricao: string;
  valor: number;
  tipo: TipoTransacao;
  data: string; // YYYY-MM-DD
  categoria: CategoriaId;
  conta: string;
  status: StatusTransacao;
  fitid?: string;
  observacoes?: string;
  criadoEm: string;
}

export type NovaTransacaoInput = Omit<Transacao, 'id' | 'criadoEm'>;

export interface ResumoMensal {
  receitas: number;
  despesas: number;
  saldo: number;
  taxaEconomia: number;
  totalTransacoes: number;
  totalPendentes: number;
}

export interface CategoriaResumo {
  categoria: CategoriaConfig;
  total: number;
  percentual: number;
  quantidade: number;
  orcamento?: number;
}

export interface PontoHistorico {
  chaveMes: string; // YYYY-MM
  rotulo: string; // Ex: Nov
  receitas: number;
  despesas: number;
  saldo: number;
}

export interface OrcamentoCategoria {
  categoria: CategoriaId;
  limite: number;
}

export type AbaNavegacao = 'visao-geral' | 'lancamentos' | 'categorias' | 'importar-ofx';
