import { GoogleGenAI } from '@google/genai';

interface VercelApiRequest {
  method?: string;
  body?: unknown;
}

interface VercelApiResponse {
  status: (code: number) => VercelApiResponse;
  json: (data: unknown) => void;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
}

interface GeminiRequestBody {
  action?: 'analyze' | 'categorize';
  prompt?: string;
  context?: {
    mesLabel?: string;
    receitas?: number;
    despesas?: number;
    saldo?: number;
    topCategorias?: Array<{ categoria: string; total: number }>;
  };
}

export default async function handler(
  req: VercelApiRequest,
  res: VercelApiResponse
): Promise<void> {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({
      error: 'Método não permitido. Utilize POST para consultar este endpoint.',
    });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'Chave GEMINI_API_KEY não configurada nas variáveis de ambiente do servidor.',
    });
    return;
  }

  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as GeminiRequestBody | undefined;
    const action = body?.action ?? 'analyze';
    const userPrompt = body?.prompt?.trim();

    if (!userPrompt && !body?.context) {
      res.status(400).json({
        error: 'Envie um prompt ou contexto financeiro válido no corpo da requisição.',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction =
      action === 'categorize'
        ? 'Você é um classificador financeiro em Português (Brasil). Responda apenas com a categoria mais adequada entre: Moradia, Alimentação, Transporte, Saúde, Lazer, Assinaturas, Educação, Salário, Investimentos, Outros.'
        : 'Você é um analista financeiro pessoal objetivo do sistema Orbe. Responda em Português (Brasil), com tom claro, prático e conciso (máximo 3 tópicos curtos), usando valores em R$ (BRL).';

    const contents =
      userPrompt ??
      `Analise o resumo financeiro de ${body?.context?.mesLabel ?? 'este mês'}: Receitas R$ ${body?.context?.receitas ?? 0}, Despesas R$ ${body?.context?.despesas ?? 0}, Saldo R$ ${body?.context?.saldo ?? 0}. Principais categorias: ${JSON.stringify(body?.context?.topCategorias ?? [])}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents,
      config: {
        systemInstruction,
      },
    });

    res.status(200).json({
      text: response.text ?? '',
      model: 'gemini-4-hydrogen',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno ao processar requisição Gemini.';
    res.status(500).json({ error: message });
  }
}
