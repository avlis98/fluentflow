import React, { useState, useMemo, useRef } from 'react';
import {
  BookOpen,
  Layers,
  MessageSquare,
  Flame,
  Trophy,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Target,
  Volume2,
  Lightbulb,
  Brain,
  Share2,
  Copy,
  UserCheck,
  X,
  Zap,
  Mic,
  MicOff,
  Globe,
  Plus,
  Wand2,
} from 'lucide-react';
import {
  LEVELS,
  INTERACTIVE_TEXTS,
  ROLEPLAY_SCENARIOS,
  analyzeUserEnglish,
} from '../data/content';
import { getSmartReviewQueue, calculateNextReview } from '../utils/srs';
import {
  speakText,
  generateProgressiveHint,
  createSpeechRecognition,
  evaluatePronunciation,
} from '../utils/speech';

const APP_SHARE_URL = 'https://avlis98.github.io/fluentflow/';

export default function Dashboard({
  userName,
  onEditProfile,
  preferredAccent = 'en-US',
  onChangeAccent,
  selectedLevel,
  onSelectLevel,
  onNavigate,
  xp,
  dailyGoal,
  streak,
  flashcards,
  completedTexts,
  customTexts = [],
  onUpdateFlashcard,
  onAddFlashcard,
  onAwardXP,
}) {
  const smartQueue = useMemo(
    () => getSmartReviewQueue(flashcards),
    [flashcards]
  );
  const dueCardsCount = smartQueue.length;
  const masteredCount = flashcards.filter(
    (c) => c.status === 'mastered' || (c.interval || 0) >= 7
  ).length;
  const learningCount = flashcards.filter(
    (c) =>
      (c.status === 'learning' || c.status === 'relearning') &&
      (c.interval || 0) < 7
  ).length;

  // Estado da Micro-Revisão Diária Integrada (Item 2.B e 2.C)
  const [quickHintLevel, setQuickHintLevel] = useState(0);
  const [quickRevealed, setQuickRevealed] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Estado do Desafio Express de 3 Minutos (Sprint de 5 Blocos)
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [sprintCards, setSprintCards] = useState([]);
  const [sprintIndex, setSprintIndex] = useState(0);
  const [sprintRevealed, setSprintRevealed] = useState(false);
  const [sprintHint, setSprintHint] = useState(0);
  const [isSprintRecording, setIsSprintRecording] = useState(false);
  const [sprintPronunciation, setSprintPronunciation] = useState(null);
  const [sprintScores, setSprintScores] = useState([]);
  const [sprintCompleted, setSprintCompleted] = useState(false);
  const sprintRecRef = useRef(null);

  // Estado do Laboratório Rápido de Frases (Correção & Upgrade Natural)
  const [labInput, setLabInput] = useState('');
  const [labAnalysis, setLabAnalysis] = useState(null);
  const [isLabRecording, setIsLabRecording] = useState(false);

  const urgentCard = smartQueue[0] || null;
  const progressPercent = Math.min(100, Math.round((xp / dailyGoal) * 100));
  const totalTextsCount = INTERACTIVE_TEXTS.length + customTexts.length;

  const handleStartSprint = () => {
    const pool =
      smartQueue.length >= 5
        ? smartQueue.slice(0, 5)
        : [
            ...smartQueue,
            ...flashcards.filter((c) => !smartQueue.some((s) => s.id === c.id)),
          ].slice(0, 5);
    setSprintCards(pool);
    setSprintIndex(0);
    setSprintRevealed(false);
    setSprintHint(0);
    setSprintPronunciation(null);
    setSprintScores([]);
    setSprintCompleted(false);
    setShowSprintModal(true);
  };

  const currentSprintCard = sprintCards[sprintIndex] || null;

  const handleSprintRecordVoice = () => {
    if (!currentSprintCard) return;
    if (isSprintRecording) {
      sprintRecRef.current?.stop();
      setIsSprintRecording(false);
      return;
    }

    const rec = createSpeechRecognition({
      lang: preferredAccent,
      onResult: (transcript) => {
        const result = evaluatePronunciation(currentSprintCard.word, transcript);
        setSprintPronunciation({ transcript, ...result });
        setSprintRevealed(true);
      },
      onError: () => setIsSprintRecording(false),
      onEnd: () => setIsSprintRecording(false),
    });

    if (!rec) {
      alert('Use o navegador Chrome ou Edge para falar pelo microfone.');
      return;
    }

    sprintRecRef.current = rec;
    setIsSprintRecording(true);
    rec.start();
  };

  const handleAdvanceSprint = (quality) => {
    if (!currentSprintCard) return;
    if (onUpdateFlashcard) {
      const updated = calculateNextReview(currentSprintCard, quality);
      onUpdateFlashcard(updated);
    }
    const accuracyScore =
      sprintPronunciation?.accuracy ?? (quality >= 2 ? 90 : 50);
    const nextScores = [...sprintScores, accuracyScore];
    setSprintScores(nextScores);

    if (sprintIndex + 1 >= sprintCards.length) {
      setSprintCompleted(true);
      if (onAwardXP) {
        onAwardXP(30, '⚡ Desafio Express de 3 Minutos concluído! +30 XP');
      }
    } else {
      setSprintIndex((prev) => prev + 1);
      setSprintRevealed(false);
      setSprintHint(0);
      setSprintPronunciation(null);
    }
  };

  const handleAnalyzeLabSentence = (e) => {
    e?.preventDefault();
    if (!labInput.trim()) return;
    const result = analyzeUserEnglish(labInput);
    setLabAnalysis(result);
    speakText(result?.betterWay || labInput, {
      rate: 0.95,
      accent: preferredAccent,
    });
  };

  const handleLabMic = () => {
    if (isLabRecording) {
      sprintRecRef.current?.stop();
      setIsLabRecording(false);
      return;
    }
    const rec = createSpeechRecognition({
      lang: preferredAccent,
      onResult: (transcript) => {
        setLabInput(transcript);
        const result = analyzeUserEnglish(transcript);
        setLabAnalysis(result);
      },
      onError: () => setIsLabRecording(false),
      onEnd: () => setIsLabRecording(false),
    });
    if (!rec) {
      alert('Use o Chrome ou Edge para ditar sua frase.');
      return;
    }
    sprintRecRef.current = rec;
    setIsLabRecording(true);
    rec.start();
  };

  const shareMessage = `🚀 ${userName ? `${userName} está` : 'Estou'} praticando inglês no FluentFlow!\n🔥 Ofensiva: ${streak} dias seguidos\n🏆 XP Acumulado: ${xp} XP\n🧠 Blocos de linguagem: ${flashcards.length} (${masteredCount} dominados)\n\nPratique grátis pelo celular ou PC:\n${APP_SHARE_URL}`;

  const handleNativeOrWhatsAppShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meu Progresso no FluentFlow',
          text: shareMessage,
          url: APP_SHARE_URL,
        });
        return;
      } catch {
        // Caso o usuário cancele o share nativo, mantém o modal aberto
      }
    }
    const waUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      if (onAwardXP) {
        onAwardXP(0, 'Card de conquista e link copiados! Cole no WhatsApp ou grupos.');
      }
    } catch {
      // fallback silencioso
    }
  };

  const handleQuickRate = (quality) => {
    if (!urgentCard || !onUpdateFlashcard) return;
    const updated = calculateNextReview(urgentCard, quality);
    onUpdateFlashcard(updated);
    if (onAwardXP) {
      onAwardXP(
        quality >= 2 ? 10 : 5,
        quality >= 2
          ? 'Revisão rápida concluída! +10 XP'
          : 'Agendado para reforço prioritário! +5 XP'
      );
    }
    setQuickHintLevel(0);
    setQuickRevealed(false);
  };

  return (
    <div className="space-y-8">
      {/* Banner Principal + Meta Diária */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-8 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Aprendizagem por Blocos → Recuperação Ativa → Shadowing & IA
              </div>
              {onEditProfile && (
                <button
                  onClick={onEditProfile}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-emerald-300 text-xs font-semibold transition"
                  title="Alterar seu nome de perfil neste aparelho"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  {userName ? `Perfil: ${userName}` : 'Definir meu nome'}
                </button>
              )}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {userName
                ? `Olá, ${userName}! Pronto para destravar seu inglês hoje?`
                : 'Pronto para destravar seu inglês hoje?'}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
              Aprenda frases completas usadas por nativos, recupere ativamente da memória, treine sua pronúncia por Shadowing e converse em cenários reais.
            </p>

            {/* Seletor de Nível + Sotaque Nativo */}
            <div className="pt-2 space-y-2.5">
              <div className="space-y-1.5 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 block sm:inline mr-1">
                  Filtrar por nível:
                </span>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
                  {LEVELS.map((lvl) => {
                    const active = selectedLevel === lvl.id;
                    return (
                      <button
                        key={lvl.id}
                        onClick={() => onSelectLevel(lvl.id)}
                        className={`px-3 py-2 sm:px-3.5 sm:py-1.5 rounded-xl text-xs font-bold transition border text-center ${
                          active
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
                            : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {lvl.label} ({lvl.badge})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  Sotaque de voz:
                </span>
                {[
                  { id: 'en-US', label: '🇺🇸 Americano' },
                  { id: 'en-GB', label: '🇬🇧 Britânico' },
                  { id: 'en-AU', label: '🇦🇺 Australiano' },
                ].map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => onChangeAccent && onChangeAccent(acc.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                      preferredAccent === acc.id
                        ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card de Progresso Diário */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Meta Diária</h3>
                  <p className="text-xs text-slate-400">
                    {xp} / {dailyGoal} XP conquistados
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-amber-400 font-bold text-sm">
                  <Flame className="w-4 h-4 fill-amber-400" />
                  {streak} dias
                </div>
                <div className="flex items-center gap-1 text-indigo-400 font-bold text-sm">
                  <Trophy className="w-4 h-4" />
                  {xp} XP
                </div>
              </div>
            </div>

            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
                <p className="text-lg font-extrabold text-white">
                  {flashcards.length}
                </p>
                <p className="text-[11px] text-slate-400">Blocos & Frases</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
                <p className="text-lg font-extrabold text-amber-400">
                  {learningCount}
                </p>
                <p className="text-[11px] text-slate-400">Aprendendo</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80">
                <p className="text-lg font-extrabold text-emerald-400">
                  {masteredCount}
                </p>
                <p className="text-[11px] text-slate-400">Dominados</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleStartSprint}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 transition shadow-lg shadow-amber-500/20"
              >
                <Zap className="w-4 h-4 fill-slate-950 shrink-0" />
                <span>Desafio 3 Min (+30 XP)</span>
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span>Compartilhar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Micro-Revisão Diária Integrada (Sem interromper o conteúdo novo) */}
      {urgentCard && (
        <div className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Dose Rápida de Recuperação Ativa (1 de {dueCardsCount} prioritários)
              </span>
            </div>
            <p className="text-sm text-slate-300">
              Como você diria em inglês:{' '}
              <strong className="text-emerald-300">
                “{urgentCard.translation}”
              </strong>
              ?
            </p>
            {quickHintLevel > 0 && !quickRevealed && (
              <p className="text-xs font-mono text-amber-200">
                💡 {generateProgressiveHint(urgentCard.word, quickHintLevel)}
              </p>
            )}
            {quickRevealed && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-white">
                    “{urgentCard.word}”
                  </span>
                  <button
                    onClick={() => speakText(urgentCard.example || urgentCard.word)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Ouvir
                  </button>
                </div>
                <p className="text-xs text-slate-400 italic">
                  "{urgentCard.example}"
                </p>
              </div>
            )}
          </div>

          <div className="w-full lg:w-auto shrink-0">
            {!quickRevealed ? (
              <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full">
                <button
                  onClick={() =>
                    setQuickHintLevel((prev) => Math.min(3, prev + 1))
                  }
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700"
                >
                  <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                  <span>Pista ({quickHintLevel}/3)</span>
                </button>
                <button
                  onClick={() => {
                    setQuickRevealed(true);
                    speakText(urgentCard.word);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold text-center"
                >
                  Conferir Resposta
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full">
                <button
                  onClick={() => handleQuickRate(0)}
                  className="px-2.5 py-2.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-bold text-center"
                >
                  Esqueci
                </button>
                <button
                  onClick={() => handleQuickRate(2)}
                  className="px-2.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold text-center"
                >
                  Lembrei (+10)
                </button>
                <button
                  onClick={() => handleQuickRate(3)}
                  className="px-2.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center"
                >
                  Já Domino
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Os 3 Pilares Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pilar 1: Leitura & Músicas Interativas */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-6 flex flex-col justify-between transition group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                {completedTexts.length}/{totalTextsCount} lidos
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition">
                1. Textos, Músicas & Shadowing
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Ouça em velocidade natural ou reduzida (`0.75x`), pratique **Shadowing** parágrafo por parágrafo e salve blocos de linguagem com 1 clique.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('reader')}
            className="mt-6 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-600/20"
          >
            Explorar Textos e Letras
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Pilar 2: Flashcards SM-2 */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 flex flex-col justify-between transition group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {dueCardsCount} prioritários hoje
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">
                2. Blocos, Recuperação Ativa & Pronúncia
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Repetição espaçada inteligente que prioriza erros, exercícios de **Recuperação Ativa** com pistas graduais e treino de **Shadowing**.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('flashcards')}
            className="mt-6 w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20"
          >
            Praticar Blocos ({dueCardsCount})
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Pilar 3: Roleplay & Conversação com IA */}
        <div className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-6 flex flex-col justify-between transition group">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <MessageSquare className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                {ROLEPLAY_SCENARIOS.length} cenários reais
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
                3. Roleplay & Conversação IA
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Simule situações reais falando pelo microfone ou digitando, receba sugestões de blocos naturais e repita em voz alta.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('roleplay')}
            className="mt-6 w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-amber-600/20"
          >
            Praticar Conversação
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Laboratório Rápido de Frases & Correção Instantânea */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-indigo-400" />
              Laboratório Rápido: Teste ou Corrija uma Frase em Inglês
            </h3>
            <p className="text-xs text-slate-400">
              Digite ou fale qualquer frase que queira usar no trabalho ou viagem para ouvir a pronúncia no sotaque escolhido e checar se soa natural.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleAnalyzeLabSentence}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
        >
          <div className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={handleLabMic}
              className={`p-2.5 rounded-xl border transition shrink-0 ${
                isLabRecording
                  ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-indigo-500'
              }`}
              title="Falar frase pelo microfone"
            >
              {isLabRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
            <input
              type="text"
              value={labInput}
              onChange={(e) => setLabInput(e.target.value)}
              placeholder='Ex: "I have a doubt about the meeting" ou "I want a coffee"'
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                labInput.trim() &&
                speakText(labInput, { rate: 0.95, accent: preferredAccent })
              }
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700"
            >
              <Volume2 className="w-4 h-4 text-indigo-400" />
              Ouvir
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
            >
              <Sparkles className="w-4 h-4" />
              Analisar Frase
            </button>
          </div>
        </form>

        {labAnalysis && (
          <div className="p-4 rounded-xl bg-slate-950/90 border border-indigo-500/30 space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-indigo-300 text-sm">
                {labAnalysis.title}
              </span>
              <button
                type="button"
                onClick={() =>
                  speakText(labAnalysis.betterWay, {
                    rate: 0.95,
                    accent: preferredAccent,
                  })
                }
                className="px-2.5 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 font-semibold flex items-center gap-1"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Ouvir versão natural
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {labAnalysis.explanation}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400 block">
                  Forma natural recomendada:
                </span>
                <span className="text-sm font-extrabold text-emerald-300">
                  “{labAnalysis.betterWay}”
                </span>
              </div>
              {onAddFlashcard && (
                <button
                  type="button"
                  onClick={() =>
                    onAddFlashcard(
                      labAnalysis.vocabToSave || {
                        word: labAnalysis.betterWay,
                        phonetic: '/Expressão Natural/',
                        translation: 'Frase natural revisada no Laboratório',
                        example: labAnalysis.betterWay,
                        deck: 'Laboratório de Frases',
                        level: 'B1-B2',
                      }
                    )
                  }
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Salvar nos Flashcards (+10 XP)
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Roteiro Recomendado de 15 Minutos */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4">
          ⚡ Ciclo Diário de Fluência (15 min/dia)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="font-bold text-white mb-0.5">
                1. Blocos em Contexto
              </p>
              <p className="text-slate-400">
                Leia um texto curto e salve expressões completas em vez de palavras isoladas.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white mb-0.5">
                2. Recuperação Ativa
              </p>
              <p className="text-slate-400">
                Tente produzir a frase em inglês com pistas graduais antes de revelar a resposta.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-bold text-white mb-0.5">
                3. Técnica Shadowing
              </p>
              <p className="text-slate-400">
                Ouça em `1.0x` ou `0.75x`, repita no microfone e compare sua pronúncia palavra por palavra.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-white mb-0.5">
                4. Aplicação no Roleplay
              </p>
              <p className="text-slate-400">
                Use as expressões aprendidas conversando nos cenários interativos com IA.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Card de Conquista Compartilhável */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                Card de Conquista FluentFlow
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Card Visual de Conquista (Pronto para Print ou Compartilhamento) */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950/90 border border-indigo-500/40 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center font-black text-white text-sm">
                    FF
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                      FluentFlow Studio
                    </p>
                    <p className="text-base font-extrabold text-white">
                      {userName || 'Estudante Dedicado'}
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                  Meta {progressPercent}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <p className="text-lg font-extrabold text-amber-400">
                    🔥 {streak}d
                  </p>
                  <p className="text-[10px] text-slate-400">Ofensiva</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <p className="text-lg font-extrabold text-indigo-300">
                    🏆 {xp}
                  </p>
                  <p className="text-[10px] text-slate-400">XP Total</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <p className="text-lg font-extrabold text-emerald-400">
                    🧠 {flashcards.length}
                  </p>
                  <p className="text-[10px] text-slate-400">Blocos</p>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>🌐 avlis98.github.io/fluentflow</span>
                <span className="text-emerald-300 font-semibold">100% Gratuito</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleNativeOrWhatsAppShare}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/25"
              >
                <Share2 className="w-4 h-4" />
                Enviar no WhatsApp / Compartilhar
              </button>

              <button
                onClick={handleCopyShare}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                Copiar Resumo + Link de Convite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal do Desafio Express de 3 Minutos (Sprint de 5 Blocos) */}
      {showSprintModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Zap className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    Desafio Express de 3 Minutos
                  </h3>
                  <p className="text-xs text-slate-400">
                    Escuta + Recuperação Ativa + Pronúncia no Microfone
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  sprintRecRef.current?.stop();
                  setIsSprintRecording(false);
                  setShowSprintModal(false);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!sprintCompleted && currentSprintCard ? (
              <div className="space-y-4">
                {/* Barra de Progresso do Sprint */}
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>
                    Bloco {sprintIndex + 1} de {sprintCards.length}
                  </span>
                  <span className="text-amber-300">
                    Recompensa Final: +30 XP
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-amber-400 transition-all duration-300"
                    style={{
                      width: `${Math.round(
                        ((sprintIndex + 1) / Math.max(1, sprintCards.length)) *
                          100
                      )}%`,
                    }}
                  />
                </div>

                {/* Pergunta de Recuperação Ativa */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                    Como você diria em inglês:
                  </span>
                  <p className="text-lg sm:text-xl font-extrabold text-emerald-300">
                    “{currentSprintCard.translation}”
                  </p>

                  {sprintHint > 0 && !sprintRevealed && (
                    <p className="text-xs font-mono text-amber-200 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                      💡 {generateProgressiveHint(currentSprintCard.word, sprintHint)}
                    </p>
                  )}

                  {sprintRevealed && (
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-extrabold text-white">
                          “{currentSprintCard.word}”
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              speakText(currentSprintCard.word, {
                                rate: 1.0,
                                accent: preferredAccent,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1"
                          >
                            <Volume2 className="w-3.5 h-3.5" /> 1.0x
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              speakText(currentSprintCard.word, {
                                rate: 0.75,
                                accent: preferredAccent,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                          >
                            🐢 0.75x
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 italic">
                        Exemplo: "{currentSprintCard.example}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Resultado de Pronúncia se o aluno falou no microfone */}
                {sprintPronunciation && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/40 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-400">
                        🎙️ Precisão da sua fala: {sprintPronunciation.accuracy}%
                      </span>
                      <span className="text-slate-400 italic">
                        Você disse: "{sprintPronunciation.transcript}"
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {sprintPronunciation.wordAnalysis?.map((item, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded-md font-bold ${
                            item.status === 'correct'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.status === 'close'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {item.word}
                        </span>
                      ))}
                    </div>
                    <p className="text-slate-300">{sprintPronunciation.feedback}</p>
                  </div>
                )}

                {/* Controles de Ação do Sprint */}
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSprintRecordVoice}
                      className={`py-3 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                        isSprintRecording
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300'
                      }`}
                    >
                      {isSprintRecording ? (
                        <>
                          <MicOff className="w-4 h-4" />
                          Parar Gravação
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          Falar no Microfone
                        </>
                      )}
                    </button>

                    {!sprintRevealed ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSprintRevealed(true);
                          speakText(currentSprintCard.word, {
                            rate: 1.0,
                            accent: preferredAccent,
                          });
                        }}
                        className="py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                      >
                        Revelar & Ouvir
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setSprintHint((prev) => Math.min(3, prev + 1))
                        }
                        disabled
                        className="py-3 px-3 rounded-xl bg-slate-800 text-emerald-300 font-bold text-xs opacity-70"
                      >
                        Resposta Revelada ✓
                      </button>
                    )}
                  </div>

                  {!sprintRevealed && (
                    <button
                      type="button"
                      onClick={() =>
                        setSprintHint((prev) => Math.min(3, prev + 1))
                      }
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      Pedir Pista Gradual ({sprintHint}/3)
                    </button>
                  )}

                  {sprintRevealed && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAdvanceSprint(0)}
                        className="py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-200 text-xs font-bold"
                      >
                        Difícil / Rever
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdvanceSprint(2)}
                        className="py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                      >
                        Acertei →
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdvanceSprint(3)}
                        className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                      >
                        Fácil / Domino →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-white">
                    Sprint de 3 Minutos Concluído! 🎉
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Você revisou e praticou {sprintCards.length} blocos prioritários e ganhou <strong>+30 XP</strong>!
                  </p>
                </div>
                {sprintScores.length > 0 && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 inline-block">
                    <span className="text-xs text-slate-400">
                      Desempenho médio da sessão:{' '}
                    </span>
                    <strong className="text-emerald-400 text-sm">
                      {Math.round(
                        sprintScores.reduce((a, b) => a + b, 0) /
                          sprintScores.length
                      )}
                      %
                    </strong>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowSprintModal(false)}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm"
                >
                  Concluir e Voltar ao Início
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
