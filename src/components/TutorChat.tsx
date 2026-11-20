import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Camera,
  Check,
  Copy,
  ImagePlus,
  Loader2,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import type { TutorMessage, UserProfile } from '../types';
import { compressImageFileToDataUrl } from '../utils/imageResize';

interface TutorChatProps {
  user: UserProfile;
  completedCount: number;
  messages: TutorMessage[];
  initialDraft?: string;
  onConsumeInitialDraft?: () => void;
  onSendMessage: (
    text: string,
    imagePayload?: { dataUrl: string; mimeType: string }
  ) => Promise<void>;
  isSending: boolean;
  errorMsg: string | null;
}

const QUICK_PROMPTS = [
  'Criar legenda e hashtags pro @juliaphoto',
  'Como usar o flash da Acrensly sem estourar?',
  'Ideias de poses usando a tela flip 3"',
  'Como conseguir desfoque bonito com f/1.8?',
];

function renderFormattedText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-zinc-50">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-black/30 text-amber-300 font-mono-num text-xs"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export function TutorChat({
  user,
  completedCount,
  messages,
  initialDraft,
  onConsumeInitialDraft,
  onSendMessage,
  isSending,
  errorMsg,
}: TutorChatProps) {
  const [input, setInput] = useState('');
  const [attachedPhoto, setAttachedPhoto] = useState<{
    dataUrl: string;
    mimeType: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialDraft) {
      setInput(initialDraft);
      onConsumeInitialDraft?.();
    }
  }, [initialDraft, onConsumeInitialDraft]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isSending]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;
    const photo = attachedPhoto ?? undefined;
    setInput('');
    setAttachedPhoto(null);
    await onSendMessage(trimmed, photo);
  };

  const handlePhotoAttach = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFileToDataUrl(file);
      setAttachedPhoto(compressed);
    } catch {
      // Ignore invalid image quietly
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Ignore clipboard restrictions
    }
  };

  return (
    <div className="bg-[#13151C] border border-white/10 rounded-2xl flex flex-col h-[calc(100vh-12rem)] min-h-[480px] max-h-[760px]">
      {/* Chat Header */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/35 flex items-center justify-center text-purple-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-zinc-50">
              Tutor IA de Fotografia
            </h1>
            <p className="text-xs text-zinc-400">
              Acrensly 8K · Estilo: {user.detected_style} · {completedCount} missões
            </p>
          </div>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-3 border-b border-white/8 flex flex-wrap items-center gap-2">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => setInput(prompt)}
            className="px-3 py-1.5 rounded-lg bg-[#1A1D27] hover:bg-[#232736] border border-white/10 text-xs text-zinc-200 transition-colors min-h-[36px] cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.length === 0 && (
          <div className="rounded-2xl bg-[#1A1D27]/70 border border-white/8 p-5 space-y-2 max-w-lg">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
              <Camera className="w-4 h-4" />
              <span>Seu Mentor Pessoal</span>
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed">
              Oi, {user.displayName}! Estou aqui para te ajudar com a Acrensly 8K (f/1.8), dar
              ideias de poses com a tela flip de 3&quot; e criar legendas prontas para o{' '}
              <span className="text-amber-300 font-medium">@juliaphoto</span>. Pode mandar sua
              dúvida ou anexar uma foto!
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-2 ${
                  isUser
                    ? 'bg-amber-500 text-zinc-950 font-medium'
                    : 'bg-[#1A1D27] border border-white/10 text-zinc-100'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">
                  {isUser ? msg.text : renderFormattedText(msg.text)}
                </p>
                {!isUser && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      aria-label="Copiar resposta do Tutor IA"
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-[#1A1D27] border border-white/10 px-4 py-3 text-sm text-zinc-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>Tutor IA escrevendo...</span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-200"
          >
            {errorMsg}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-white/10 space-y-2.5">
        {attachedPhoto && (
          <div className="flex items-center gap-3 bg-[#1A1D27] border border-white/10 rounded-xl p-2 w-fit">
            <img
              src={attachedPhoto.dataUrl}
              alt="Foto anexada para o Tutor IA"
              className="w-12 h-12 object-cover rounded-lg"
            />
            <span className="text-xs text-zinc-300">Foto anexada</span>
            <button
              type="button"
              onClick={() => setAttachedPhoto(null)}
              aria-label="Remover foto anexada"
              className="p-1 text-zinc-400 hover:text-zinc-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <label
            title="Anexar foto"
            aria-label="Anexar foto para o Tutor IA"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-[#1A1D27] hover:bg-[#232736] border border-white/10 text-zinc-300 cursor-pointer shrink-0 transition-colors"
          >
            <ImagePlus className="w-5 h-5" />
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoAttach}
              className="sr-only"
            />
          </label>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre foco f/1.8, poses ou peça uma legenda..."
            aria-label="Mensagem para o Tutor IA"
            className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#0A0B0F] border border-white/12 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
          />

          <button
            type="submit"
            disabled={!input.trim() || isSending}
            aria-label="Enviar mensagem para o Tutor IA"
            className="min-w-[44px] min-h-[44px] px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-semibold text-sm flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </div>
      </form>
    </div>
  );
}
