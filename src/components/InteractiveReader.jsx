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
  X,
  FilePlus2,
  Trash2,
} from 'lucide-react';
import { INTERACTIVE_TEXTS, COMMON_DICTIONARY } from '../data/content';
import {
  speakText,
  speakWordByWord,
  stopSpeaking,
  createSpeechRecognition,
  evaluatePronunciation,
  generatePortuguesePhonetics,
} from '../utils/speech';

export default function InteractiveReader({
  selectedLevel,
  preferredAccent = 'en-US',
  onChangeAccent,
  flashcards,
  onAddFlashcard,
  onAwardXP,
  completedTexts,
  onCompleteText,
  customTexts = [],
  onAddCustomText,
  onDeleteCustomText,
  geminiApiKey = '',
}) {
  const allTexts = [...customTexts, ...INTERACTIVE_TEXTS];
  const filteredTexts =
    selectedLevel === 'ALL'
      ? allTexts
      : allTexts.filter((t) => t.level === selectedLevel);

  const [activeTextId, setActiveTextId] = useState(
    (filteredTexts[0] || allTexts[0]).id
  );
  const activeText =
    allTexts.find((t) => t.id === activeTextId) || allTexts[0];

  const [showTranslations, setShowTranslations] = useState(true);
  const [speechRate, setSpeechRate] = useState(0.85);
  const [accent, setAccent] = useState(
    activeText.accent || preferredAccent || 'en-US'
  );
  const [playingParagraphIdx, setPlayingParagraphIdx] = useState(null);
  const [activeParaWordIdx, setActiveParaWordIdx] = useState(-1);
  const [selectedWordInfo, setSelectedWordInfo] = useState(null);
  const [customWordTranslation, setCustomWordTranslation] = useState('');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Modal de Importar Música / Texto Próprio
  const [showImportModal, setShowImportModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Música / Letra');
  const [newLevel, setNewLevel] = useState('B1-B2');
  const [newEmoji, setNewEmoji] = useState('🎵');
  const [newEnglishRaw, setNewEnglishRaw] = useState('');
  const [newPortugueseRaw, setNewPortugueseRaw] = useState('');
  const [isTranslatingAI, setIsTranslatingAI] = useState(false);

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
    setAccent(activeText.accent || preferredAccent || 'en-US');
  }, [activeTextId]);

  const handlePlayAll = () => {
    if (playingParagraphIdx !== null) {
      stopSpeaking();
      setPlayingParagraphIdx(null);
      setActiveParaWordIdx(-1);
      return;
    }

    const playParagraph = (index) => {
      if (index >= activeText.paragraphs.length) {
        setPlayingParagraphIdx(null);
        setActiveParaWordIdx(-1);
        return;
      }
      setPlayingParagraphIdx(index);
      speakText(activeText.paragraphs[index].en.replace(/🎵/g, ''), {
        rate: speechRate,
        accent,
        onWordBoundary: (wIdx) => setActiveParaWordIdx(wIdx),
        onEnd: () => playParagraph(index + 1),
      });
    };

    playParagraph(0);
  };

  const handlePlayParagraph = (
    index,
    customRate = speechRate,
    wordByWord = false
  ) => {
    if (playingParagraphIdx === index && !wordByWord) {
      stopSpeaking();
      setPlayingParagraphIdx(null);
      setActiveParaWordIdx(-1);
      return;
    }
    setPlayingParagraphIdx(index);
    const cleanSentence = activeText.paragraphs[index].en.replace(/🎵/g, '');
    if (wordByWord) {
      speakWordByWord(cleanSentence, {
        accent,
        rate: 0.65,
        pauseMs: 360,
        onWordBoundary: (wIdx) => setActiveParaWordIdx(wIdx),
        onEnd: () => {
          setPlayingParagraphIdx(null);
          setActiveParaWordIdx(-1);
        },
      });
    } else {
      speakText(cleanSentence, {
        rate: customRate,
        accent,
        onWordBoundary: (wIdx) => setActiveParaWordIdx(wIdx),
        onEnd: () => {
          setPlayingParagraphIdx(null);
          setActiveParaWordIdx(-1);
        },
      });
    }
  };

  const handleToggleParagraphShadowing = (pIdx, paragraphText) => {
    if (isRecordingShadow && shadowingParaIdx === pIdx) {
      recognitionRef.current?.stop();
      setIsRecordingShadow(false);
      return;
    }

    if (isRecordingShadow) {
      recognitionRef.current?.stop();
    }

    let latestTranscript = '';
    setShadowingParaIdx(pIdx);

    const recognition = createSpeechRecognition({
      lang: accent,
      continuous: true,
      onResult: (transcript, isFinal) => {
        latestTranscript = transcript;
        const evaluation = evaluatePronunciation(paragraphText, transcript, {
          isInterim: !isFinal,
        });
        setShadowResultsByPara((prev) => ({
          ...prev,
          [pIdx]: {
            transcript,
            ...evaluation,
          },
        }));
      },
      onError: () => setIsRecordingShadow(false),
      onEnd: () => {
        setIsRecordingShadow(false);
        if (latestTranscript.trim()) {
          const finalEval = evaluatePronunciation(
            paragraphText,
            latestTranscript,
            { isInterim: false }
          );
          setShadowResultsByPara((prev) => ({
            ...prev,
            [pIdx]: {
              transcript: latestTranscript,
              ...finalEval,
            },
          }));
        }
      },
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

    const curated = activeText.vocabulary?.[cleanKey];
    const common =
      COMMON_DICTIONARY[cleanKey] ||
      COMMON_DICTIONARY[cleanKey.replace(/s$/, '')] ||
      COMMON_DICTIONARY[cleanKey.replace(/ed$/, '')];

    const displayWord = curated ? curated.word : cleanKey;
    const readablePhonetic = generatePortuguesePhonetics(displayWord);

    const info = curated
      ? {
          word: curated.word,
          phonetic: readablePhonetic,
          translation: curated.translation,
          partOfSpeech: curated.partOfSpeech,
          usageExplanation: `Bloco/expressão de nível ${activeText.level} usado em "${activeText.title}".`,
          example: curated.example || paragraphSentence,
          exampleTranslation: paragraphTranslation,
          isCurated: true,
        }
      : {
          word: cleanKey,
          phonetic: readablePhonetic,
          translation:
            common?.translation ||
            paragraphTranslation ||
            'Edite a tradução abaixo ou salve a frase completa',
          partOfSpeech: 'Bloco Contextual',
          usageExplanation: 'Extraído diretamente da frase original do texto.',
          example: paragraphSentence,
          exampleTranslation: paragraphTranslation,
          isCurated: false,
        };

    setSelectedWordInfo(info);
    setCustomWordTranslation(info.translation);
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
      translation:
        customWordTranslation.trim() || selectedWordInfo.translation,
      usageExplanation: selectedWordInfo.usageExplanation,
      example: selectedWordInfo.example.replace(/🎵/g, '').trim(),
      exampleTranslation:
        selectedWordInfo.exampleTranslation ||
        `Extraído de: "${activeText.title}"`,
      deck: 'Blocos da Leitura',
      level: activeText.level,
    });
  };

  const handleSaveFullSentenceChunk = () => {
    if (!selectedWordInfo) return;
    const cleanSentence = selectedWordInfo.example.replace(/🎵/g, '').trim();
    onAddFlashcard({
      word: cleanSentence,
      phonetic: '/Frase Completa/',
      translation:
        selectedWordInfo.exampleTranslation ||
        customWordTranslation.trim() ||
        selectedWordInfo.translation,
      usageExplanation: `Frase completa extraída de "${activeText.title}".`,
      example: cleanSentence,
      exampleTranslation:
        selectedWordInfo.exampleTranslation ||
        customWordTranslation.trim() ||
        `Contexto de "${activeText.title}"`,
      deck: 'Frases & Músicas',
      level: activeText.level,
    });
  };

  const handleAutoTranslateCustomText = async () => {
    const enLines = newEnglishRaw
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (enLines.length === 0) return;

    if (geminiApiKey && geminiApiKey.trim()) {
      setIsTranslatingAI(true);
      try {
        const prompt = `Traduza linha por linha do inglês para o português do Brasil de forma natural. Retorne APENAS as linhas traduzidas na mesma ordem, exatamente ${enLines.length} linhas:\n\n${enLines.join('\n')}`;
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
            geminiApiKey.trim()
          )}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );
        const data = await res.json();
        const translated =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (translated) {
          setNewPortugueseRaw(translated);
          setIsTranslatingAI(false);
          return;
        }
      } catch {
        // Fallback offline se a chamada falhar
      }
      setIsTranslatingAI(false);
    }

    // Fallback inteligente offline usando o dicionário local palavra por palavra
    const approxLines = enLines.map((line) => {
      const words = line.split(/\s+/);
      const translatedHints = words
        .map((w) => {
          const clean = w.toLowerCase().replace(/[^a-z']/g, '');
          return COMMON_DICTIONARY[clean]?.translation?.split('/')[0]?.trim();
        })
        .filter(Boolean);
      return translatedHints.length > 0
        ? `💡 Vocabulário-chave: ${translatedHints.slice(0, 5).join(' • ')}`
        : 'Toque nas palavras em inglês acima para ouvir e ver o significado.';
    });
    setNewPortugueseRaw(approxLines.join('\n'));
  };

  const handleCreateCustomTextSubmit = (e) => {
    e.preventDefault();
    const enLines = newEnglishRaw
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!newTitle.trim() || enLines.length === 0) return;

    const ptLines = newPortugueseRaw
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    const paragraphs = enLines.map((enLine, idx) => ({
      en: enLine,
      pt:
        ptLines[idx] ||
        'Toque em qualquer palavra desta linha para ouvir a pronúncia e salvar nos Flashcards.',
    }));

    const created = {
      id: `custom-${Date.now()}`,
      isCustom: true,
      title: newTitle.trim(),
      subtitle: 'Importado por você • Estudo Personalizado',
      category: newCategory,
      level: newLevel,
      accent: preferredAccent || 'en-US',
      duration: `${Math.max(1, Math.ceil(enLines.length / 3))} min`,
      coverEmoji: newEmoji,
      paragraphs,
      vocabulary: {},
      quiz: [],
    };

    if (onAddCustomText) {
      onAddCustomText(created);
    }
    setActiveTextId(created.id);
    setShowImportModal(false);
    setNewTitle('');
    setNewEnglishRaw('');
    setNewPortugueseRaw('');
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
          <div className="flex items-center justify-between gap-2 mb-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Biblioteca Interativa
            </h2>
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition shadow-md shadow-emerald-600/20 shrink-0"
              title="Colar letra de música, artigo ou diálogo em inglês"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              <span>+ Música / Texto</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Toque nas expressões para ouvir, ver o uso em contexto e praticar Shadowing, ou cole suas próprias músicas e textos!
          </p>

          <div className="space-y-2.5">
            {filteredTexts.map((item) => {
              const isSelected = item.id === activeText.id;
              const isDone = completedTexts.includes(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveTextId(item.id)}
                  className={`w-full cursor-pointer text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-950/50'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="text-2xl bg-slate-900 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-slate-800">
                    {item.coverEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300">
                        {item.level}
                      </span>
                      {item.isCustom && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Meu Texto
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 truncate">
                        {item.category}
                      </span>
                      {isDone && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />
                      )}
                      {item.isCustom && onDeleteCustomText && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteCustomText(item.id);
                            if (activeText.id === item.id) {
                              setActiveTextId(INTERACTIVE_TEXTS[0].id);
                            }
                          }}
                          className="ml-auto p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                          title="Excluir texto personalizado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100 truncate">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Painel do Bloco/Palavra Clicada (Desktop Sidebar) */}
        <div className="hidden lg:block bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 sticky top-24">
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
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-xl font-extrabold text-white break-words">
                    “{selectedWordInfo.word}”
                  </h3>
                  <p className="inline-block text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-lg mt-1">
                    🗣️ Como pronunciar: “
                    {generatePortuguesePhonetics(selectedWordInfo.word)}”
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      speakText(selectedWordInfo.word, { rate: 0.55, accent })
                    }
                    className="px-2 py-2 rounded-xl bg-emerald-600/25 border border-emerald-500/40 text-emerald-200 text-xs font-bold"
                    title="Ouvir bem devagar (0.55x)"
                  >
                    🐢 0.55x
                  </button>
                  <button
                    onClick={() =>
                      speakText(selectedWordInfo.word, { rate: 0.85, accent })
                    }
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow"
                    title="Ouvir pronúncia"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                <p className="text-xs text-slate-400">
                  Significado no contexto (você pode editar antes de salvar):
                </p>
                <input
                  type="text"
                  value={customWordTranslation}
                  onChange={(e) => setCustomWordTranslation(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs sm:text-sm font-semibold text-emerald-300 focus:outline-none focus:border-indigo-500"
                />
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

              <div className="space-y-2">
                <button
                  onClick={handleSaveSelectedWord}
                  disabled={isWordInDeck(selectedWordInfo.word)}
                  className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition ${
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
                      Salvar Expressão (+10 XP)
                    </>
                  )}
                </button>

                <button
                  onClick={handleSaveFullSentenceChunk}
                  disabled={isWordInDeck(
                    selectedWordInfo.example.replace(/🎵/g, '').trim()
                  )}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Salvar Frase Inteira como Bloco (+10 XP)
                </button>
              </div>
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
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6">
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
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                {activeText.coverEmoji} {activeText.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">{activeText.subtitle}</p>
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handlePlayAll}
                className={`px-3 sm:px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition shadow-lg ${
                  playingParagraphIdx !== null
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                }`}
              >
                {playingParagraphIdx !== null ? (
                  <>
                    <Square className="w-4 h-4 fill-current shrink-0" />
                    <span>Parar Áudio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 shrink-0" />
                    <span>Ouvir Tudo</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowTranslations((prev) => !prev)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition text-xs font-medium flex items-center justify-center gap-1.5"
                title="Mostrar/ocultar tradução linha a linha"
              >
                {showTranslations ? (
                  <>
                    <EyeOff className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Ocultar PT</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Mostrar PT</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Barra de velocidade e sotaque */}
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 my-4 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <Gauge className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-400">Velocidade:</span>
              {[
                { val: 0.55, label: '🐢 0.55x (Bem Lento)' },
                { val: 0.75, label: '0.75x (Didático)' },
                { val: 0.85, label: '0.85x (Calmo)' },
                { val: 1.0, label: '1.0x (Natural)' },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => setSpeechRate(item.val)}
                  className={`px-2 py-1 rounded-md font-semibold transition ${
                    speechRate === item.val
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              <span className="text-slate-400">Sotaque:</span>
              {[
                { id: 'en-US', label: '🇺🇸 US' },
                { id: 'en-GB', label: '🇬🇧 UK' },
                { id: 'en-AU', label: '🇦🇺 AU' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setAccent(item.id);
                    if (onChangeAccent) onChangeAccent(item.id);
                  }}
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
              const hasMusicNote = para.en.includes('🎵');
              const tokens = para.en
                .replace(/🎵/g, '')
                .trim()
                .split(/\s+/)
                .filter(Boolean);

              return (
                <div
                  key={pIdx}
                  className={`p-4 rounded-2xl border transition-colors space-y-3 overflow-hidden ${
                    isPlayingThis
                      ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md'
                      : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
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

                    <div className="space-y-2 flex-1 min-w-0">
                      <p className="text-base sm:text-lg leading-relaxed text-slate-100 font-medium break-words">
                        {hasMusicNote && (
                          <span className="mr-1.5 select-none" aria-hidden="true">
                            🎵
                          </span>
                        )}
                        {tokens.map((token, tIdx) => {
                          const clean = token
                            .toLowerCase()
                            .replace(/[^a-z']/g, '');
                          const isHighlighted = Boolean(
                            activeText.vocabulary?.[clean]
                          );
                          const isSelectedWord =
                            selectedWordInfo &&
                            clean &&
                            selectedWordInfo.word
                              .toLowerCase()
                              .includes(clean);

                          const shadowWordStatus =
                            shadowEval?.wordAnalysis?.[tIdx]?.status;
                          const isKaraokeActive =
                            isPlayingThis && activeParaWordIdx === tIdx;

                          return (
                            <React.Fragment key={tIdx}>
                              <span
                                onClick={() =>
                                  handleWordClick(token, para.en, para.pt)
                                }
                                className={`cursor-pointer rounded px-0.5 transition-colors ${
                                  isKaraokeActive
                                    ? 'bg-emerald-400 text-slate-950'
                                    : shadowWordStatus === 'correct'
                                    ? 'bg-emerald-500/25 text-emerald-200'
                                    : shadowWordStatus === 'close'
                                    ? 'bg-amber-500/25 text-amber-200'
                                    : shadowWordStatus === 'missed'
                                    ? 'bg-rose-500/25 text-rose-200 underline decoration-rose-400/80 underline-offset-4'
                                    : isSelectedWord
                                    ? 'bg-indigo-500 text-white'
                                    : isHighlighted
                                    ? 'text-indigo-300 underline decoration-indigo-400/70 decoration-dotted underline-offset-4 hover:bg-indigo-500/20'
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
                        <div className="space-y-1 border-l-2 border-slate-700 pl-3 min-w-0">
                          <p className="text-xs font-medium text-amber-300/90 break-words">
                            🗣️ Como soa: “{generatePortuguesePhonetics(para.en)}”
                          </p>
                          <p className="text-sm text-slate-400 break-words">
                            {para.pt}
                          </p>
                        </div>
                      )}

                      {/* Barra de ações rápidas do parágrafo (Shadowing lento + feedback) */}
                      <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handlePlayParagraph(pIdx, 0.55)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/30 font-semibold"
                        >
                          🐢 Bem Lento (0.55x)
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePlayParagraph(pIdx, 0.65, true)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 font-semibold"
                        >
                          🔍 Palavra por Palavra
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
                            ? 'Finalizar Gravação'
                            : 'Treinar Shadowing'}
                        </button>
                      </div>

                      {shadowEval && (
                        <div className="p-3 rounded-xl bg-slate-900/95 border border-slate-800 text-xs space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-bold text-emerald-400">
                              🎙️ Precisão do Shadowing: {shadowEval.accuracy}%
                            </span>
                            {isShadowingThis && (
                              <span className="text-[11px] text-rose-300 font-semibold animate-pulse">
                                ● Ouvindo sua voz... clique no microfone ao terminar
                              </span>
                            )}
                          </div>
                          {shadowEval.transcript && (
                            <p className="text-slate-400 italic break-words">
                              Você disse: “{shadowEval.transcript}”
                            </p>
                          )}
                          <p className="text-slate-300 break-words">
                            {shadowEval.feedback}
                          </p>
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

      {/* Bottom Sheet Flutuante no Mobile quando o usuário clica em uma palavra */}
      {selectedWordInfo && (
        <div className="lg:hidden fixed bottom-16 inset-x-3 z-40 bg-slate-900/95 backdrop-blur-md border border-indigo-500/50 rounded-2xl p-4 shadow-2xl space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-extrabold text-white">
                  “{selectedWordInfo.word}”
                </h3>
                <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                  🗣️ Como pronunciar: “
                  {generatePortuguesePhonetics(selectedWordInfo.word)}”
                </span>
              </div>
              <input
                type="text"
                value={customWordTranslation}
                onChange={(e) => setCustomWordTranslation(e.target.value)}
                className="w-full mt-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs font-semibold text-emerald-300"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() =>
                  speakText(selectedWordInfo.word, { rate: 0.55, accent })
                }
                className="px-2 py-2 rounded-xl bg-emerald-600/25 border border-emerald-500/40 text-emerald-200 text-xs font-bold"
                title="Ouvir bem devagar (0.55x)"
              >
                🐢 0.55x
              </button>
              <button
                onClick={() =>
                  speakText(selectedWordInfo.word, { rate: 0.9, accent })
                }
                className="p-2 rounded-xl bg-indigo-600 text-white"
                title="Ouvir pronúncia"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedWordInfo(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-300 italic bg-slate-950/70 p-2 rounded-lg border border-slate-800 line-clamp-2">
            "{selectedWordInfo.example}"
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSaveSelectedWord}
              disabled={isWordInDeck(selectedWordInfo.word)}
              className={`py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition ${
                isWordInDeck(selectedWordInfo.word)
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
              }`}
            >
              {isWordInDeck(selectedWordInfo.word) ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Salvo
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Salvar Palavra
                </>
              )}
            </button>

            <button
              onClick={handleSaveFullSentenceChunk}
              disabled={isWordInDeck(
                selectedWordInfo.example.replace(/🎵/g, '').trim()
              )}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-300 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Salvar Frase
            </button>
          </div>
        </div>
      )}

      {/* Modal de Importar Música, Artigo ou Diálogo Próprio */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                <FilePlus2 className="w-5 h-5 text-emerald-400" />
                Colar Minha Música, Texto ou Diálogo
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Cole qualquer letra de música, trecho de livro, notícia ou roteiro em inglês. O FluentFlow transformará cada linha/parágrafo em áudio interativo (`1.0x` e `0.75x`), dicionário ao toque e treino de **Shadowing**!
            </p>

            <form onSubmit={handleCreateCustomTextSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-6">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Título da Música ou Texto *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Coldplay - Yellow / Reunião de Sexta"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nível
                  </label>
                  <select
                    value={newLevel}
                    onChange={(e) => setNewLevel(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white"
                  >
                    <option value="A1-A2">A1-A2</option>
                    <option value="B1-B2">B1-B2</option>
                    <option value="C1-C2">C1-C2</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Ícone
                  </label>
                  <select
                    value={newEmoji}
                    onChange={(e) => setNewEmoji(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white"
                  >
                    <option value="🎵">🎵 Música</option>
                    <option value="📄">📄 Artigo</option>
                    <option value="🎬">🎬 Série/Filme</option>
                    <option value="💼">💼 Trabalho</option>
                    <option value="✈️">✈️ Viagem</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Letra ou Texto em Inglês (1 frase ou estrofe por linha) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={newEnglishRaw}
                  onChange={(e) => setNewEnglishRaw(e.target.value)}
                  placeholder={'Look at the stars, look how they shine for you\nAnd everything you do, yeah, they were all yellow...'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Tradução em Português (Opcional - 1 por linha)
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoTranslateCustomText}
                    disabled={!newEnglishRaw.trim() || isTranslatingAI}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-40 flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isTranslatingAI
                      ? 'Traduzindo...'
                      : 'Preencher dicas/tradução automática'}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={newPortugueseRaw}
                  onChange={(e) => setNewPortugueseRaw(e.target.value)}
                  placeholder={'Olhe para as estrelas, veja como elas brilham para você\nE tudo o que você faz...'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/25"
                >
                  Criar Lição Interativa (+15 XP)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
