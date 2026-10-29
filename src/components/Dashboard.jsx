import React from 'react';
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
} from 'lucide-react';
import { LEVELS, INTERACTIVE_TEXTS, ROLEPLAY_SCENARIOS } from '../data/content';

export default function Dashboard({
  selectedLevel,
  onSelectLevel,
  onNavigate,
  xp,
  dailyGoal,
  streak,
  flashcards,
  completedTexts,
}) {
  const dueCardsCount = flashcards.filter(
    (c) => (c.nextReview || 0) <= Date.now()
  ).length;
  const masteredCount = flashcards.filter(
    (c) => c.status === 'mastered' || (c.interval || 0) >= 7
  ).length;
  const learningCount = flashcards.filter(
    (c) => c.status === 'learning' && (c.interval || 0) < 7
  ).length;

  const progressPercent = Math.min(100, Math.round((xp / dailyGoal) * 100));

  return (
    <div className="space-y-8">
      {/* Banner Principal + Meta Diária */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Ciclo Integrado de Fluência: Input → Retenção → Conversação
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Pronto para destravar seu inglês hoje?
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl">
              Leia textos e músicas interativas com áudio nativo, salve palavras com 1 clique nos seus Flashcards inteligentes e pratique em situações reais com IA.
            </p>

            {/* Seletor de Nível */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 mr-1">
                Filtrar por nível:
              </span>
              {LEVELS.map((lvl) => {
                const active = selectedLevel === lvl.id;
                return (
                  <button
                    key={lvl.id}
                    onClick={() => onSelectLevel(lvl.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition border ${
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
                <p className="text-[11px] text-slate-400">Total de Cards</p>
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
                <p className="text-[11px] text-slate-400">Dominadas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                {completedTexts.length}/{INTERACTIVE_TEXTS.length} lidos
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white group-hover:text-indigo-300 transition">
                1. Textos & Músicas Interativas
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Ouça com sotaque americano ou britânico, clique em qualquer palavra para ver a tradução no contexto e envie direto para os seus Flashcards.
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
                {dueCardsCount} pendentes hoje
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">
                2. Flashcards Inteligentes (Anki)
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Memorize de verdade com repetição espaçada (SM-2) e treino auditivo de ditado. Inclui seus cartões salvos durante a leitura e conversação!
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('flashcards')}
            className="mt-6 w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20"
          >
            Iniciar Revisão ({dueCardsCount})
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
                Simule uma cafeteria em NY, imigração no aeroporto, hotel em Londres ou entrevista de trabalho falando pelo microfone ou digitando.
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

      {/* Roteiro Recomendado de 15 Minutos */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-4">
          ⚡ Roteiro Diário Recomendado (15 min/dia)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="font-bold text-white mb-0.5">
                Passo 1: 5 min de Input (Leitura + Áudio)
              </p>
              <p className="text-slate-400">
                Leia um texto curto ouvindo a pronúncia e salve 3 palavras novas nos seus Flashcards.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white mb-0.5">
                Passo 2: 5 min de Flashcards (SM-2)
              </p>
              <p className="text-slate-400">
                Revise os cartões agendados para hoje e teste seu ouvido no modo Ditado.
              </p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-bold text-white mb-0.5">
                Passo 3: 5 min de Prática Ativa (Roleplay)
              </p>
              <p className="text-slate-400">
                Conclua as 3 missões de um cenário usando sua voz para ganhar confiança na fala.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
