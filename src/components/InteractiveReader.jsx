import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  Square,
  Sparkles,
  BookOpen,
  Plus,
  Check,
  Eye,
  EyeOff,
  CheckCircle2,
  HelpCircle,
  Globe,
  Gauge,
  Mic,
  MicOff,
  AudioWaveform,
} from 'lucide-react';
import { INTERACTIVE_TEXTS, COMMON_DICTIONARY } from '../data/content';
import {
  speakText,
  stopSpeaking,
  createSpeechRecognition,
  evaluatePronunciation,
} from '../utils/speech';

export default function InteractiveReader({
  selectedLevel,
  flashcards,
  onAddFlashcard,
  onAwardXP,
  completedTexts,
  onCompleteText,
}) {
  const filteredTexts =
    selectedLevel === 'ALL'
      ? INTERACTIVE_TEXTS
      : INTERACTIVE_TEXTS.filter((t) => t.level === selectedLevel);

  const [activeTextId, setActiveTextId] = useState(
    (filteredTexts[0] || INTERACTIVE_TEXTS[0]).id
  );
  const activeText =
    INTERACTIVE_TEXTS.find((t) => t.id === activeTextId) || INTERACTIVE_TEXTS[0];

  const [showTranslations, setShowTranslations] = useState(true);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [accent, setAccent] = useState(activeText.accent || 'en-US');
  const [playingParagraphIdx, setPlayingParagraphIdx] = useState(null);
  const [selectedWordInfo, setSelectedWordInfo] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Estado de Shadowing por parágrafo
  const [shadowingParaIdx, setShadowingParaIdx] = useState(null);
  const [isRecordingShadow, setIsRecordingShadow] = useState(false);
  const [shadowResultsByPara, setShadowResultsByPara] = useState({});
  const recognitionRef = useRef(null);

  useEffect(() => {
    stopSpeaking();
    recognitionRef.current?.stop();
    setPlayingParagraphIdx(null);
    setSelectedWordInfo(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setShadowingParaIdx(null);
    setIsRecordingShadow(false);
    setShadowResultsByPara({});
    setAccent(activeText.accent || 'en-US');
  }, [activeTextId]);

  const handlePlayAll = () => {
    if (playingParagraphIdx !== null) {
      stopSpeaking();
      setPlayingParagraphIdx(null);
      return;
    }

    const playParagraph = (index) => {
      if (index >= activeText.paragraphs.length) {
        setPlayingParagraphIdx(null);
        return;
      }
      setPlayingParagraphIdx(index);
      speakText(activeText.paragraphs[index].en.replace(/🎵/g, ''), {
        rate: speechRate,
        accent,
        onEnd: () => playParagraph(index + 1),
      });
    };

    playParagraph(0);
  };

  const handlePlayParagraph = (index, customRate = speechRate) => {
    if (playingParagraphIdx === index) {
      stopSpeaking();
      setPlayingParagraphIdx(null);
      return;
    }
    setPlayingParagraphIdx(index);
    speakText(activeText.paragraphs[index].en.replace(/🎵/g, ''), {
      rate: customRate,
      accent,
      onEnd: () => setPlayingParagraphIdx(null),
    });
  };

  const handleToggleParagraphShadowing = (pIdx, paragraphText) => {
    if (isRecordingShadow && shadowingParaIdx === pIdx) {
      recognitionRef.current?.stop();
      setIsRecordingShadow(false);
      return;
    }

    setShadowingParaIdx(pIdx);
    const recognition = createSpeechRecognition({
      lang: accent,
      onResult: (transcript) => {
        const evaluation = evaluatePronunciation(paragraphText, transcript);
        setShadowResultsByPara((prev) => ({
          ...prev,
          [pIdx]: {
            transcript,
            ...evaluation,
          },
        }));
      },
      onError: () => setIsRecordingShadow(false),
      onEnd: () => setIsRecordingShadow(false),
    });

    if (!recognition) {
      alert(
        'Para treinar pronúncia por Shadowing, utilize o navegador Chrome ou Edge.'
      );
      return;
    }

    recognitionRef.current = recognition;
    setIsRecordingShadow(true);
    recognition.start();
  };

  const handleWordClick = (rawToken, paragraphSentence, paragraphTranslation) => {
    const cleanKey = rawToken
      .toLowerCase()
      .replace(/[^a-z']/g, '')
      .trim();
    if (!cleanKey) return;

    const curated = activeText.vocabulary[cleanKey];
    const common = COMMON_DICTIONARY[cleanKey];

    const info = curated
      ? {
          word: curated.word,
          phonetic: curated.phonetic,
          translation: curated.translation,
          partOfSpeech: curated.partOfSpeech,
          usageExplanation: `Bloco/expressão de nível ${activeText.level} usado em "${activeText.title}".`,
          example: curated.example || paragraphSentence,
          exampleTranslation: paragraphTranslation,
          isCurated: true,
        }
      : {
          word: cleanKey,
          phonetic: common?.phonetic || '/.../',
          translation:
            common?.translation ||
            'Expressão do contexto (salve o bloco ou a frase completa nos seus Flashcards)',
          partOfSpeech: 'Bloco Contextual',
          usageExplanation: 'Extraído diretamente da frase original do texto.',
          example: paragraphSentence,
          exampleTranslation: paragraphTranslation,
          isCurated: false,
        };

    setSelectedWordInfo(info);
    speakText(info.word, { rate: 0.95, accent });
  };

  const isWordInDeck = (word) => {
    if (!word) return false;
    return flashcards.some(
      (c) => c.word.toLowerCase().trim() === word.toLowerCase().trim()
    );
  };

  const handleSaveSelectedWord = () => {
    if (!selectedWordInfo) return;
    onAddFlashcard({
      word: selectedWordInfo.word,
      phonetic: selectedWordInfo.phonetic,
      translation: selectedWordInfo.translation,
      usageExplanation: selectedWordInfo.usageExplanation,
      example: selectedWordInfo.example.replace(/🎵/g, '').trim(),
      exampleTranslation:
        selectedWordInfo.exampleTranslation ||
        `Extraído de: "${activeText.title}"`,
      deck: 'Blocos da Leitura',
      level: activeText.level,
    });
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
    if (!completedTexts.includes(activeText.id)) {
      onCompleteText(activeText.id);
      onAwardXP(35, 'Leitura e interpretação concluídas! +35 XP');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Lista lateral de textos/músicas */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Biblioteca Interativa
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Toque nas expressões para ouvir, ver o uso em contexto e praticar Shadowing em cada parágrafo.
          </p>

          <div className="space-y-2.5">
            {filteredTexts.map((item) => {
              const isSelected = item.id === activeText.id;
              const isDone = completedTexts.includes(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTextId(item.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-950/50'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="text-2xl bg-slate-900 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-slate-800">
                    {item.coverEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300">
                        {item.level}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate">
                        {item.category}
                      </span>
                      {isDone && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100 truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Painel do Bloco/Palavra Clicada */}
        <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 sticky top-24">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Inspetor de Blocos & Expressões
            </span>
            {selectedWordInfo && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {selectedWordInfo.partOfSpeech}
              </span>
            )}
          </div>

          {selectedWordInfo ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-extrabold text-white">
                    “{selectedWordInfo.word}”
                  </h3>
                  <p className="text-xs font-mono text-indigo-300">
                    {selectedWordInfo.phonetic}
                  </p>
                </div>
                <button
                  onClick={() =>
                    speakText(selectedWordInfo.word, { rate: 0.9, accent })
                  }
                  className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow"
                  title="Ouvir pronúncia"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <p className="text-xs text-slate-400 mb-0.5">
                  Significado no contexto:
                </p>
                <p className="text-sm font-semibold text-emerald-300">
                  {selectedWordInfo.translation}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-400">
                    Frase completa de aplicação:
                  </p>
                  <button
                    onClick={() =>
                      speakText(selectedWordInfo.example, { rate: 0.95, accent })
                    }
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Volume2 className="w-3 h-3" /> Ouvir frase
                  </button>
                </div>
                <p className="text-xs text-slate-200 italic bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80">
                  "{selectedWordInfo.example}"
                </p>
              </div>

              <button
                onClick={handleSaveSelectedWord}
                disabled={isWordInDeck(selectedWordInfo.word)}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition ${
                  isWordInDeck(selectedWordInfo.word)
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                }`}
              >
                {isWordInDeck(selectedWordInfo.word) ? (
                  <>
                    <Check className="w-4 h-4" />
                    Já está nos seus Flashcards
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Salvar Bloco nos Flashcards (+10 XP)
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <p className="text-sm font-medium text-slate-300 mb-1">
                Toque em qualquer expressão do texto
              </p>
              <p className="text-xs">
                Os blocos sublinhados em{' '}
                <span className="text-indigo-400 underline decoration-dotted">
                  azul
                </span>{' '}
                destacam *phrasal verbs* e expressões reais de nativos!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Área Principal de Leitura, Áudio e Shadowing */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
          {/* Cabeçalho e controles de áudio */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Nível {activeText.level}
                </span>
                <span className="text-xs text-slate-400">
                  • {activeText.category} • ⏱️ {activeText.duration}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-white">
                {activeText.coverEmoji} {activeText.title}
              </h1>
              <p className="text-sm text-slate-400">{activeText.subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePlayAll}
                className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition shadow-lg ${
                  playingParagraphIdx !== null
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                }`}
              >
                {playingParagraphIdx !== null ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    Parar Áudio
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    Ouvir Texto Completo
                  </>
                )}
              </button>

              <button
                onClick={() => setShowTranslations((prev) => !prev)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition text-xs font-medium flex items-center gap-1.5"
                title="Mostrar/ocultar tradução linha a linha"
              >
                {showTranslations ? (
                  <>
                    <EyeOff className="w-4 h-4 text-indigo-400" />
                    Ocultar PT
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 text-indigo-400" />
                    Mostrar PT
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Barra de velocidade e sotaque */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 my-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-400">Velocidade da fala:</span>
              {[0.75, 1.0, 1.2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => setSpeechRate(rate)}
                  className={`px-2 py-1 rounded-md font-semibold transition ${
                    speechRate === rate
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-400">Sotaque:</span>
              {[
                { id: 'en-US', label: '🇺🇸 US' },
                { id: 'en-GB', label: '🇬🇧 UK' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setAccent(item.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    accent === item.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Parágrafos Interativos + Botão de Shadowing Integrado */}
          <div className="space-y-5 mt-4">
            {activeText.paragraphs.map((para, pIdx) => {
              const isPlayingThis = playingParagraphIdx === pIdx;
              const isShadowingThis =
                isRecordingShadow && shadowingParaIdx === pIdx;
              const shadowEval = shadowResultsByPara[pIdx];
              const tokens = para.en.split(' ');

              return (
                <div
                  key={pIdx}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isPlayingThis
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1.5 shrink-0 mt-1">
                      <button
                        onClick={() => handlePlayParagraph(pIdx)}
                        className={`p-2 rounded-lg transition ${
                          isPlayingThis
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800/90 text-slate-300 hover:bg-indigo-600 hover:text-white'
                        }`}
                        title="Ouvir este trecho"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() =>
                          handleToggleParagraphShadowing(pIdx, para.en)
                        }
                        className={`p-2 rounded-lg transition ${
                          isShadowingThis
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-slate-800/90 text-amber-300 hover:bg-amber-600 hover:text-white'
                        }`}
                        title="Praticar Shadowing (repetir no microfone)"
                      >
                        {isShadowingThis ? (
                          <MicOff className="w-4 h-4" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-2 flex-1">
                      <p className="text-lg leading-relaxed text-slate-100 font-medium">
                        {tokens.map((token, tIdx) => {
                          const clean = token
                            .toLowerCase()
                            .replace(/[^a-z']/g, '');
                          const isHighlighted = Boolean(
                            activeText.vocabulary[clean]
                          );
                          const isSelectedWord =
                            selectedWordInfo &&
                            clean &&
                            selectedWordInfo.word
                              .toLowerCase()
                              .includes(clean);

                          const shadowWordStatus =
                            shadowEval?.wordAnalysis?.[tIdx]?.status;

                          return (
                            <React.Fragment key={tIdx}>
                              <span
                                onClick={() =>
                                  handleWordClick(token, para.en, para.pt)
                                }
                                className={`cursor-pointer rounded px-0.5 transition-colors ${
                                  shadowWordStatus === 'correct'
                                    ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                                    : shadowWordStatus === 'missed'
                                    ? 'bg-rose-500/20 text-rose-300 underline decoration-wavy'
                                    : isSelectedWord
                                    ? 'bg-indigo-500 text-white font-semibold'
                                    : isHighlighted
                                    ? 'text-indigo-300 underline decoration-indigo-400/70 decoration-dotted underline-offset-4 hover:bg-indigo-500/20 font-semibold'
                                    : 'hover:bg-slate-800 hover:text-indigo-200'
                                }`}
                              >
                                {token}
                              </span>{' '}
                            </React.Fragment>
                          );
                        })}
                      </p>

                      {showTranslations && (
                        <p className="text-sm text-slate-400 border-l-2 border-slate-700 pl-3">
                          {para.pt}
                        </p>
                      )}

                      {/* Barra de ações rápidas do parágrafo (Shadowing lento + feedback) */}
                      <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handlePlayParagraph(pIdx, 0.75)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                        >
                          🐢 Ouvir 0.75x
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleToggleParagraphShadowing(pIdx, para.en)
                          }
                          className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 border ${
                            isShadowingThis
                              ? 'bg-rose-600/30 border-rose-500 text-rose-200'
                              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-300'
                          }`}
                        >
                          <AudioWaveform className="w-3.5 h-3.5" />
                          {isShadowingThis
                            ? 'Gravando... clique p/ parar'
                            : 'Treinar Shadowing'}
                        </button>
                      </div>

                      {shadowEval && (
                        <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-800 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-emerald-400">
                              🎙️ Precisão do Shadowing: {shadowEval.accuracy}%
                            </span>
                            <span className="text-slate-400 italic truncate max-w-xs">
                              Você disse: "{shadowEval.transcript}"
                            </span>
                          </div>
                          <p className="text-slate-300">{shadowEval.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quiz de Compreensão Rápida */}
        {activeText.quiz && activeText.quiz.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              Desafio de Compreensão
            </h3>

            <div className="space-y-5">
              {activeText.quiz.map((q, qIdx) => {
                const selectedOpt = quizAnswers[qIdx];
                return (
                  <div
                    key={qIdx}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
                  >
                    <p className="text-sm font-semibold text-slate-100">
                      {qIdx + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => {
                        const isPicked = selectedOpt === oIdx;
                        const isCorrect = q.correctIndex === oIdx;

                        let btnStyle =
                          'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';
                        if (quizSubmitted) {
                          if (isCorrect) {
                            btnStyle =
                              'bg-emerald-500/20 border-emerald-500 text-emerald-200 font-semibold';
                          } else if (isPicked && !isCorrect) {
                            btnStyle =
                              'bg-rose-500/20 border-rose-500 text-rose-200';
                          }
                        } else if (isPicked) {
                          btnStyle =
                            'bg-indigo-600/20 border-indigo-500 text-indigo-200 font-semibold';
                        }

                        return (
                          <button
                            key={oIdx}
                            disabled={quizSubmitted}
                            onClick={() =>
                              setQuizAnswers((prev) => ({
                                ...prev,
                                [qIdx]: oIdx,
                              }))
                            }
                            className={`w-full text-left p-3 rounded-lg border text-xs sm:text-sm transition flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {quizSubmitted && isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {quizSubmitted && (
                      <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-slate-300">
                        💡 <strong>Explicação:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!quizSubmitted ? (
              <button
                onClick={handleQuizSubmit}
                disabled={
                  Object.keys(quizAnswers).length < activeText.quiz.length
                }
                className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition shadow-lg shadow-emerald-600/20"
              >
                Verificar Respostas (+35 XP)
              </button>
            ) : (
              <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-medium">
                <span>🎉 Parabéns por concluir a leitura e o quiz!</span>
                <button
                  onClick={() => {
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                  }}
                  className="text-xs underline hover:text-emerald-200"
                >
                  Refazer Quiz
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
