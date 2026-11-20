import { useRef, useState, type ChangeEvent } from 'react';
import {
  CheckCircle2,
  ImagePlus,
  Lightbulb,
  Loader2,
  Lock,
  MessageCircle,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import type { PhotoEvaluationResult, PhotoQuest } from '../types';
import { compressImageFileToDataUrl, imageUrlToDataUrl } from '../utils/imageResize';

interface QuestModalProps {
  quest: PhotoQuest;
  moduleTitle: string;
  currentStyle: string;
  onClose: () => void;
  onCompleteQuest: (
    questId: string,
    photoDataUrl: string,
    evaluation: PhotoEvaluationResult
  ) => Promise<void>;
  onAskTutorForCaption: (quest: PhotoQuest) => void;
}

export function QuestModal({
  quest,
  moduleTitle,
  currentStyle,
  onClose,
  onCompleteQuest,
  onAskTutorForCaption,
}: QuestModalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string>('');
  const [selectedMimeType, setSelectedMimeType] = useState<string>('image/jpeg');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rejectedFeedback, setRejectedFeedback] = useState<PhotoEvaluationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setErrorMsg(null);
    setRejectedFeedback(null);
    try {
      const compressed = await compressImageFileToDataUrl(file);
      setSelectedPhoto(compressed.dataUrl);
      setSelectedMimeType(compressed.mimeType);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao processar a foto.');
    }
  };

  const handleLoadSamplePhoto = async () => {
    setErrorMsg(null);
    setRejectedFeedback(null);
    try {
      const sample = await imageUrlToDataUrl('/src/assets/images/hero_photo_quest_1795044146224.jpg');
      setSelectedPhoto(sample.dataUrl);
      setSelectedMimeType(sample.mimeType);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Falha ao carregar foto de exemplo.');
    }
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedPhoto) {
      setErrorMsg('Escolha uma foto da sua câmera antes de enviar para avaliação.');
      return;
    }

    setIsEvaluating(true);
    setErrorMsg(null);
    setRejectedFeedback(null);

    try {
      const response = await fetch('/api/evaluate-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedPhoto,
          mimeType: selectedMimeType,
          questTitle: quest.title,
          questDescription: quest.description,
          cameraTip: quest.cameraTip,
          styleTag: quest.styleTag,
          currentStyle,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao avaliar foto com o Tutor IA.');
      }

      const evaluation = data as PhotoEvaluationResult;
      if (!evaluation.approved) {
        setRejectedFeedback(evaluation);
        return;
      }

      await onCompleteQuest(quest.id, selectedPhoto, evaluation);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Não foi possível conectar com o Tutor IA.'
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quest-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
    >
      <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto bg-[#13151C] border border-white/12 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs text-amber-400 font-medium">
              {moduleTitle}
              <span className="mx-1.5 text-zinc-600" aria-hidden="true">
                ·
              </span>
              <span className="font-mono-num">+{quest.xpReward} XP</span>
            </p>
            <h2
              id="quest-modal-title"
              className="font-display text-xl sm:text-2xl font-bold text-zinc-50 leading-snug"
            >
              {quest.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal da missão"
            className="min-w-[44px] min-h-[44px] -mt-1 -mr-1 flex items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Objetivo da Missão */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-zinc-400">
            Objetivo da Missão
          </h3>
          <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
            {quest.description}
          </p>
        </div>

        {/* 2. Dica Rápida da Câmera Acrensly 8K */}
        <div className="rounded-xl bg-[#1A1D27] border border-amber-500/20 p-4 space-y-1.5">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
            <Lightbulb className="w-4 h-4 shrink-0" />
            <span>Dica rápida · Acrensly 8K (f=4.04mm · f/1.8)</span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{quest.cameraTip}</p>
        </div>

        {/* Locked State */}
        {quest.status === 'locked' && (
          <div className="rounded-xl bg-zinc-900/90 border border-white/8 p-4 flex items-center gap-3 text-sm text-zinc-400">
            <Lock className="w-5 h-5 text-zinc-500 shrink-0" />
            <span>
              Conclua a missão anterior na trilha para desbloquear este desafio fotográfico.
            </span>
          </div>
        )}

        {/* Unlocked Upload & Evaluation Flow */}
        {quest.status === 'unlocked' && (
          <div className="space-y-4">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 min-w-[200px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm transition-colors min-h-[48px] cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Enviar Foto da Missão</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadSamplePhoto}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl bg-[#1A1D27] hover:bg-[#232736] border border-white/10 text-zinc-200 text-xs font-medium min-h-[48px] transition-colors cursor-pointer"
                >
                  <ImagePlus className="w-4 h-4 text-purple-400" />
                  <span>Usar Foto de Exemplo</span>
                </button>
              </div>
            </div>

            {selectedPhoto && (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0A0B0F] max-h-64">
                  <img
                    src={selectedPhoto}
                    alt="Pré-visualização da foto enviada para a missão"
                    className="w-full h-full max-h-64 object-contain mx-auto"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSubmitEvaluation}
                  disabled={isEvaluating}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors min-h-[48px] cursor-pointer"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Tutor IA analisando luz, foco e enquadramento...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Avaliar Foto com Tutor IA</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {rejectedFeedback && (
              <div
                role="status"
                className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 space-y-2 text-sm"
              >
                <p className="font-semibold text-amber-300">
                  Quase lá! Vamos tentar outro clique:
                </p>
                <p className="text-zinc-200">{rejectedFeedback.mentorMessage}</p>
                <p className="text-zinc-300">
                  <span className="font-semibold text-zinc-100">Dica: </span>
                  {rejectedFeedback.suggestion}
                </p>
              </div>
            )}

            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-sm text-rose-200"
              >
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Completed State with Photo + AI Feedback */}
        {quest.status === 'completed' && (
          <div className="space-y-4">
            {quest.photoUrl && (
              <div className="rounded-xl overflow-hidden border border-white/10 bg-[#0A0B0F] max-h-64">
                <img
                  src={quest.photoUrl}
                  alt={`Foto enviada por Julia na missão ${quest.title}`}
                  className="w-full h-full max-h-64 object-contain mx-auto"
                />
              </div>
            )}

            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Missão Aprovada pelo Tutor IA</span>
              </div>

              <p className="text-sm text-zinc-100 leading-relaxed">{quest.aiMentorMessage}</p>

              <div className="grid grid-cols-1 gap-2.5 pt-2 border-t border-white/10 text-sm">
                <div>
                  <span className="font-semibold text-emerald-300">Ponto forte: </span>
                  <span className="text-zinc-300">{quest.aiStrength}</span>
                </div>
                <div>
                  <span className="font-semibold text-amber-300">Próximo passo: </span>
                  <span className="text-zinc-300">{quest.aiSuggestion}</span>
                </div>
              </div>

              {quest.aiDetectedTags?.length > 0 && (
                <p className="text-xs text-zinc-400 pt-1">
                  Tags detectadas: {quest.aiDetectedTags.join(' · ')}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => onAskTutorForCaption(quest)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1A1D27] hover:bg-[#232736] border border-white/10 text-zinc-100 font-medium text-sm transition-colors min-h-[48px] cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-purple-400" />
              <span>Criar legenda para o @juliaphoto no Tutor IA</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
