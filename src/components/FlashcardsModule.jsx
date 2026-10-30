import React, { useState, useMemo, useRef } from 'react';
import {
  Layers,
  Volume2,
  RotateCcw,
  Plus,
  CheckCircle2,
  Brain,
  Headphones,
  Sparkles,
  X,
  Mic,
  MicOff,
  Lightbulb,
  Eye,
  Send,
  AudioWaveform,
  BookOpenCheck,
} from 'lucide-react';
import {
  speakText,
  createSpeechRecognition,
  evaluatePronunciation,
  generateProgressiveHint,
} from '../utils/speech';
import {
  calculateNextReview,
  getIntervalPreview,
  getSmartReviewQueue,
} from '../utils/srs';

export default function FlashcardsModule({
  preferredAccent = 'en-US',
  flashcards,
  onUpdateFlashcard,
  onAddFlashcard,
  onAwardXP,
}) {
  const [selectedDeck, setSelectedDeck] = useState('ALL');
  // Modos: 'srs' (Repetição Espaçada + Blocos), 'recall' (Recuperação Ativa), 'shadowing' (Técnica Shadowing), 'list' (Todos)
  const [mode, setMode] = useState('srs');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [includeFuturePractice, setIncludeFuturePractice] = useState(false);

  // Estado para Produção Pessoal do Bloco (Chunking)
  const [personalSentence, setPersonalSentence] = useState('');
  const [personalFeedback, setPersonalFeedback] = useState(null);
  const [isRecordingPersonal, setIsRecordingPersonal] = useState(false);

  // Estado para Recuperação Ativa (Active Recall)
  const [recallType, setRecallType] = useState('pt-to-en'); // 'pt-to-en' | 'audio' | 'cloze' | 'oral-prompt'
  const [typedAnswer, setTypedAnswer] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const [recallFeedback, setRecallFeedback] = useState(null);
  const [isRecordingRecall, setIsRecordingRecall] = useState(false);

  // Estado para Técnica Shadowing
  const [shadowTargetType, setShadowTargetType] = useState('example'); // 'example' | 'chunk'
  const [isShadowRecording, setIsShadowRecording] = useState(false);
  const [shadowTranscript, setShadowTranscript] = useState('');
  const [shadowResult, setShadowResult] = useState(null);

  // Modal de criar novo flashcard/bloco
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCardForm, setNewCardForm] = useState({
    word: '',
    translation: '',
    usageExplanation: '',
    example: '',
    deck: 'Meus Blocos',
    level: 'B1-B2',
  });

  const recognitionRef = useRef(null);

  const decks = useMemo(() => {
    const unique = Array.from(new Set(flashcards.map((c) => c.deck)));
    return ['ALL', ...unique];
  }, [flashcards]);

  const baseDeckCards = useMemo(() => {
    return selectedDeck === 'ALL'
      ? flashcards
      : flashcards.filter((c) => c.deck === selectedDeck);
  }, [flashcards, selectedDeck]);

  // Fila inteligente que prioriza esquecidos/vencidos e oculta dominados futuros
  const reviewQueue = useMemo(() => {
    return getSmartReviewQueue(baseDeckCards, { includeFuturePractice });
  }, [baseDeckCards, includeFuturePractice]);

  const activePool = mode === 'srs' ? reviewQueue : baseDeckCards;
  const currentCard =
    activePool[currentIndex % Math.max(1, activePool.length)] ||
    baseDeckCards[0];

  const resetCardInteractions = () => {
    setIsFlipped(false);
    setPersonalSentence('');
    setPersonalFeedback(null);
    setTypedAnswer('');
    setHintLevel(0);
    setRecallFeedback(null);
    setShadowTranscript('');
    setShadowResult(null);
  };

  const handleRateCard = (quality) => {
    if (!currentCard) return;
    const updated = calculateNextReview(currentCard, quality);
    onUpdateFlashcard(updated);
    onAwardXP(quality >= 2 ? 10 : 5);
    resetCardInteractions();
    setCurrentIndex((prev) => prev + 1);
  };

  // Exercício de Aplicação Pessoal do Bloco (Item 2.A)
  const handleCheckPersonalSentence = (e) => {
    e?.preventDefault();
    if (!currentCard || !personalSentence.trim()) return;
    const userLower = personalSentence.toLowerCase().trim();
    const coreWords = currentCard.word
      .toLowerCase()
      .replace(/[^a-z\s']/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const usedChunk =
      coreWords.length === 0 ||
      coreWords.some((cw) => userLower.includes(cw));

    if (usedChunk && personalSentence.trim().split(/\s+/).length >= 3) {
      setPersonalFeedback({
        ok: true,
        msg: `Excelente! Você aplicou o bloco "${currentCard.word}" em uma frase própria! (+15 XP)`,
      });
      onAwardXP(15, 'Frase própria criada com sucesso! +15 XP');
    } else {
      setPersonalFeedback({
        ok: false,
        msg: `Tente incluir a expressão "${currentCard.word}" dentro de uma frase completa (mínimo 3 palavras).`,
      });
    }
  };

  const toggleVoiceInput = (targetSetter, recordingStateSetter, onFinalCallback) => {
    if (recordingStateSetter === true) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = createSpeechRecognition({
      lang: preferredAccent,
      onResult: (transcript, isFinal) => {
        targetSetter(transcript);
        if (isFinal && onFinalCallback) {
          onFinalCallback(transcript);
        }
      },
      onError: () => recordingStateSetter(false),
      onEnd: () => recordingStateSetter(false),
    });

    if (!recognition) {
      alert('Reconhecimento de voz disponível no Google Chrome ou Microsoft Edge.');
      return;
    }

    recognitionRef.current = recognition;
    recordingStateSetter(true);
    recognition.start();
  };

  // Recuperação Ativa (Item 2.C)
  const clozeData = useMemo(() => {
    if (!currentCard) return { masked: '', target: '' };
    const example = currentCard.example || currentCard.word;
    const chunk = currentCard.word.replace(/[?.!]+$/, '').trim();
    const regex = new RegExp(chunk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (regex.test(example)) {
      return {
        masked: example.replace(regex, '_______'),
        target: chunk,
      };
    }
    return {
      masked: `Complete com a expressão: "${currentCard.exampleTranslation || currentCard.translation}"`,
      target: currentCard.word,
    };
  }, [currentCard]);

  const targetRecallPhrase =
    recallType === 'cloze' ? clozeData.target : currentCard?.word || '';

  const handleCheckRecall = (e) => {
    e?.preventDefault();
    if (!currentCard || !typedAnswer.trim()) return;

    const evalRes = evaluatePronunciation(targetRecallPhrase, typedAnswer);
    const isCorrect =
      evalRes.accuracy >= 70 ||
      typedAnswer
        .toLowerCase()
        .includes(
          currentCard.word
            .toLowerCase()
            .replace(/[^a-z\s]/g, '')
            .trim()
        );

    const updated = calculateNextReview(currentCard, isCorrect ? 2 : 0);
    onUpdateFlashcard(updated);

    setRecallFeedback({
      isCorrect,
      revealedOnly: false,
      accuracy: evalRes.accuracy,
      correctPhrase: currentCard.word,
      example: currentCard.example,
    });

    if (isCorrect) {
      onAwardXP(15, 'Recuperação ativa bem-sucedida! +15 XP');
    }
  };

  const handleRevealWithoutAttempt = () => {
    if (!currentCard) return;
    const updated = calculateNextReview(currentCard, 1);
    onUpdateFlashcard(updated);
    setRecallFeedback({
      isCorrect: false,
      revealedOnly: true,
      correctPhrase: currentCard.word,
      example: currentCard.example,
    });
  };

  // Técnica Shadowing (Item 2.D)
  const shadowSentence =
    shadowTargetType === 'example' && currentCard?.example
      ? currentCard.example
      : currentCard?.word || '';

  const handleStartShadowingMic = () => {
    if (isShadowRecording) {
      recognitionRef.current?.stop();
      setIsShadowRecording(false);
      return;
    }

    setShadowTranscript('');
    setShadowResult(null);

    const recognition = createSpeechRecognition({
      lang: preferredAccent,
      onResult: (transcript) => {
        setShadowTranscript(transcript);
        const result = evaluatePronunciation(shadowSentence, transcript);
        setShadowResult(result);
      },
      onError: () => setIsShadowRecording(false),
      onEnd: () => setIsShadowRecording(false),
    });

    if (!recognition) {
      alert('Para usar o microfone no Shadowing, abra no Chrome ou Edge.');
      return;
    }

    recognitionRef.current = recognition;
    setIsShadowRecording(true);
    recognition.start();
  };

  const handleCreateCustomCard = (e) => {
    e.preventDefault();
    if (!newCardForm.word.trim() || !newCardForm.translation.trim()) return;
    onAddFlashcard({
      word: newCardForm.word.trim(),
      phonetic: '/chunk/',
      translation: newCardForm.translation.trim(),
      usageExplanation:
        newCardForm.usageExplanation.trim() ||
        'Expressão personalizada adicionada ao seu repertório.',
      example:
        newCardForm.example.trim() ||
        `Let's practice using "${newCardForm.word.trim()}" in a real conversation.`,
      exampleTranslation: 'Frase de aplicação prática',
      deck: newCardForm.deck || 'Meus Blocos',
      level: newCardForm.level,
    });
    setNewCardForm({
      word: '',
      translation: '',
      usageExplanation: '',
      example: '',
      deck: 'Meus Blocos',
      level: 'B1-B2',
    });
    setShowAddModal(false);
  };

  const dueCount = baseDeckCards.filter(
    (c) => (c.nextReview || 0) <= Date.now() || c.status === 'relearning'
  ).length;

  return (
    <div className="space-y-6">
      {/* Barra de Topo: Modos Modernos de Aprendizagem */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">
              Blocos de Linguagem & Memorização Ativa
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {dueCount} prioritários hoje
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Aprenda frases completas em contexto, recupere ativamente da memória e treine pronúncia por Shadowing.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => {
              setMode('srs');
              resetCardInteractions();
            }}
            className={`px-3 py-2.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mode === 'srs'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Brain className="w-4 h-4 shrink-0" />
            <span className="truncate">Revisão (Chunks)</span>
          </button>

          <button
            onClick={() => {
              setMode('recall');
              resetCardInteractions();
            }}
            className={`px-3 py-2.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mode === 'recall'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <BookOpenCheck className="w-4 h-4 shrink-0" />
            <span className="truncate">Recuperação Ativa</span>
          </button>

          <button
            onClick={() => {
              setMode('shadowing');
              resetCardInteractions();
            }}
            className={`px-3 py-2.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mode === 'shadowing'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <AudioWaveform className="w-4 h-4 shrink-0" />
            <span className="truncate">Shadowing</span>
          </button>

          <button
            onClick={() => setMode('list')}
            className={`px-3 py-2.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              mode === 'list'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span className="truncate">Biblioteca ({baseDeckCards.length})</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="col-span-2 sm:col-span-1 px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Novo Bloco</span>
          </button>
        </div>
      </div>

      {/* Filtro de Decks */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {decks.map((d) => (
          <button
            key={d}
            onClick={() => {
              setSelectedDeck(d);
              setCurrentIndex(0);
              resetCardInteractions();
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${
              selectedDeck === d
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {d === 'ALL' ? '📚 Todos os Decks' : `🗂️ ${d}`}
          </button>
        ))}
      </div>

      {/* MODO 1: REPETIÇÃO ESPAÇADA INTELIGENTE + BLOCOS DE LINGUAGEM */}
      {mode === 'srs' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {reviewQueue.length === 0 ? (
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-extrabold text-white">
                Você concluiu todas as revisões agendadas para agora!
              </h3>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                O sistema inteligente ocultou os blocos que você já domina para evitar repetição desnecessária e focar no que realmente importa.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  onClick={() => setIncludeFuturePractice(true)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                >
                  Praticar blocos em aprendizado (Modo Extra)
                </button>
                <button
                  onClick={() => setMode('shadowing')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700"
                >
                  Ir para Treino de Shadowing
                </button>
              </div>
            </div>
          ) : (
            currentCard && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-1">
                  <span>
                    Fila prioritária: {reviewQueue.length} restantes • Deck:{' '}
                    <strong className="text-indigo-300">{currentCard.deck}</strong>
                  </span>
                  <span>
                    Tentativas: {currentCard.attempts || 0} (✅{' '}
                    {currentCard.correctCount || 0} | ❌{' '}
                    {currentCard.wrongCount || 0}) • Intervalo:{' '}
                    {currentCard.interval || 0}d
                  </span>
                </div>

                {/* Cartão de Bloco de Linguagem */}
                <div
                  onClick={() => setIsFlipped((prev) => !prev)}
                  className="cursor-pointer bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border-2 border-slate-800 hover:border-indigo-500/60 rounded-3xl p-5 sm:p-9 min-h-[300px] sm:min-h-[340px] flex flex-col justify-between transition-all shadow-2xl relative"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                        {currentCard.level} • {currentCard.deck}
                      </span>
                      {currentCard.status === 'relearning' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Prioridade: Reforço
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(
                            isFlipped && currentCard.example
                              ? currentCard.example
                              : currentCard.word,
                            { rate: 0.75 }
                          );
                        }}
                        className="px-2 sm:px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
                        title="Ouvir devagar (0.75x)"
                      >
                        🐢 0.75x
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(
                            isFlipped && currentCard.example
                              ? currentCard.example
                              : currentCard.word,
                            { rate: 0.95 }
                          );
                        }}
                        className="p-2.5 sm:p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/30"
                        title="Ouvir pronúncia natural"
                      >
                        <Volume2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {!isFlipped ? (
                    <div className="text-center my-6 sm:my-8 space-y-3">
                      <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold">
                        Bloco de Linguagem / Expressão
                      </p>
                      <h3 className="text-2xl sm:text-4xl font-extrabold text-white break-words">
                        “{currentCard.word}”
                      </h3>
                      <p className="text-sm font-mono text-slate-400">
                        {currentCard.phonetic}
                      </p>
                      <p className="text-xs text-slate-400 pt-4">
                        🧠 Tente lembrar o significado e uma frase com esta expressão antes de virar!
                      </p>
                    </div>
                  ) : (
                    <div
                      className="my-5 space-y-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div>
                        <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-0.5">
                          Tradução em Português
                        </p>
                        <h3 className="text-2xl font-extrabold text-emerald-300">
                          “{currentCard.translation}”
                        </h3>
                      </div>

                      {currentCard.usageExplanation && (
                        <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-100 leading-relaxed">
                          💡 <strong>Como e quando usar:</strong>{' '}
                          {currentCard.usageExplanation}
                        </div>
                      )}

                      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-indigo-300">
                            Aplicação Principal:
                          </span>
                          <button
                            onClick={() =>
                              speakText(currentCard.example, { rate: 0.95 })
                            }
                            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                          >
                            <Volume2 className="w-3.5 h-3.5" /> Ouvir frase
                          </button>
                        </div>
                        <p className="text-base font-medium text-white">
                          "{currentCard.example}"
                        </p>
                        {currentCard.exampleTranslation && (
                          <p className="text-xs text-slate-400">
                            🇧🇷 {currentCard.exampleTranslation}
                          </p>
                        )}
                      </div>

                      {/* Exemplos extras em situações reais */}
                      {currentCard.situations &&
                        currentCard.situations.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-slate-400">
                              Mais exemplos em situações reais:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {currentCard.situations.map((sit, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/90 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-indigo-300">
                                      {sit.context}
                                    </span>
                                    <button
                                      onClick={() => speakText(sit.en)}
                                      className="text-slate-400 hover:text-white"
                                    >
                                      <Volume2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <p className="text-slate-100 font-medium">
                                    "{sit.en}"
                                  </p>
                                  <p className="text-slate-400">{sit.pt}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Exercício para o aluno usar a frase em uma resposta própria */}
                      <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                        <p className="text-xs font-bold text-amber-300">
                          ✍️ Sua vez: {currentCard.practicePrompt || `Crie uma frase própria usando "${currentCard.word}":`}
                        </p>
                        <form
                          onSubmit={handleCheckPersonalSentence}
                          className="flex items-center gap-2"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              toggleVoiceInput(
                                setPersonalSentence,
                                setIsRecordingPersonal
                              )
                            }
                            className={`p-2.5 rounded-xl border transition shrink-0 ${
                              isRecordingPersonal
                                ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                                : 'bg-slate-900 border-slate-700 text-indigo-400 hover:bg-slate-800'
                            }`}
                            title="Falar sua resposta pelo microfone"
                          >
                            {isRecordingPersonal ? (
                              <MicOff className="w-4 h-4" />
                            ) : (
                              <Mic className="w-4 h-4" />
                            )}
                          </button>
                          <input
                            type="text"
                            value={personalSentence}
                            onChange={(e) => setPersonalSentence(e.target.value)}
                            placeholder={`Ex: ${currentCard.example}`}
                            className="min-w-0 flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                          />
                          <button
                            type="submit"
                            className="px-3 sm:px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shrink-0"
                          >
                            <Send className="w-3.5 h-3.5" /> Testar
                          </button>
                        </form>
                        {personalFeedback && (
                          <p
                            className={`text-xs font-medium ${
                              personalFeedback.ok
                                ? 'text-emerald-300'
                                : 'text-amber-300'
                            }`}
                          >
                            {personalFeedback.msg}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                    <span>Status: {currentCard.status || 'novo'}</span>
                    <span className="flex items-center gap-1 text-indigo-400">
                      <RotateCcw className="w-3.5 h-3.5" /> Virar cartão
                    </span>
                  </div>
                </div>

                {/* Botões de Avaliação SM-2 */}
                {isFlipped ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        q: 0,
                        label: 'Esqueci / Errei',
                        color:
                          'bg-rose-950/70 hover:bg-rose-900 border-rose-500/40 text-rose-200',
                      },
                      {
                        q: 1,
                        label: 'Difícil',
                        color:
                          'bg-amber-950/70 hover:bg-amber-900 border-amber-500/40 text-amber-200',
                      },
                      {
                        q: 2,
                        label: 'Bom',
                        color:
                          'bg-indigo-950/70 hover:bg-indigo-900 border-indigo-500/40 text-indigo-200',
                      },
                      {
                        q: 3,
                        label: 'Fácil (Dominado)',
                        color:
                          'bg-emerald-950/70 hover:bg-emerald-900 border-emerald-500/40 text-emerald-200',
                      },
                    ].map((btn) => (
                      <button
                        key={btn.q}
                        onClick={() => handleRateCard(btn.q)}
                        className={`p-3.5 rounded-2xl border font-bold transition flex flex-col items-center gap-1 ${btn.color}`}
                      >
                        <span className="text-sm">{btn.label}</span>
                        <span className="text-[11px] opacity-80 font-normal">
                          Revisar em {getIntervalPreview(currentCard, btn.q)}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => setIsFlipped(true)}
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/25"
                  >
                    Já tentei lembrar → Mostrar Resposta
                  </button>
                )}
              </>
            )
          )}
        </div>
      )}

      {/* MODO 2: RECUPERAÇÃO ATIVA DA MEMÓRIA (Item 2.C) */}
      {mode === 'recall' && currentCard && (
        <div className="max-w-2xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-8 space-y-5 sm:space-y-6">
          {/* Seletor de tipo de estímulo de recuperação ativa */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              Tipo de Recuperação Ativa:
            </span>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 w-full sm:w-auto">
              {[
                { id: 'pt-to-en', label: '🇧🇷 Tradução → Inglês' },
                { id: 'audio', label: '🎧 Escuta Cega (Áudio)' },
                { id: 'cloze', label: '🧩 Completar Lacuna' },
                { id: 'oral-prompt', label: '🗣️ Resposta Livre' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setRecallType(t.id);
                    resetCardInteractions();
                  }}
                  className={`px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold transition text-center ${
                    recallType === t.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estímulo conforme o modo selecionado */}
          <div className="text-center space-y-3 py-2">
            {recallType === 'pt-to-en' && (
              <>
                <p className="text-xs text-slate-400">
                  Como um falante nativo expressa esta ideia em inglês?
                </p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-300">
                  “{currentCard.translation}”
                </h3>
                {currentCard.usageExplanation && (
                  <p className="text-xs text-slate-400 max-w-lg mx-auto">
                    Contexto: {currentCard.usageExplanation}
                  </p>
                )}
              </>
            )}

            {recallType === 'audio' && (
              <>
                <p className="text-xs text-slate-400">
                  Ouça o áudio sem ler e tente recuperar exatamente o que foi dito:
                </p>
                <div className="flex justify-center gap-3 py-2">
                  <button
                    type="button"
                    onClick={() => speakText(currentCard.word, { rate: 1.0 })}
                    className="px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 shadow-lg"
                  >
                    <Volume2 className="w-5 h-5" />
                    Ouvir Áudio (1.0x)
                  </button>
                  <button
                    type="button"
                    onClick={() => speakText(currentCard.word, { rate: 0.72 })}
                    className="px-4 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700"
                  >
                    🐢 Lento (0.75x)
                  </button>
                </div>
              </>
            )}

            {recallType === 'cloze' && (
              <>
                <p className="text-xs text-slate-400">
                  Complete a frase abaixo com o bloco de linguagem correto:
                </p>
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <p className="text-lg sm:text-xl font-bold text-white">
                    “{clozeData.masked}”
                  </p>
                  <p className="text-xs text-emerald-300 mt-1">
                    🇧🇷 {currentCard.exampleTranslation || currentCard.translation}
                  </p>
                </div>
              </>
            )}

            {recallType === 'oral-prompt' && (
              <>
                <p className="text-xs text-slate-400">
                  Produza uma frase completa sem consultar exemplos:
                </p>
                <h3 className="text-lg sm:text-xl font-bold text-amber-300">
                  {currentCard.practicePrompt ||
                    `Forme uma frase aplicando a ideia de: "${currentCard.translation}"`}
                </h3>
              </>
            )}
          </div>

          {/* Pistas Graduais (Progressive Hints) */}
          {hintLevel > 0 && !recallFeedback && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs font-mono text-center">
              💡 Pista ({hintLevel}/3):{' '}
              {generateProgressiveHint(targetRecallPhrase, hintLevel)}
            </div>
          )}

          {/* Campo de Resposta (Escrita ou Falada) */}
          <form onSubmit={handleCheckRecall} className="space-y-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  toggleVoiceInput(setTypedAnswer, setIsRecordingRecall)
                }
                className={`p-3.5 rounded-xl border transition shrink-0 ${
                  isRecordingRecall
                    ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700'
                }`}
                title="Responder falando no microfone"
              >
                {isRecordingRecall ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              <input
                type="text"
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder={
                  isRecordingRecall
                    ? '🎙️ Fale sua resposta em inglês...'
                    : 'Digite ou fale no microfone...'
                }
                className="min-w-0 flex-1 px-3.5 sm:px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm sm:text-base font-semibold"
              />
            </div>

            {!recallFeedback ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={hintLevel >= 3}
                    onClick={() => setHintLevel((prev) => Math.min(3, prev + 1))}
                    className="px-3 sm:px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <Lightbulb className="w-4 h-4 shrink-0" />
                    <span>Pista ({hintLevel}/3)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRevealWithoutAttempt}
                    className="px-3 sm:px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <Eye className="w-4 h-4 shrink-0" />
                    <span>Revelar</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!typedAnswer.trim()}
                  className="w-full sm:w-auto px-6 py-3 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-sm transition shadow-lg shadow-emerald-600/20"
                >
                  Confirmar Tentativa
                </button>
              </div>
            ) : (
              <div
                className={`p-5 rounded-2xl border space-y-3 ${
                  recallFeedback.isCorrect
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-100'
                    : 'bg-amber-950/50 border-amber-500/40 text-amber-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm">
                    {recallFeedback.isCorrect
                      ? '✅ Excelente recuperação ativa! Você lembrou por conta própria!'
                      : recallFeedback.revealedOnly
                      ? '👀 Resposta revelada (agendado para revisão em breve):'
                      : '💡 Boa tentativa! Compare com o bloco original:'}
                  </p>
                  <button
                    type="button"
                    onClick={() => speakText(currentCard.example || currentCard.word)}
                    className="px-3 py-1 rounded-lg bg-slate-900 text-indigo-300 text-xs font-semibold flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Ouvir
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <p className="text-base font-extrabold text-white">
                    “{recallFeedback.correctPhrase}”
                  </p>
                  <p className="text-xs text-slate-300">
                    Exemplo: "{recallFeedback.example}"
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetCardInteractions();
                    setCurrentIndex((prev) => prev + 1);
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                >
                  Próximo Desafio →
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* MODO 3: TÉCNICA SHADOWING (Item 2.D) */}
      {mode === 'shadowing' && currentCard && (
        <div className="max-w-2xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-8 space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <AudioWaveform className="w-4 h-4 shrink-0" />
                Técnica Shadowing (Escutar, Imitar e Comparar)
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                1. Ouça o modelo nativo → 2. Repita em voz alta → 3. Veja sua precisão palavra por palavra.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => {
                  setShadowTargetType('example');
                  setShadowResult(null);
                }}
                className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold text-center ${
                  shadowTargetType === 'example'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                Frase Completa
              </button>
              <button
                onClick={() => {
                  setShadowTargetType('chunk');
                  setShadowResult(null);
                }}
                className={`px-3 py-2 sm:py-1.5 rounded-xl text-xs font-semibold text-center ${
                  shadowTargetType === 'chunk'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                Apenas o Bloco
              </button>
            </div>
          </div>

          {/* Frase Modelo com Destaque Fonético de Palavras */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
            <p className="text-xs text-slate-400">
              Clique em qualquer palavra para ouvir isoladamente:
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xl sm:text-2xl font-extrabold">
              {(shadowResult
                ? shadowResult.wordAnalysis
                : shadowSentence.split(/\s+/).map((w) => ({
                    word: w,
                    status: 'neutral',
                  }))
              ).map((item, idx) => {
                let colorClass = 'text-white hover:text-indigo-300';
                if (item.status === 'correct') {
                  colorClass =
                    'text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 rounded-lg';
                } else if (item.status === 'close') {
                  colorClass =
                    'text-amber-300 bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 rounded-lg';
                } else if (item.status === 'missed') {
                  colorClass =
                    'text-rose-300 bg-rose-500/15 border border-rose-500/40 px-2 py-0.5 rounded-lg underline decoration-wavy';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      speakText(item.word.replace(/[^a-zA-Z']/g, ''), {
                        rate: 0.85,
                      })
                    }
                    className={`transition ${colorClass}`}
                    title="Clique para ouvir esta palavra"
                  >
                    {item.word}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-400 pt-1">
              🇧🇷{' '}
              {shadowTargetType === 'example'
                ? currentCard.exampleTranslation || currentCard.translation
                : currentCard.translation}
            </p>
          </div>

          {/* Passos 1, 2, 3 e 4 do Shadowing */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => speakText(shadowSentence, { rate: 1.0 })}
              className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex flex-col items-center gap-1.5 border border-slate-700 transition"
            >
              <Volume2 className="w-5 h-5 text-indigo-400" />
              <span>1. Ouvir Natural (1.0x)</span>
            </button>

            <button
              type="button"
              onClick={() => speakText(shadowSentence, { rate: 0.72 })}
              className="p-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex flex-col items-center gap-1.5 border border-slate-700 transition"
            >
              <Headphones className="w-5 h-5 text-amber-400" />
              <span>2. Velocidade Reduzida (0.75x)</span>
            </button>

            <button
              type="button"
              onClick={handleStartShadowingMic}
              className={`p-4 rounded-2xl font-bold text-xs flex flex-col items-center gap-1.5 border transition ${
                isShadowRecording
                  ? 'bg-rose-600 border-rose-400 text-white animate-pulse shadow-lg shadow-rose-600/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-600/30'
              }`}
            >
              {isShadowRecording ? (
                <>
                  <MicOff className="w-5 h-5" />
                  <span>Ouvindo... (Clique p/ parar)</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>3. Repetir no Microfone</span>
                </>
              )}
            </button>
          </div>

          {/* Resultado da Comparação de Pronúncia */}
          {shadowResult && (
            <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">
                    O que identificamos na sua fala:
                  </span>
                  <p className="text-sm font-semibold text-indigo-200 italic">
                    “{shadowTranscript || '...'}”
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400">
                    {shadowResult.accuracy}%
                  </span>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                    Precisão
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 bg-slate-900 p-3 rounded-xl border border-slate-800">
                🎙️ <strong>Análise de Pronúncia:</strong> {shadowResult.feedback}
              </p>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="text-emerald-300">● Verde: Exato</span>
                  <span className="text-amber-300">● Amarelo: Próximo</span>
                  <span className="text-rose-300">● Vermelho: Repetir</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (shadowResult.accuracy >= 75) {
                      onAwardXP(20, 'Ótimo treino de Shadowing! +20 XP');
                    }
                    resetCardInteractions();
                    setCurrentIndex((prev) => prev + 1);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                >
                  Próxima Frase →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODO 4: BIBLIOTECA COMPLETA DE BLOCOS */}
      {mode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {baseDeckCards.map((card) => (
            <div
              key={card.id}
              className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300">
                    {card.deck}
                  </span>
                  <button
                    onClick={() => speakText(card.word)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white transition"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="text-base font-bold text-white">“{card.word}”</h4>
                <p className="text-xs text-emerald-300 font-medium mt-0.5">
                  {card.translation}
                </p>
                {card.usageExplanation && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    💡 {card.usageExplanation}
                  </p>
                )}
                <p className="text-xs text-slate-300 italic mt-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  "{card.example}"
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Acertos: {card.correctCount || 0} • Erros: {card.wrongCount || 0}
                </span>
                <span>Intervalo: {card.interval || 0}d</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL PARA ADICIONAR NOVO BLOCO DE LINGUAGEM */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Novo Bloco de Linguagem (Chunk)
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomCard} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Frase ou Bloco em Inglês *
                </label>
                <input
                  type="text"
                  required
                  value={newCardForm.word}
                  onChange={(e) =>
                    setNewCardForm({ ...newCardForm, word: e.target.value })
                  }
                  placeholder="Ex: Would you mind if I...?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tradução para Português *
                </label>
                <input
                  type="text"
                  required
                  value={newCardForm.translation}
                  onChange={(e) =>
                    setNewCardForm({
                      ...newCardForm,
                      translation: e.target.value,
                    })
                  }
                  placeholder="Ex: Você se importaria se eu...?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Explicação simples de uso
                </label>
                <input
                  type="text"
                  value={newCardForm.usageExplanation}
                  onChange={(e) =>
                    setNewCardForm({
                      ...newCardForm,
                      usageExplanation: e.target.value,
                    })
                  }
                  placeholder="Ex: Usado para pedir permissão de forma educada"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Exemplo em situação real
                </label>
                <input
                  type="text"
                  value={newCardForm.example}
                  onChange={(e) =>
                    setNewCardForm({ ...newCardForm, example: e.target.value })
                  }
                  placeholder="Ex: Would you mind if I opened the window?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Deck / Categoria
                  </label>
                  <input
                    type="text"
                    value={newCardForm.deck}
                    onChange={(e) =>
                      setNewCardForm({ ...newCardForm, deck: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nível
                  </label>
                  <select
                    value={newCardForm.level}
                    onChange={(e) =>
                      setNewCardForm({ ...newCardForm, level: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="A1-A2">A1-A2 (Básico)</option>
                    <option value="B1-B2">B1-B2 (Intermediário)</option>
                    <option value="C1-C2">C1-C2 (Avançado)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Salvar Bloco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
