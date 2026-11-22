import type { CategoriaId, NovaTransacaoInput, TipoTransacao } from '../types/finance';

export interface TransacaoOFXParseada extends NovaTransacaoInput {
  fitid: string;
  trnType: string;
  duplicada?: boolean;
}

export interface ResultadoParseOFX {
  bancoId: string;
  contaId: string;
  moeda: string;
  dataInicio?: string;
  dataFim?: string;
  saldoFinal?: number;
  transacoes: TransacaoOFXParseada[];
}

function extrairTag(bloco: string, tag: string): string {
  const xmlRegex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i');
  const xmlMatch = bloco.match(xmlRegex);
  if (xmlMatch?.[1] !== undefined) {
    return xmlMatch[1].trim();
  }

  const sgmlRegex = new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i');
  const sgmlMatch = bloco.match(sgmlRegex);
  return sgmlMatch?.[1] ? sgmlMatch[1].trim() : '';
}

function formatarDataOFX(dtPosted: string): string {
  const digits = dtPosted.replace(/\D/g, '');
  if (digits.length >= 8) {
    const ano = digits.slice(0, 4);
    const mes = digits.slice(4, 6);
    const dia = digits.slice(6, 8);
    return `${ano}-${mes}-${dia}`;
  }
  return new Date().toISOString().slice(0, 10);
}

