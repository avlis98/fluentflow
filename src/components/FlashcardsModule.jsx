import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { speakText } from '../utils/speech';
import { calculateNextReview, getIntervalPreview } from '../utils/srs';

export default function FlashcardsModule({
  flashcards,
  onUpdateFlashcard,
  onAddFlashcard,
  onAwardXP,
}) {
  const [selectedDeck, setSelectedDeck] = useState('ALL');
  const [mode, setMode] = useState('srs'); // 'srs' | 'listening' | 'list'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Estado para modo Ditado/Listening
  const [typedAnswer, setTypedAnswer] = useState('');
  const [listeningFeedback, setListeningFeedback] = useState(null);

  // Modal de criar novo flashcard
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCardForm, setNewCardForm] = useState({
    word: '',
    translation: '',
    example: '',
    deck: 'Meus Cards',
    level: 'B1-B2',
  });

  const decks = useMemo(() => {
    const unique = Array.from(new Set(flashcards.map((c) => c.deck)));
    return ['ALL', ...unique];
  }, [flashcards]);

  const filteredCards = useMemo(() => {
    const base =
      selectedDeck === 'ALL'
        ? flashcards
        : flashcards.filter((c) => c.deck === selectedDeck);

    // Ordena priorizando os que estão vencidos (due) no algoritmo SM-2
    return [...base].sort((a, b) => (a.nextReview || 0) - (b.nextReview || 0));
  }, [flashcards, selectedDeck]);

  const currentCard = filteredCards[currentIndex] || filteredCards[0];

  const handleRateCard = (quality) => {
    if (!currentCard) return;
    const updated = calculateNextReview(currentCard, quality);
    onUpdateFlashcard(updated);
    onAwardXP(quality >= 2 ? 10 : 5);
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, filteredCards.length));
  };

  const handleCheckListening = (e) => {
    e.preventDefault();
    if (!currentCard || !typedAnswer.trim()) return;
    const cleanTarget = currentCard.word.toLowerCase().trim();
    const cleanUser = typedAnswer.toLowerCase().trim();
    const isCorrect =
      cleanUser === cleanTarget || cleanTarget.includes(cleanUser);

    setListeningFeedback({
      isCorrect,
      correctWord: currentCard.word,
      translation: currentCard.translation,
    });
    if (isCorrect) {
      onAwardXP(15, 'Ótimo ouvido! +15 XP');
    }
  };

  const handleNextListening = () => {
    setTypedAnswer('');
    setListeningFeedback(null);
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, filteredCards.length));
  };

  const handleCreateCustomCard = (e) => {
    e.preventDefault();
    if (!newCardForm.word.trim() || !newCardForm.translation.trim()) return;
    onAddFlashcard({
      word: newCardForm.word.trim(),
      phonetic: '/custom/',
      translation: newCardForm.translation.trim(),
      example:
        newCardForm.example.trim() ||
        `Practice sentence with "${newCardForm.word.trim()}".`,
      exampleTranslation: 'Criado manualmente pelo usuário',
      deck: newCardForm.deck || 'Meus Cards',
      level: newCardForm.level,
    });
    setNewCardForm({
      word: '',
      translation: '',
      example: '',
      deck: 'Meus Cards',
      level: 'B1-B2',
    });
    setShowAddModal(false);
  };

  const dueCount = filteredCards.filter(
    (c) => (c.nextReview || 0) <= Date.now()
  ).length;

  return (
    <div className="space-y-6">
      {/* Barra de Topo: Filtros de Deck, Modo de Estudo e Botão Novo Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">
              Flashcards Inteligentes (SM-2)
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {dueCount} para revisar hoje
            </span>
          </div>
          <p className="text-xs text-slate-400">
            O algoritmo agenda automaticamente cada cartão com base na facilidade com que você se lembra.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setMode('srs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              mode === 'srs'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Brain className="w-4 h-4" />
            Repetição Espaçada
          </button>

          <button
            onClick={() => {
              setMode('listening');
              setListeningFeedback(null);
              setTypedAnswer('');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              mode === 'listening'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Headphones className="w-4 h-4" />
            Treino de Escuta (Ditado)
          </button>

          <button
            onClick={() => setMode('list')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              mode === 'list'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Ver Todos ({filteredCards.length})
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            Novo Card
          </button>
        </div>
      </div>

      {/* Filtro de Decks */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {decks.map((d) => (
          <button
            key={d}
            onClick={() => {
              setSelectedDeck(d);
              setCurrentIndex(0);
              setIsFlipped(false);
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

      {/* MODO 1: REPETIÇÃO ESPAÇADA (SM-2) */}
      {mode === 'srs' && currentCard && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Cartão {currentIndex + 1} de {filteredCards.length} • Deck:{' '}
              <strong className="text-indigo-300">{currentCard.deck}</strong>
            </span>
            <span>
              Repetições: {currentCard.repetitions || 0} • Intervalo atual:{' '}
              {currentCard.interval || 0}d
            </span>
          </div>

          {/* Cartão Interativo */}
          <div
            onClick={() => setIsFlipped((prev) => !prev)}
            className="cursor-pointer bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border-2 border-slate-800 hover:border-indigo-500/60 rounded-3xl p-8 sm:p-10 min-h-[320px] flex flex-col justify-between transition-all shadow-2xl relative"
          >
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                {currentCard.level} • {currentCard.deck}
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakText(
                    isFlipped ? currentCard.example : currentCard.word,
                    { rate: 0.95 }
                  );
                }}
                className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg shadow-indigo-600/30"
                title="Ouvir pronúncia"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {!isFlipped ? (
              <div className="text-center my-8 space-y-3">
                <p className="text-xs uppercase tracking-widest text-indigo-400 font-semibold">
                  Frente (Inglês)
                </p>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
                  {currentCard.word}
                </h3>
                <p className="text-sm font-mono text-slate-400">
                  {currentCard.phonetic}
                </p>
                <p className="text-xs text-slate-500 pt-4">
                  👆 Clique no cartão para revelar o significado e exemplo
                </p>
              </div>
            ) : (
              <div className="my-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-1">
                    Tradução / Significado
                  </p>
                  <h3 className="text-2xl font-extrabold text-emerald-300">
                    {currentCard.translation}
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-300">
                      Frase de Exemplo:
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        speakText(currentCard.example, { rate: 0.95 });
                      }}
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
                      {currentCard.exampleTranslation}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500">
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
                  label: 'Errei',
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
                  label: 'Fácil',
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
              Mostrar Resposta
            </button>
          )}
        </div>
      )}

      {/* MODO 2: TREINO DE ESCUTA / DITADO */}
      {mode === 'listening' && currentCard && (
        <div className="max-w-xl mx-auto bg-slate-900/90 border border-slate-800 rounded-3xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300">
              Treino Auditivo • {currentCard.deck}
            </span>
            <h3 className="text-xl font-bold text-white">
              Ouça o áudio e digite a expressão em inglês
            </h3>
            <p className="text-xs text-slate-400">
              Dica em português: <strong>"{currentCard.translation}"</strong>
            </p>
          </div>

          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => speakText(currentCard.word, { rate: 0.95 })}
              className="px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2.5 shadow-lg shadow-indigo-600/30 transition"
            >
              <Volume2 className="w-6 h-6" />
              Ouvir Palavra (Normal)
            </button>
            <button
              type="button"
              onClick={() => speakText(currentCard.word, { rate: 0.7 })}
              className="px-4 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700"
            >
              🐢 Lento (0.7x)
            </button>
          </div>

          <form onSubmit={handleCheckListening} className="space-y-4">
            <input
              type="text"
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              placeholder="Digite em inglês o que você ouviu..."
              className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-center text-lg font-semibold"
            />

            {!listeningFeedback ? (
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition"
              >
                Verificar Escrita
              </button>
            ) : (
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  listeningFeedback.isCorrect
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                    : 'bg-amber-950/50 border-amber-500/40 text-amber-200'
                }`}
              >
                <p className="font-bold text-sm">
                  {listeningFeedback.isCorrect
                    ? '✅ Perfeito! Você escreveu corretamente!'
                    : `💡 Quase lá! A grafia exata é: "${listeningFeedback.correctWord}"`}
                </p>
                <p className="text-xs opacity-90">
                  Exemplo: "{currentCard.example}"
                </p>
                <button
                  type="button"
                  onClick={handleNextListening}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
                >
                  Próxima Palavra →
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* MODO 3: LISTA COMPLETA DE CARTÕES */}
      {mode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCards.map((card) => (
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
                <h4 className="text-base font-bold text-white">{card.word}</h4>
                <p className="text-xs text-emerald-300 font-medium mt-0.5">
                  {card.translation}
                </p>
                <p className="text-xs text-slate-400 italic mt-2">
                  "{card.example}"
                </p>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Nível {card.level}</span>
                <span>Intervalo: {card.interval || 0} dias</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL PARA ADICIONAR FLASHCARD PERSONALIZADO */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                Criar Novo Flashcard
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
                  Palavra ou Expressão em Inglês *
                </label>
                <input
                  type="text"
                  required
                  value={newCardForm.word}
                  onChange={(e) =>
                    setNewCardForm({ ...newCardForm, word: e.target.value })
                  }
                  placeholder="Ex: break the ice"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Significado / Tradução em Português *
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
                  placeholder="Ex: quebrar o gelo (iniciar uma conversa)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Frase de Exemplo no Contexto
                </label>
                <input
                  type="text"
                  value={newCardForm.example}
                  onChange={(e) =>
                    setNewCardForm({ ...newCardForm, example: e.target.value })
                  }
                  placeholder="Ex: He told a funny joke to break the ice."
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
                  Salvar no Baralho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
