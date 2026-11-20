import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { WorkspaceStore } from './server/store.ts';
import type { PhotoEvaluationResult, SuggestedBonusQuest } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const PRIMARY_MODEL = 'gemini-4-hydrogen';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';
const store = new WorkspaceStore();

function formatGeminiError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  try {
    const parsed = JSON.parse(error.message);
    if (parsed?.error?.message) {
      return String(parsed.error.message);
    }
  } catch {
    // Not JSON, return plain message
  }
  return error.message || fallback;
}

function isTransientOrHighDemandError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    msg.includes('high demand') ||
    msg.includes('503') ||
    msg.includes('unavailable') ||
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('abort') ||
    msg.includes('timeout')
  );
}

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada no ambiente do servidor.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateWithResilience(
  ai: GoogleGenAI,
  params: {
    contents: Parameters<GoogleGenAI['models']['generateContent']>[0]['contents'];
    config?: Omit<
      NonNullable<Parameters<GoogleGenAI['models']['generateContent']>[0]['config']>,
      'thinkingConfig' | 'abortSignal'
    >;
  }
) {
  const attempts = [
    { model: PRIMARY_MODEL, thinkingLevel: ThinkingLevel.LOW, timeoutMs: 18_000 },
    { model: FALLBACK_MODEL, thinkingLevel: ThinkingLevel.MINIMAL, timeoutMs: 25_000 },
  ];

  let lastError: unknown;
  for (let i = 0; i < attempts.length; i += 1) {
    const attempt = attempts[i];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('Gemini request timeout')), attempt.timeoutMs);
    try {
      return await ai.models.generateContent({
        model: attempt.model,
        contents: params.contents,
        config: {
          ...params.config,
          thinkingConfig: { thinkingLevel: attempt.thinkingLevel },
          abortSignal: controller.signal,
        },
      });
    } catch (error) {
      lastError = error;
      const canFallback = i < attempts.length - 1 && isTransientOrHighDemandError(error);
      if (!canFallback) {
        throw error;
      }
      console.warn(
        `Gemini ${attempt.model} indisponível ou lento; tentando fallback ${attempts[i + 1].model}.`
      );
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, model: PRIMARY_MODEL, fallbackModel: FALLBACK_MODEL, storage: 'server-json' });
  });

  app.get('/api/workspace', async (req: Request, res: Response) => {
    try {
      const profileId = typeof req.query.profileId === 'string' ? req.query.profileId : 'julia';
      const workspace = await store.getOrSeedWorkspace(profileId);
      res.json(workspace);
    } catch (error) {
      console.error('Erro em GET /api/workspace:', error);
      res.status(500).json({ error: 'Falha ao carregar os dados da trilha.' });
    }
  });

  app.post('/api/workspace/reset', async (req: Request, res: Response) => {
    try {
      const profileId = typeof req.body?.profileId === 'string' ? req.body.profileId : 'julia';
      const workspace = await store.resetWorkspace(profileId);
      res.json(workspace);
    } catch (error) {
      console.error('Erro em POST /api/workspace/reset:', error);
      res.status(500).json({ error: 'Falha ao reiniciar progresso.' });
    }
  });

  app.post('/api/workspace/restore', async (req: Request, res: Response) => {
    try {
      const { profileId, snapshot } = req.body ?? {};
      if (!snapshot) {
        res.status(400).json({ error: 'Snapshot ausente para restauração.' });
        return;
      }
      const workspace = await store.restoreWorkspace(
        typeof profileId === 'string' ? profileId : 'julia',
        snapshot
      );
      res.json(workspace);
    } catch (error) {
      console.error('Erro em POST /api/workspace/restore:', error);
      res.status(400).json({ error: 'Falha ao restaurar progresso salvo.' });
    }
  });

  app.post('/api/quests/:questId/complete', async (req: Request, res: Response) => {
    try {
      const questId = String(req.params.questId || '');
      const { profileId, photoUrl, evaluation } = req.body ?? {};
      if (!questId || !photoUrl || !evaluation) {
        res.status(400).json({ error: 'Dados incompletos para concluir a missão.' });
        return;
      }

      const result = await store.completeQuest({
        profileId: typeof profileId === 'string' ? profileId : 'julia',
        questId,
        photoUrl: String(photoUrl),
        evaluation: evaluation as PhotoEvaluationResult,
      });

      res.json(result);
    } catch (error) {
      console.error('Erro em POST /api/quests/:questId/complete:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar conclusão da missão.';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/quests/bonus', async (req: Request, res: Response) => {
    try {
      const { profileId, suggestion } = req.body ?? {};
      if (!suggestion || typeof suggestion.title !== 'string') {
        res.status(400).json({ error: 'Sugestão de missão bônus inválida.' });
        return;
      }

      const result = await store.addBonusQuest({
        profileId: typeof profileId === 'string' ? profileId : 'julia',
        suggestion: suggestion as SuggestedBonusQuest,
      });

      res.json(result);
    } catch (error) {
      console.error('Erro em POST /api/quests/bonus:', error);
      res.status(500).json({ error: 'Falha ao adicionar missão bônus.' });
    }
  });

  app.post('/api/evaluate-photo', async (req: Request, res: Response) => {
    try {
      const {
        imageBase64,
        mimeType = 'image/jpeg',
        questTitle,
        questDescription,
        cameraTip,
        styleTag,
        currentStyle,
      } = req.body ?? {};

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({ error: 'Envie uma foto válida para avaliação.' });
        return;
      }

      const cleanBase64 = imageBase64.includes(',')
        ? imageBase64.split(',')[1]
        : imageBase64;

      const ai = getGenAIClient();

      const prompt = `Você é o Tutor de Fotografia pessoal da Julia, uma jovem criativa de 15 anos aprendendo fotografia na prática para montar seu portfólio e Instagram (@juliaphoto).
Equipamento dela: Câmera digital compacta Acrensly 8K com Wi-Fi, tela flip de 3", lente fixa grande-angular f=4.04mm com abertura clara f/1.8 e zoom digital (que ela deve evitar usar).

Missão atual:
- Título: "${questTitle || 'Missão Fotográfica'}"
- Objetivo: "${questDescription || 'Registrar uma foto criativa'}"
- Dica da câmera: "${cameraTip || 'Evitar zoom digital e usar meio-clique para focar'}"
- Categoria esperada: "${styleTag || 'digicam'}"
- Estilo predominante atual da Julia: "${currentStyle || 'Em Descoberta'}"

Analise a foto enviada considerando composição, iluminação, foco e enquadramento.
Regras do seu feedback (em Português do Brasil, tom de mentor jovem, encorajador, sem jargão técnico chato):
1. Aprove a missão (approved: true) sempre que a foto demonstrar tentativa real e tiver elementos visuais legíveis. Só reprove (approved: false) se a imagem estiver completamente preta, ilegível ou totalmente desconectada de uma fotografia.
2. Aponte exatamente 1 ponto forte real que você observou na imagem (strength).
3. Dê exatamente 1 sugestão prática e simples para a próxima foto com a Acrensly 8K (suggestion).
4. Escreva uma mensagem curta e animadora de mentor (mentorMessage).
5. Classifique 1 a 3 tags de estilo entre: "retrato", "natureza", "street", "macro", "digicam" (detectedTags).
6. Se perceber uma afinidade legal na foto (ex: muitas flores/objetos de perto -> macro; estética retrô/flash -> digicam; pessoas -> retrato; arquitetura/rua -> street; céu/luz -> natureza), sugira uma missão bônus personalizada curta (suggestedBonusQuest) com título, descrição, dica para a lente 4.04mm f/1.8 e styleTag.`;

      const response = await generateWithResilience(ai, {
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: typeof mimeType === 'string' ? mimeType : 'image/jpeg',
                data: cleanBase64,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              approved: {
                type: Type.BOOLEAN,
                description: 'Se a foto cumpre a missão com esforço genuíno.',
              },
              strength: {
                type: Type.STRING,
                description: '1 ponto forte específico observado na foto.',
              },
              suggestion: {
                type: Type.STRING,
                description: '1 sugestão prática e simples de melhoria para o próximo clique.',
              },
              mentorMessage: {
                type: Type.STRING,
                description: 'Mensagem encorajadora curta para a Julia.',
              },
              detectedTags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Lista de 1 a 3 tags entre: retrato, natureza, street, macro, digicam.',
              },
              suggestedBonusQuest: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  cameraTip: { type: Type.STRING },
                  styleTag: { type: Type.STRING },
                },
                required: ['title', 'description', 'cameraTip', 'styleTag'],
                description: 'Sugestão opcional de missão bônus baseada no estilo detectado.',
              },
            },
            required: ['approved', 'strength', 'suggestion', 'mentorMessage', 'detectedTags'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch (error) {
      console.error('Erro em /api/evaluate-photo:', error);
      const message = formatGeminiError(error, 'Falha ao avaliar foto com Gemini.');
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/tutor-chat', async (req: Request, res: Response) => {
    try {
      const { profileId, messages, userContext, imageBase64, mimeType } = req.body ?? {};
      if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Envie pelo menos uma mensagem para o Tutor IA.' });
        return;
      }

      const ai = getGenAIClient();
      const systemInstruction = `Você é o Tutor IA de Fotografia da Julia (15 anos), criador de uma vibe criativa, moderna e prática para ela dominar a câmera digital compacta Acrensly 8K (Wi-Fi, tela flip 3", lente fixa grande-angular f=4.04mm, abertura f/1.8, zoom digital) e montar seu perfil no Instagram (@juliaphoto).
Contexto atual da aluna:
- Nível: ${userContext?.level ?? 1} (${userContext?.totalXp ?? 0} XP)
- Estilo detectado até agora: ${userContext?.detected_style ?? 'Em Descoberta'}
- Missões concluídas: ${userContext?.completedCount ?? 0}

Regras:
- Responda em Português do Brasil com linguagem jovem, clara, amigável e sem jargões chatos.
- Sempre lembre dicas práticas da Acrensly 8K (ex: evitar zoom digital, usar meio-clique para focar, girar a tela flip 3", aproveitar f/1.8 em pouca luz ou usar flash direto para estética Y2K).
- Se ela pedir legenda/hashtags para o @juliaphoto, entregue 2 opções de legenda prontas + 5 a 8 hashtags estilosas em blocos fáceis de copiar.
- Respostas diretas e bem estruturadas (máximo 220 palavras).`;

      const latestMessage = messages[messages.length - 1];
      const historyLines = messages
        .slice(0, -1)
        .slice(-8)
        .map((m: { role: string; text: string }) => `${m.role === 'user' ? 'Julia' : 'Tutor IA'}: ${m.text}`)
        .join('\n');

      const userText = historyLines
        ? `Histórico recente:\n${historyLines}\n\nNova pergunta da Julia: ${latestMessage.text}`
        : latestMessage.text;

      const parts: Array<Record<string, unknown>> = [];
      if (imageBase64 && typeof imageBase64 === 'string') {
        const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        parts.push({
          inlineData: {
            mimeType: typeof mimeType === 'string' ? mimeType : 'image/jpeg',
            data: cleanBase64,
          },
        });
      }
      parts.push({ text: userText });

      const response = await generateWithResilience(ai, {
        contents: { parts },
        config: {
          systemInstruction,
        },
      });

      const reply = (response.text ?? '').trim();
      if (!reply) {
        res.status(502).json({ error: 'O Tutor IA retornou uma resposta vazia. Tente novamente.' });
        return;
      }

      const tutorMessages = await store.appendTutorMessages(
        typeof profileId === 'string' ? profileId : 'julia',
        [
          { role: 'user', text: String(latestMessage.text || '') },
          { role: 'assistant', text: reply },
        ]
      );

      res.json({ reply, tutorMessages });
    } catch (error) {
      console.error('Erro em /api/tutor-chat:', error);
      const message = formatGeminiError(error, 'Falha ao conversar com o Tutor IA.');
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Julia Photo Quest server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
