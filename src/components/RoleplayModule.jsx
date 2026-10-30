import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  CheckCircle2,
  Circle,
  Lightbulb,
  RotateCcw,
  Plus,
  Languages,
  AudioWaveform,
} from 'lucide-react';
import { ROLEPLAY_SCENARIOS, analyzeUserEnglish } from '../data/content';
import {
  speakText,
  createSpeechRecognition,
  evaluatePronunciation,
} from '../utils/speech';

export default function RoleplayModule({
  selectedLevel,
  onAddFlashcard,
  onAwardXP,
  geminiApiKey,
}) {
  const filteredScenarios =
    selectedLevel === 'ALL'
      ? ROLEPLAY_SCENARIOS
      : ROLEPLAY_SCENARIOS.filter((s) => s.level === selectedLevel);

  const [activeScenarioId, setActiveScenarioId] = useState(
    (filteredScenarios[0] || ROLEPLAY_SCENARIOS[0]).id
  );
  const scenario =
    ROLEPLAY_SCENARIOS.find((s) => s.id === activeScenarioId) ||
    ROLEPLAY_SCENARIOS[0];

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [completedMissions, setCompletedMissions] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showTranslations, setShowTranslations] = useState(true);
  const [currentHint, setCurrentHint] = useState('');
  const [revealHintText, setRevealHintText] = useState(false);

  // Estado de Shadowing dentro do Chat
  const [shadowTargetMsgId, setShadowTargetMsgId] = useState(null);
  const [shadowResults, setShadowResults] = useState({});

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const initScenario = (scen) => {
    setMessages([
      {
        id: 'init-1',
        sender: 'ai',
        text: scen.initialMessage,
        translation: scen.initialTranslation,
      },
    ]);
    setCompletedMissions([]);
    setCurrentHint(scen.turns[0]?.hint || '');
    setRevealHintText(false);
    setInputText('');
    setShadowTargetMsgId(null);
    setShadowResults({});
  };

  useEffect(() => {
    initScenario(scenario);
  }, [activeScenarioId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleToggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = createSpeechRecognition({
      lang: scenario.accent || 'en-US',
      onResult: (transcript) => {
        setInputText(transcript);
      },
      onError: () => {
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (!recognition) {
      alert(
        'Seu navegador não suporta reconhecimento de voz nativo. Recomendamos usar Google Chrome ou Microsoft Edge.'
      );
      return;
    }

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const handleShadowPhrase = (msgId, targetSentence) => {
    if (shadowTargetMsgId === msgId) {
      recognitionRef.current?.stop();
      setShadowTargetMsgId(null);
      return;
    }

    setShadowTargetMsgId(msgId);
    const recognition = createSpeechRecognition({
      lang: scenario.accent || 'en-US',
      onResult: (transcript) => {
        const res = evaluatePronunciation(targetSentence, transcript);
        setShadowResults((prev) => ({
          ...prev,
          [msgId]: { transcript, ...res },
        }));
      },
      onError: () => setShadowTargetMsgId(null),
      onEnd: () => setShadowTargetMsgId(null),
    });

    if (!recognition) {
      alert('Abra no Chrome ou Edge para usar o microfone.');
      setShadowTargetMsgId(null);
      return;
    }

    recognitionRef.current = recognition;
    recognition.start();
  };

  const evaluateMissions = (userMessageLower) => {
    const newlyCompleted = [...completedMissions];
    let earnedMissionXP = false;

    scenario.missions.forEach((mission) => {
      if (!newlyCompleted.includes(mission.id)) {
        const hit = mission.keywords.some((kw) =>
          userMessageLower.includes(kw.toLowerCase())
        );
        if (hit) {
          newlyCompleted.push(mission.id);
          earnedMissionXP = true;
        }
      }
    });

    if (earnedMissionXP) {
      setCompletedMissions(newlyCompleted);
      onAwardXP(25, 'Missão do Roleplay cumprida! +25 XP');
    }
  };

  const generateSmartReply = async (userText) => {
    const lower = userText.toLowerCase();

    if (geminiApiKey && geminiApiKey.trim().length > 10) {
      try {
        const prompt = `You are playing the role of "${scenario.role}" in the scenario "${scenario.title}" (${scenario.description}).
The English learner just said: "${userText}".
Respond in valid JSON with keys:
- "reply": Your natural, in-character response in English (1-2 sentences, encouraging the conversation).
- "translation": Portuguese translation of your reply.
- "feedbackTitle": Short title in Portuguese about their grammar/naturalness.
- "feedbackExplanation": Short tip in Portuguese.
- "betterWay": A natural/native way to say what the user said in English.
- "hint": A short suggestion in English for what the user can say next.`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey.trim()}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawJson) {
            const parsed = JSON.parse(rawJson);
            return {
              reply: parsed.reply,
              translation: parsed.translation,
              hint: parsed.hint,
              customFeedback: {
                type: 'upgrade',
                title: parsed.feedbackTitle || 'Feedback do Tutor IA',
                explanation: parsed.feedbackExplanation || '',
                betterWay: parsed.betterWay || userText,
                vocabToSave: parsed.betterWay
                  ? {
                      word: parsed.betterWay,
                      phonetic: '/AI chunk/',
                      translation: 'Bloco natural sugerido no Roleplay',
                      example: parsed.betterWay,
                    }
                  : null,
              },
            };
          }
        }
      } catch {
        // Fallback silencioso para o motor local se a API falhar
      }
    }

    for (let i = 0; i < scenario.turns.length; i++) {
      const turn = scenario.turns[i];
      if (turn.match.some((kw) => lower.includes(kw))) {
        const nextHint =
          scenario.turns[i + 1]?.hint ||
          "Try saying: 'Thank you so much for your help! Have a great day.'";
        return {
          reply: turn.reply,
          translation: turn.translation,
          hint: nextHint,
        };
      }
    }

    return {
      reply: scenario.defaultReply,
      translation: scenario.defaultTranslation,
      hint:
        scenario.turns[0]?.hint ||
        'Try using one of the keywords from the mission list on the left!',
    };
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isLoadingAI) return;

    const localFeedback = analyzeUserEnglish(trimmed);
    const userMsgId = `user-${Date.now()}`;

    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: trimmed,
      feedback: localFeedback,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setRevealHintText(false);
    evaluateMissions(trimmed.toLowerCase());
    setIsLoadingAI(true);

    const aiResult = await generateSmartReply(trimmed);
    setIsLoadingAI(false);

    if (aiResult.customFeedback) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMsgId ? { ...m, feedback: aiResult.customFeedback } : m
        )
      );
    }

    const aiMsg = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text: aiResult.reply,
      translation: aiResult.translation,
    };

    setMessages((prev) => [...prev, aiMsg]);
    if (aiResult.hint) setCurrentHint(aiResult.hint);
    onAwardXP(10);
    speakText(aiResult.reply, { accent: scenario.accent || 'en-US' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Coluna Esquerda: Cenários e Missões */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            Cenários da Vida Real
          </h2>
          <p className="text-xs text-slate-400">
            Use os blocos aprendidos em conversas reais, com correção e Shadowing integrados.
          </p>

          <div className="space-y-2">
            {filteredScenarios.map((scen) => {
              const isSelected = scen.id === scenario.id;
              return (
                <button
                  key={scen.id}
                  onClick={() => setActiveScenarioId(scen.id)}
                  className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-2xl w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    {scen.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300">
                        {scen.level}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate">
                        {scen.role}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white truncate mt-0.5">
                      {scen.title}
                    </h3>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Checklist de Missões do Cenário */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              🎯 Missões da Conversa
            </h3>
            <span className="text-xs font-bold text-emerald-400">
              {completedMissions.length}/{scenario.missions.length} concluídas
            </span>
          </div>

          <div className="space-y-2.5">
            {scenario.missions.map((m) => {
              const done = completedMissions.includes(m.id);
              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition ${
                    done
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                  )}
                  <span className={done ? 'line-through opacity-80' : ''}>
                    {m.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Coluna Direita: Simulador de Conversa + Feedback */}
      <div className="lg:col-span-8 flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden min-h-[600px]">
        {/* Topo do Chat */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-2xl">
              {scenario.avatar}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {scenario.title}
              </h2>
              <p className="text-xs text-indigo-300">{scenario.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTranslations((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <Languages className="w-4 h-4 text-indigo-400" />
              {showTranslations ? 'Ocultar Tradução' : 'Ver Tradução'}
            </button>
            <button
              onClick={() => initScenario(scenario)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Reiniciar conversa"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Histórico de Mensagens */}
        <div className="flex-1 p-5 space-y-5 overflow-y-auto max-h-[420px]">
          {messages.map((msg) => {
            if (msg.sender === 'ai') {
              return (
                <div key={msg.id} className="flex items-start gap-3 max-w-xl">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                    {scenario.avatar}
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-sm p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm sm:text-base font-medium text-slate-100">
                        {msg.text}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() =>
                            speakText(msg.text, {
                              rate: 0.75,
                              accent: scenario.accent || 'en-US',
                            })
                          }
                          className="px-1.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300"
                          title="Ouvir em velocidade reduzida (0.75x)"
                        >
                          0.75x
                        </button>
                        <button
                          onClick={() =>
                            speakText(msg.text, {
                              accent: scenario.accent || 'en-US',
                            })
                          }
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white transition"
                          title="Ouvir fala do personagem"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {showTranslations && msg.translation && (
                      <p className="text-xs text-slate-400 border-t border-slate-800/80 pt-2">
                        🇧🇷 {msg.translation}
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            const shadowRes = shadowResults[msg.id];
            const isShadowingThis = shadowTargetMsgId === msg.id;

            return (
              <div
                key={msg.id}
                className="flex flex-col items-end space-y-2 ml-auto max-w-xl"
              >
                <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-md">
                  <p className="text-sm sm:text-base font-medium">{msg.text}</p>
                </div>

                {/* Card de Feedback Gramatical + Shadowing do Bloco Natural */}
                {msg.feedback && (
                  <div
                    className={`w-full rounded-xl p-3.5 border text-xs space-y-2 ${
                      msg.feedback.type === 'correction'
                        ? 'bg-amber-950/50 border-amber-500/40 text-amber-100'
                        : 'bg-indigo-950/50 border-indigo-500/30 text-indigo-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        {msg.feedback.title}
                      </span>
                      {msg.feedback.vocabToSave && (
                        <button
                          onClick={() =>
                            onAddFlashcard({
                              ...msg.feedback.vocabToSave,
                              deck: 'Blocos do Roleplay',
                              level: scenario.level,
                            })
                          }
                          className="px-2 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 text-[11px]"
                        >
                          <Plus className="w-3 h-3" /> Salvar Bloco
                        </button>
                      )}
                    </div>
                    <p className="opacity-90">{msg.feedback.explanation}</p>
                    {msg.feedback.betterWay &&
                      msg.feedback.betterWay !== msg.text && (
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span>
                              💡 <strong>Bloco mais natural:</strong> "
                              {msg.feedback.betterWay}"
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() =>
                                  speakText(msg.feedback.betterWay, {
                                    rate: 0.95,
                                  })
                                }
                                className="p-1.5 rounded bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white"
                                title="Ouvir forma natural"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleShadowPhrase(
                                    msg.id,
                                    msg.feedback.betterWay
                                  )
                                }
                                className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ${
                                  isShadowingThis
                                    ? 'bg-rose-600 text-white animate-pulse'
                                    : 'bg-slate-800 hover:bg-amber-600 text-amber-300 hover:text-white'
                                }`}
                                title="Repetir a forma natural em voz alta (Shadowing)"
                              >
                                <AudioWaveform className="w-3 h-3" />
                                {isShadowingThis ? 'Ouvindo...' : 'Shadowing'}
                              </button>
                            </div>
                          </div>

                          {shadowRes && (
                            <div className="pt-1 border-t border-slate-800 text-[11px] text-emerald-300 flex items-center justify-between">
                              <span>
                                🎙️ Precisão: <strong>{shadowRes.accuracy}%</strong>
                              </span>
                              <span className="text-slate-400">
                                {shadowRes.feedback}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>
            );
          })}

          {isLoadingAI && (
            <div className="text-xs text-slate-400 italic flex items-center gap-2">
              <span className="animate-pulse">●</span> {scenario.role} está
              digitando...
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Barra de Dica Gradual (Incentiva Recuperação Ativa antes de revelar) */}
        {currentHint && (
          <div className="px-4 py-2.5 bg-indigo-950/40 border-t border-indigo-500/20 flex items-center justify-between gap-2 text-xs text-indigo-200">
            <div className="flex items-center gap-2 truncate">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
              {revealHintText ? (
                <span className="truncate">{currentHint}</span>
              ) : (
                <span className="text-slate-300">
                  Tente formular sua resposta primeiro! Precisa de ajuda para destravar?
                </span>
              )}
            </div>
            {!revealHintText ? (
              <button
                type="button"
                onClick={() => setRevealHintText(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold shrink-0 transition border border-slate-700"
              >
                Ver Pista de Bloco
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const match = currentHint.match(/'([^']+)'/);
                  if (match && match[1]) {
                    setInputText(match[1]);
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-600/40 hover:bg-indigo-600 text-white font-semibold shrink-0 transition"
              >
                Preencher Sugestão
              </button>
            )}
          </div>
        )}

        {/* Input de Texto e Microfone */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2.5"
        >
          <button
            type="button"
            onClick={handleToggleMic}
            className={`p-3.5 rounded-xl font-semibold transition flex items-center justify-center shrink-0 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-600/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={
              isListening
                ? 'Parar gravação'
                : 'Falar em inglês usando o microfone'
            }
          >
            {isListening ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5 text-indigo-400" />
            )}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening
                ? '🎙️ Ouvindo sua voz em inglês...'
                : 'Digite ou fale sua resposta em inglês...'
            }
            className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoadingAI}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-indigo-600/20"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
}