function parsearValorOFX(trnamt: string): number {
  const limpo = trnamt.trim().replace(/\s+/g, '');
  if (!limpo) return 0;

  const temVirgula = limpo.includes(',');
  const temPonto = limpo.includes('.');

  if (temVirgula && temPonto) {
    // Ex: 1.234,56 -> 1234.56
    const normalizado = limpo.replace(/\./g, '').replace(',', '.');
    const parsed = Number.parseFloat(normalizado);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (temVirgula) {
    const parsed = Number.parseFloat(limpo.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number.parseFloat(limpo);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function inferirCategoriaPorDescricao(
  descricao: string,
  tipo: TipoTransacao
): CategoriaId {
  const texto = descricao.toLowerCase();

  if (tipo === 'receita') {
    if (/salario|salário|folha|pagamento|remuneracao|pro-labore|prolabore/.test(texto)) {
      return 'salario';
    }
    if (/rendimento|dividendo|juros|cdb|tesouro|resgate|fii/.test(texto)) {
      return 'investimentos';
    }
    return 'outros';
  }

  if (/ifood|restaurante|padaria|supermercado|mercado|hortifruti|cafe|café|lanchonete|carrefour|pao de acucar|assai/.test(texto)) {
    return 'alimentacao';
  }
  if (/uber|99|posto|combustivel|gasolina|etanol|estacionamento|metro|metrô|bilhete|pedagio|pedágio/.test(texto)) {
    return 'transporte';
  }
  if (/aluguel|condominio|condomínio|energia|luz|enel|sabesp|agua|água|gas|gás|iptu|internet|vivo|claro|tim/.test(texto)) {
    return 'moradia';
  }
  if (/netflix|spotify|amazon prime|disney|hbo|youtube|icloud|apple|chatgpt|adobe|assinatura/.test(texto)) {
    return 'assinaturas';
  }
  if (/farmacia|farmácia|drogaria|droga|hospital|clinica|clínica|consulta|exame|plano de saude|unimed/.test(texto)) {
    return 'saude';
  }
  if (/cinema|ingresso|teatro|show|viagem|hotel|airbnb|bar|lazer/.test(texto)) {
    return 'lazer';
  }
  if (/curso|faculdade|escola|livro|livraria|udemy|alura|educacao|educação/.test(texto)) {
    return 'educacao';
  }
  if (/corretora|xp|btg|nuinvest|tesouro|aplicacao|aplicação/.test(texto)) {
    return 'investimentos';
  }

  return 'outros';
}

export function parseOFX(conteudoBruto: string, contaPadrao = 'Conta Corrente'): ResultadoParseOFX {
  const conteudo = conteudoBruto.replace(/\r\n/g, '\n');

  const bancoId = extrairTag(conteudo, 'BANKID') || extrairTag(conteudo, 'ORG') || 'Banco';
  const contaId = extrairTag(conteudo, 'ACCTID') || contaPadrao;
  const moeda = extrairTag(conteudo, 'CURDEF') || 'BRL';

  const dtStartRaw = extrairTag(conteudo, 'DTSTART');
  const dtEndRaw = extrairTag(conteudo, 'DTEND');
  const balAmtRaw = extrairTag(conteudo, 'BALAMT');

  const blocosTransacao = conteudo.match(/<STMTTRN>[\s\S]*?(?=<\/STMTTRN>|<STMTTRN>|<\/BANKTRANLIST>)/gi) ?? [];

  const transacoes: TransacaoOFXParseada[] = [];

  for (let i = 0; i < blocosTransacao.length; i++) {
    const bloco = blocosTransacao[i];
    const trnType = extrairTag(bloco, 'TRNTYPE') || 'OTHER';
    const dtPosted = extrairTag(bloco, 'DTPOSTED');
    const trnAmtRaw = extrairTag(bloco, 'TRNAMT');
    const fitid = extrairTag(bloco, 'FITID') || `ofx-${i}-${dtPosted}-${trnAmtRaw}`;
    const memo = extrairTag(bloco, 'MEMO');
    const name = extrairTag(bloco, 'NAME');

    const valorBruto = parsearValorOFX(trnAmtRaw);
    if (valorBruto === 0) continue;

    const tipo: TipoTransacao =
      valorBruto > 0 || trnType.toUpperCase() === 'CREDIT' ? 'receita' : 'despesa';
    const valorAbsoluto = Math.abs(valorBruto);
    const descricaoLimpa = (memo || name || 'Lançamento bancário').replace(/\s+/g, ' ').trim();
    const dataFormatada = formatarDataOFX(dtPosted);

    transacoes.push({
      descricao: descricaoLimpa,
      valor: valorAbsoluto,
      tipo,
      data: dataFormatada,
      categoria: inferirCategoriaPorDescricao(descricaoLimpa, tipo),
      conta: contaId !== contaPadrao ? `${bancoId} · ${contaId.slice(-4)}` : contaPadrao,
      status: 'pago',
      fitid,
      trnType,
      observacoes: `Importado via OFX (${trnType})`,
    });
  }

  return {
    bancoId,
    contaId,
    moeda,
    dataInicio: dtStartRaw ? formatarDataOFX(dtStartRaw) : undefined,
    dataFim: dtEndRaw ? formatarDataOFX(dtEndRaw) : undefined,
    saldoFinal: balAmtRaw ? parsearValorOFX(balAmtRaw) : undefined,
    transacoes,
  };
}

export function gerarExemploOFX(ano: number, mes: number): string {
  const mm = String(mes + 1).padStart(2, '0');
  const yyyymm = `${ano}${mm}`;

  return `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:UTF-8
CHARSET:NONE
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
  <SIGNONMSGSRSV1>
    <SONRS>
      <STATUS><CODE>0<SEVERITY>INFO</STATUS>
      <DTSERVER>${yyyymm}20120000[-3:BRT]
      <LANGUAGE>POR
      <FI><ORG>NU PAGAMENTOS S.A.<FID>0260</FI>
    </SONRS>
  </SIGNONMSGSRSV1>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <TRNUID>1001
      <STATUS><CODE>0<SEVERITY>INFO</STATUS>
      <STMTRS>
        <CURDEF>BRL
        <BANKACCTFROM>
          <BANKID>0260
          <ACCTID>8492019-4
          <ACCTTYPE>CHECKING
        </BANKACCTFROM>
        <BANKTRANLIST>
          <DTSTART>${yyyymm}01000000[-3:BRT]
          <DTEND>${yyyymm}22000000[-3:BRT]
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>${yyyymm}06143000[-3:BRT]
            <TRNAMT>-64.90
            <FITID>${yyyymm}-OFX-001
            <MEMO>Pix enviado - Padaria Bella Paulista
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>${yyyymm}09191500[-3:BRT]
            <TRNAMT>-42.50
            <FITID>${yyyymm}-OFX-002
            <MEMO>Uber *Trip Centro
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>${yyyymm}12100000[-3:BRT]
            <TRNAMT>-129.90
            <FITID>${yyyymm}-OFX-003
            <MEMO>Vivo Fibra Residencial
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>CREDIT
            <DTPOSTED>${yyyymm}15112000[-3:BRT]
            <TRNAMT>1850.00
            <FITID>${yyyymm}-OFX-004
            <MEMO>Pix recebido - Consultoria Projeto Web
          </STMTTRN>
        </BANKTRANLIST>
        <LEDGERBAL>
          <BALAMT>6420.35
          <DTASOF>${yyyymm}22000000[-3:BRT]
        </LEDGERBAL>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;
}
