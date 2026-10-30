import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  MessageSquare,
  Flame,
  Trophy,
  Settings,
  X,
  Sparkles,
  CheckCircle2,
  Download,
  Upload,
  Smartphone,
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import InteractiveReader from './components/InteractiveReader';
import FlashcardsModule from './components/FlashcardsModule';
import RoleplayModule from './components/RoleplayModule';
import { INITIAL_FLASHCARDS } from './data/content';

const STORAGE_KEY = 'fluentflow_state_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'reader' | 'flashcards' | 'roleplay'
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [xp, setXp] = useState(40);
  const [dailyGoal, setDailyGoal] = useState(120);
  const [streak, setStreak] = useState(3);
  const [flashcards, setFlashcards] = useState(INITIAL_FLASHCARDS);
  const [completedTexts, setCompletedTexts] = useState([]);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  // Captura o evento de instalação nativa do PWA (Chrome / Edge / Android)
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Carrega dados salvos do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.xp === 'number') setXp(parsed.xp);
        if (typeof parsed.dailyGoal === 'number') setDailyGoal(parsed.dailyGoal);
        if (typeof parsed.streak === 'number') setStreak(parsed.streak);
        if (Array.isArray(parsed.flashcards) && parsed.flashcards.length > 0) {
          // Preserva o histórico do usuário e enriquece cards padrão com novos metadados de blocos (chunks)
          const merged = parsed.flashcards.map((savedCard) => {
            const template = INITIAL_FLASHCARDS.find((t) => t.id === savedCard.id);
            return template ? { ...template, ...savedCard, usageExplanation: savedCard.usageExplanation || template.usageExplanation, situations: savedCard.situations || template.situations, practicePrompt: savedCard.practicePrompt || template.practicePrompt } : savedCard;
          });
          const hasCard0 = merged.some((c) => c.id === 'card-0');
          const defaultCard0 = INITIAL_FLASHCARDS.find((t) => t.id === 'card-0');
          setFlashcards(!hasCard0 && defaultCard0 ? [defaultCard0, ...merged] : merged);
        }
        if (Array.isArray(parsed.completedTexts)) {
          setCompletedTexts(parsed.completedTexts);
        }
        if (typeof parsed.geminiApiKey === 'string') {
          setGeminiApiKey(parsed.geminiApiKey);
        }
      }
    } catch {
      // Ignora erro de parse do storage
    }
  }, []);

  // Persiste alterações no localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          xp,
          dailyGoal,
          streak,
          flashcards,
          completedTexts,
          geminiApiKey,
        })
      );
    } catch {
      // Ignora erro de escrita
    }
  }, [xp, dailyGoal, streak, flashcards, completedTexts, geminiApiKey]);

  const showNotification = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        showNotification('FluentFlow instalado com sucesso no seu dispositivo!');
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  const handleExportProgress = () => {
    const dataStr = JSON.stringify(
      { xp, dailyGoal, streak, flashcards, completedTexts },
      null,
      2
    );
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fluentflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Backup exportado! Envie para o seu celular ou PC.');
  };

  const handleImportProgress = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed.flashcards)) setFlashcards(parsed.flashcards);
        if (typeof parsed.xp === 'number') setXp(parsed.xp);
        if (typeof parsed.streak === 'number') setStreak(parsed.streak);
        if (Array.isArray(parsed.completedTexts)) {
          setCompletedTexts(parsed.completedTexts);
        }
        showNotification('Progresso e flashcards restaurados com sucesso!');
        setShowSettings(false);
      } catch {
        showNotification('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  };

  const handleAwardXP = (amount, customMessage) => {
    setXp((prev) => prev + amount);
    if (customMessage) {
      showNotification(customMessage);
    }
  };

  const handleAddFlashcard = (newCardData) => {
    const exists = flashcards.some(
      (c) =>
        c.word.toLowerCase().trim() === newCardData.word.toLowerCase().trim()
    );
    if (exists) {
      showNotification(`"${newCardData.word}" já está no seu baralho!`);
      return;
    }

    const card = {
      id: `card-${Date.now()}`,
      word: newCardData.word,
      phonetic: newCardData.phonetic || '/.../',
      translation: newCardData.translation,
      usageExplanation: newCardData.usageExplanation || '',
      situations: newCardData.situations || [],
      practicePrompt: newCardData.practicePrompt || '',
      example: newCardData.example || '',
      exampleTranslation: newCardData.exampleTranslation || '',
      deck: newCardData.deck || 'Salvos',
      level: newCardData.level || 'B1-B2',
      repetitions: 0,
      interval: 0,
      easeFactor: 2.5,
      nextReview: Date.now(),
      status: 'new',
    };

    setFlashcards((prev) => [card, ...prev]);
    handleAwardXP(
      10,
      `Card "${card.word}" adicionado aos Flashcards! (+10 XP)`
    );
  };

  const handleUpdateFlashcard = (updatedCard) => {
    setFlashcards((prev) =>
      prev.map((c) => (c.id === updatedCard.id ? updatedCard : c))
    );
  };

  const handleCompleteText = (textId) => {
    if (!completedTexts.includes(textId)) {
      setCompletedTexts((prev) => [...prev, textId]);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Início', shortLabel: 'Início', icon: LayoutDashboard },
    { id: 'reader', label: 'Textos & Músicas', shortLabel: 'Leitura', icon: BookOpen },
    {
      id: 'flashcards',
      label: 'Flashcards',
      shortLabel: 'Blocos',
      icon: Layers,
      badge: flashcards.filter((c) => (c.nextReview || 0) <= Date.now()).length,
    },
    { id: 'roleplay', label: 'Roleplay IA', shortLabel: 'Roleplay', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col pb-24 md:pb-10">
      {/* Header Principal */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Logo */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2 text-left min-w-0 shrink-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center font-black text-white text-base sm:text-lg shadow-lg shadow-indigo-600/30 shrink-0">
              FF
            </div>
            <div className="min-w-0">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-white block leading-none truncate">
                FluentFlow
              </span>
              <span className="text-[10px] sm:text-[11px] text-indigo-400 font-medium block truncate">
                English Studio
              </span>
            </div>
          </button>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] rounded-full font-extrabold ${
                        isActive
                          ? 'bg-white text-indigo-700'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Indicadores de Ofensiva, XP, Instalar PWA e Configurações */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition"
              title="Instalar no celular ou PC como Aplicativo"
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Instalar App</span>
            </button>

            <div
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-amber-400"
              title="Ofensiva diária (Streak)"
            >
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 shrink-0" />
              <span>{streak}d</span>
            </div>

            <div
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-indigo-300"
              title="Pontos de Experiência (XP)"
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 shrink-0" />
              <span>{xp}</span>
              <span className="hidden sm:inline">XP</span>
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
              title="Configurações, Backup e IA"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Notificação Toast Flutuante */}
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 inset-x-4 md:left-auto md:right-6 md:max-w-md z-50 bg-emerald-950/95 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="leading-snug">{toast}</span>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
            onNavigate={setActiveTab}
            xp={xp}
            dailyGoal={dailyGoal}
            streak={streak}
            flashcards={flashcards}
            completedTexts={completedTexts}
            onUpdateFlashcard={handleUpdateFlashcard}
            onAwardXP={handleAwardXP}
          />
        )}

        {activeTab === 'reader' && (
          <InteractiveReader
            selectedLevel={selectedLevel}
            flashcards={flashcards}
            onAddFlashcard={handleAddFlashcard}
            onAwardXP={handleAwardXP}
            completedTexts={completedTexts}
            onCompleteText={handleCompleteText}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardsModule
            flashcards={flashcards}
            onUpdateFlashcard={handleUpdateFlashcard}
            onAddFlashcard={handleAddFlashcard}
            onAwardXP={handleAwardXP}
          />
        )}

        {activeTab === 'roleplay' && (
          <RoleplayModule
            selectedLevel={selectedLevel}
            onAddFlashcard={handleAddFlashcard}
            onAwardXP={handleAwardXP}
            geminiApiKey={geminiApiKey}
          />
        )}
      </main>

      {/* Barra de Navegação Mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-2 pt-1.5 pb-safe grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl text-[11px] font-bold relative transition ${
                isActive ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate max-w-full leading-tight">
                {item.shortLabel || item.label}
              </span>
              {item.badge > 0 && (
                <span className="absolute top-1 right-2.5 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Modal Guia de Instalação PWA */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                Instalar FluentFlow como App
              </h3>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <p className="font-bold text-white mb-1">📱 No Android (Chrome):</p>
                <p>
                  Toque nos <strong>3 pontinhos (⋮)</strong> no canto superior do navegador e selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <p className="font-bold text-white mb-1">🍏 No iPhone / iPad (Safari):</p>
                <p>
                  Toque no botão <strong>Compartilhar (ícone com seta para cima)</strong> na barra inferior e escolha <strong>"Adicionar à Tela de Início"</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <p className="font-bold text-white mb-1">💻 No PC (Chrome / Edge):</p>
                <p>
                  Clique no ícone de <strong>Instalar (monitor com seta)</strong> no canto direito da barra de endereços.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              Entendi!
            </button>
          </div>
        </div>
      )}

      {/* Modal de Configurações + Backup */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                Configurações e Sincronização
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Meta Diária de Estudo (XP)
                </label>
                <select
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                >
                  <option value={60}>Casual (60 XP / ~5 min)</option>
                  <option value={120}>Regular (120 XP / ~15 min)</option>
                  <option value={250}>Intensivo (250 XP / ~30 min)</option>
                </select>
              </div>

              {/* Sincronizar Progresso entre Celular e PC */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
                <p className="text-xs font-semibold text-emerald-300">
                  🔄 Levar meu progresso para outro dispositivo
                </p>
                <p className="text-[11px] text-slate-400">
                  Exporte seus flashcards e XP em um arquivo leve para importar no celular ou outro computador:
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExportProgress}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    Exportar JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700"
                  >
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    Importar JSON
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportProgress}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Chave da API Google Gemini (Opcional)
                </label>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  O Roleplay já funciona 100% offline. Se quiser conversas abertas ilimitadas com o Gemini, insira sua API Key gratuita:
                </p>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY);
                  window.location.reload();
                }}
                className="text-xs text-rose-400 hover:underline"
              >
                Resetar dados
              </button>

              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
