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
  Turtle,
  Footprints,
} from 'lucide-react';
import { ROLEPLAY_SCENARIOS, analyzeUserEnglish } from '../data/content';
import {
  speakText,
  speakWordByWord,
  stopSpeaking,
  createSpeechRecognition,
  evaluatePronunciation,
  generatePortuguesePhonetics,
} from '../utils/speech';

// Sugestões prontas e intuitivas por cenário para o aluno nunca travar na conversa
const SCENARIO_QUICK_REPLIES = {
  'coffee-shop': [
    {
      en: "I'd like a medium iced latte with oat milk, please.",
      pt: 'Eu gostaria de um latte gelado médio com leite de aveia, por favor.',
    },
    {
      en: 'Could I also get a chocolate muffin to go?',
      pt: 'Você poderia me vê também um muffin de chocolate para viagem?',
    },
    {
      en: 'How much is it? Can I pay by credit card?',
      pt: 'Quanto fica? Posso pagar com cartão de crédito?',
    },
  ],
  'airport-immigration': [
    {
      en: 'I am visiting on vacation for ten days.',
      pt: 'Estou visitando de férias por dez dias.',
    },
    {
      en: 'I have a reservation at a hotel in Midtown Manhattan.',
      pt: 'Tenho uma reserva em um hotel em Midtown Manhattan.',
    },
    {
      en: 'Yes, Officer. Here is my return ticket for next week.',
      pt: 'Sim, Oficial. Aqui está minha passagem de volta para a próxima semana.',
    },
  ],
  'tech-interview': [
    {
      en: 'I have been working on web applications and learning English daily.',
      pt: 'Venho trabalhando em aplicações web e estudando inglês diariamente.',
    },
    {
      en: 'Recently, I helped my team solve a tough deadline by improving our workflow.',
      pt: 'Recentemente, ajudei minha equipe a cumprir um prazo difícil melhorando nosso fluxo.',
    },
    {
      en: 'What does a typical day look like for someone on your team?',
      pt: 'Como é um dia típico para alguém na sua equipe?',
    },
  ],
  'hotel-problem': [
    {
      en: 'Hello! I have a reservation under my name for three nights.',
      pt: 'Olá! Tenho uma reserva no meu nome para três noites.',
    },
    {
      en: "Excuse me, the air conditioning in my room isn't working properly. Could I switch rooms?",
      pt: 'Com licença, o ar-condicionado do meu quarto não está funcionando bem. Eu poderia trocar de quarto?',
    },
    {
      en: 'That sounds wonderful, thank you! What time is breakfast served?',
      pt: 'Isso parece ótimo, obrigado! A que horas é servido o café da manhã?',
    },
  ],
};

// Avatar Ilustrado Animado com Sincronia Labial (Lip-Sync) e Expressões Faciais
function AnimatedCharacterAvatar({
  scenarioId,
  isSpeaking,
  isListening,
  mouthViseme = 'closed',
  mood = 'friendly',
}) {
  const configs = {
    'coffee-shop': {
      bgGrad: 'from-amber-500/30 via-emerald-600/20 to-slate-900',
      ringColor: isSpeaking
        ? 'border-emerald-400 shadow-emerald-500/30'
        : isListening
        ? 'border-amber-400 shadow-amber-500/30'
        : 'border-indigo-500/40',
      skin: '#F4C29F',
      hair: '#3B2314',
      shirt: '#059669',
      accentColor: '#F59E0B',
      hasGlasses: true,
      hasCap: false,
      hasBowtie: false,
      hasHeadset: false,
    },
    'airport-immigration': {
      bgGrad: 'from-blue-600/30 via-indigo-900/30 to-slate-900',
      ringColor: isSpeaking
        ? 'border-sky-400 shadow-sky-500/30'
        : isListening
        ? 'border-amber-400 shadow-amber-500/30'
        : 'border-blue-500/40',
      skin: '#E0AC8B',
      hair: '#1E293B',
      shirt: '#1E3A8A',
      accentColor: '#FBBF24',
      hasGlasses: false,
      hasCap: true,
      hasBowtie: false,
      hasHeadset: false,
    },
    'tech-interview': {
      bgGrad: 'from-indigo-600/30 via-purple-900/25 to-slate-900',
      ringColor: isSpeaking
        ? 'border-indigo-400 shadow-indigo-500/30'
        : isListening
        ? 'border-amber-400 shadow-amber-500/30'
        : 'border-indigo-500/40',
      skin: '#F7CBA8',
      hair: '#7C2D12',
      shirt: '#4F46E5',
      accentColor: '#34D399',
      hasGlasses: false,
      hasCap: false,
      hasBowtie: false,
      hasHeadset: true,
    },
    'hotel-problem': {
      bgGrad: 'from-rose-600/25 via-amber-900/20 to-slate-900',
      ringColor: isSpeaking
        ? 'border-amber-400 shadow-amber-500/30'
        : isListening
        ? 'border-emerald-400 shadow-emerald-500/30'
        : 'border-amber-500/40',
      skin: '#F3C6A5',
      hair: '#475569',
      shirt: '#881337',
      accentColor: '#FBBF24',
      hasGlasses: false,
      hasCap: false,
      hasBowtie: true,
      hasHeadset: false,
    },
  };

  const cfg = configs[scenarioId] || configs['coffee-shop'];

  const renderMouth = () => {
    if (!isSpeaking) {
      if (mood === 'happy') {
        return (
          <path
            d="M 40 66 Q 50 75 60 66 Z"
            fill="#991B1B"
            stroke="#7F1D1D"
            strokeWidth="1.5"
          />
        );
      }
      return (
        <path
          d="M 41 67 Q 50 72 59 67"
          fill="none"
          stroke="#7C2D12"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      );
    }

    if (mouthViseme === 'round') {
      return (
        <ellipse
          cx="50"
          cy="68"
          rx="5.5"
          ry="6.5"
          fill="#7F1D1D"
          stroke="#450A0A"
          strokeWidth="1.5"
        />
      );
    }
    if (mouthViseme === 'wide') {
      return (
        <g>
          <rect
            x="39"
            y="63"
            width="22"
            height="10"
            rx="5"
            fill="#7F1D1D"
            stroke="#450A0A"
            strokeWidth="1.5"
          />
          <rect x="42" y="64" width="16" height="3" rx="1" fill="#FFFFFF" />
        </g>
      );
    }
    if (mouthViseme === 'open') {
      return (
        <ellipse
          cx="50"
          cy="68"
          rx="8"
          ry="4.5"
          fill="#991B1B"
          stroke="#450A0A"
          strokeWidth="1.5"
        />
      );
    }
    return (
      <path
        d="M 42 67 Q 50 70 58 67"
        fill="none"
        stroke="#7C2D12"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    );
  };

  return (
    <div className="relative flex flex-col items-center justify-center shrink-0">
      {/* Ondas sonoras animadas ao redor do avatar quando fala ou escuta */}
      {(isSpeaking || isListening) && (
        <div
          className={`absolute -inset-1.5 rounded-3xl animate-pulse border-2 ${
            isSpeaking ? 'border-emerald-400/50' : 'border-amber-400/60'
          }`}
        />
      )}

      <div
        className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-b ${cfg.bgGrad} border-2 ${cfg.ringColor} shadow-xl overflow-hidden flex items-center justify-center transition-transform duration-300 ${
          isListening ? '-rotate-2 scale-105' : isSpeaking ? 'scale-105' : ''
        }`}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Ombros / Roupa */}
          <path d="M 16 100 Q 50 78 84 100 Z" fill={cfg.shirt} />

          {/* Gravata borboleta ou uniforme */}
          {cfg.hasBowtie && (
            <polygon points="43,85 57,91 57,85 43,91" fill={cfg.accentColor} />
          )}

          {/* Pescoço */}
          <rect x="43" y="72" width="14" height="14" rx="4" fill={cfg.skin} />

          {/* Cabelo de fundo */}
          <circle cx="50" cy="46" r="25" fill={cfg.hair} />

          {/* Rosto */}
          <ellipse cx="50" cy="50" rx="21" ry="24" fill={cfg.skin} />

          {/* Bochechas coradas */}
          <circle cx="36" cy="58" r="3.5" fill="#F43F5E" opacity="0.22" />
          <circle cx="64" cy="58" r="3.5" fill="#F43F5E" opacity="0.22" />

          {/* Cabelo topo / Quepe de Oficial */}
          {cfg.hasCap ? (
            <g>
              <path d="M 25 34 Q 50 18 75 34 Z" fill="#1E3A8A" />
              <rect x="24" y="32" width="52" height="5" rx="2" fill="#0F172A" />
              <circle cx="50" cy="27" r="3.5" fill="#FBBF24" />
            </g>
          ) : (
            <path
              d="M 28 42 Q 50 22 72 42 Q 65 28 50 28 Q 35 28 28 42 Z"
              fill={cfg.hair}
            />
          )}

          {/* Sobrancelhas expressivas */}
          <path
            d={
              isSpeaking || isListening
                ? 'M 36 41 Q 41 38 45 41'
                : 'M 36 43 Q 41 41 45 43'
            }
            fill="none"
            stroke={cfg.hair}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d={
              isSpeaking || isListening
                ? 'M 55 41 Q 59 38 64 41'
                : 'M 55 43 Q 59 41 64 43'
            }
            fill="none"
            stroke={cfg.hair}
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Olhos */}
          <circle cx="41" cy="49" r="2.7" fill="#0F172A" />
          <circle cx="59" cy="49" r="2.7" fill="#0F172A" />
          <circle cx="42" cy="48" r="0.9" fill="#FFFFFF" />
          <circle cx="60" cy="48" r="0.9" fill="#FFFFFF" />

          {/* Óculos (Maya) */}
          {cfg.hasGlasses && (
            <g stroke="#1E293B" strokeWidth="1.6" fill="none">
              <circle cx="41" cy="49" r="6" />
              <circle cx="59" cy="49" r="6" />
              <line x1="47" y1="49" x2="53" y2="49" />
            </g>
          )}

          {/* Nariz */}
          <path
            d="M 50 51 Q 52 57 49 59"
            fill="none"
            stroke="#C68B63"
            strokeWidth="1.8"
            strokeLinecap="round"
          />

          {/* Boca com Lip-Sync */}
          {renderMouth()}

          {/* Headset (Sarah) */}
          {cfg.hasHeadset && (
            <g>
              <path
                d="M 28 50 Q 28 23 50 23 Q 72 23 72 50"
                fill="none"
                stroke="#334155"
                strokeWidth="2.5"
              />
              <rect x="25" y="45" width="5" height="10" rx="2" fill="#4F46E5" />
              <path
                d="M 28 53 Q 34 68 44 68"
                fill="none"
                stroke="#334155"
                strokeWidth="1.8"
              />
            </g>
          )}
        </svg>

        {/* Indicador de Status do Avatar */}
        <div className="absolute bottom-1.5 inset-x-1.5 flex justify-center">
          <span
            className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow ${
              isSpeaking
                ? 'bg-emerald-500 text-slate-950'
                : isListening
                ? 'bg-amber-400 text-slate-950'
                : 'bg-slate-900/90 text-slate-300 border border-slate-700'
            }`}
          >
            {isSpeaking ? '🔊 Falando' : isListening ? '👂 Ouvindo' : '● Online'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function RoleplayModule({
  selectedLevel,
  preferredAccent = 'en-US',
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

  // Estado do Avatar Animado (Lip-Sync + Karaokê + Expressões)
  const [isSpeakingAvatar, setIsSpeakingAvatar] = useState(false);
  const [mouthViseme, setMouthViseme] = useState('closed');
  const [activeAvatarWordIdx, setActiveAvatarWordIdx] = useState(-1);
  const [avatarMood, setAvatarMood] = useState('friendly');
  const [showQuickReplies, setShowQuickReplies] = useState(true);

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const visemeTimerRef = useRef(null);

  const triggerAvatarSpeech = (
    textToSpeak,
    { rate = 0.82, wordByWord = false } = {}
  ) => {
    const useAccent = preferredAccent || scenario.accent || 'en-US';
    if (visemeTimerRef.current) clearInterval(visemeTimerRef.current);

    const onWordBoundary = (wordIdx, wordStr) => {
      setActiveAvatarWordIdx(wordIdx);
      if (wordIdx < 0 || !wordStr) {
        setMouthViseme('closed');
        return;
      }
      const lower = wordStr.toLowerCase();
      if (/[ouw]/.test(lower)) {
        setMouthViseme('round');
      } else if (/[ae]/.test(lower)) {
        setMouthViseme('wide');
      } else {
        setMouthViseme('open');
      }
      setTimeout(() => {
        setMouthViseme((prev) => (prev === 'closed' ? 'open' : 'closed'));
      }, 140);
    };

    const onStart = () => {
      setIsSpeakingAvatar(true);
      setMouthViseme('open');
    };

    const onEnd = () => {
      setIsSpeakingAvatar(false);
      setMouthViseme('closed');
      setActiveAvatarWordIdx(-1);
      if (visemeTimerRef.current) clearInterval(visemeTimerRef.current);
    };

    if (wordByWord) {
      speakWordByWord(textToSpeak, {
        accent: useAccent,
        rate: 0.65,
        pauseMs: 380,
        onWordBoundary,
        onStart,
        onEnd,
      });
    } else {
      speakText(textToSpeak, {
        rate,
        accent: useAccent,
        onWordBoundary,
        onStart,
        onEnd,
      });
    }
  };

  const initScenario = (scen) => {
    stopSpeaking();
    setIsSpeakingAvatar(false);
    setActiveAvatarWordIdx(-1);
    setAvatarMood('friendly');
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
      lang: preferredAccent || scenario.accent || 'en-US',
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
      lang: preferredAccent || scenario.accent || 'en-US',
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
      setAvatarMood('happy');
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
    triggerAvatarSpeech(aiResult.reply, { rate: 0.82 });
  };

  const latestAiMessage =
    [...messages].reverse().find((m) => m.sender === 'ai') || {
      text: scenario.initialMessage,
      translation: scenario.initialTranslation,
    };
  const latestAiWords = latestAiMessage.text.split(/\s+/).filter(Boolean);
  const quickReplies =
    SCENARIO_QUICK_REPLIES[scenario.id] ||
    SCENARIO_QUICK_REPLIES['coffee-shop'];

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

      {/* Coluna Direita: Simulador de Conversa + Avatar Animado + Feedback */}
      <div className="lg:col-span-8 flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden min-h-[540px]">
        {/* Palco Ao Vivo do Avatar Interativo + Legenda Karaokê + Fala Lenta */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-indigo-950/35 to-slate-950 space-y-3">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <AnimatedCharacterAvatar
              scenarioId={scenario.id}
              isSpeaking={isSpeakingAvatar}
              isListening={isListening}
              mouthViseme={mouthViseme}
              mood={avatarMood}
            />

            <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left w-full">
              <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                    🎭 Conversa Ao Vivo com Avatar IA
                  </span>
                  <h2 className="text-sm sm:text-base font-extrabold text-white">
                    {scenario.role} • {scenario.title}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowTranslations((prev) => !prev)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700"
                  >
                    <Languages className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{showTranslations ? 'Ocultar PT' : 'Ver PT'}</span>
                  </button>
                  <button
                    onClick={() => initScenario(scenario)}
                    className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    title="Reiniciar conversa"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Legenda Ao Vivo com Destaque Karaokê em Tempo Real */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-1.5 text-left">
                <p className="text-sm sm:text-base font-bold leading-relaxed text-white">
                  {latestAiWords.map((word, wIdx) => (
                    <span
                      key={wIdx}
                      className={`inline-block rounded px-1 transition-all ${
                        activeAvatarWordIdx === wIdx
                          ? 'bg-emerald-500 text-slate-950 font-black scale-105 shadow'
                          : 'text-slate-100'
                      }`}
                    >
                      {word}{' '}
                    </span>
                  ))}
                </p>

                {/* Como Ler em Português (Pronúncia Figurada Intuitiva) */}
                <p className="text-xs font-medium text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  🗣️ <strong>Como soa:</strong> “
                  {generatePortuguesePhonetics(latestAiMessage.text)}”
                </p>

                {showTranslations && latestAiMessage.translation && (
                  <p className="text-xs text-slate-400">
                    🇧🇷 {latestAiMessage.translation}
                  </p>
                )}

                {/* Controles Rápidos de Velocidade do Avatar */}
                <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      triggerAvatarSpeech(latestAiMessage.text, { rate: 0.85 })
                    }
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Ouvir Normal
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      triggerAvatarSpeech(latestAiMessage.text, { rate: 0.55 })
                    }
                    className="px-2.5 py-1 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-1"
                  >
                    <Turtle className="w-3.5 h-3.5" />
                    🐢 Falar Bem Devagar (0.55x)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      triggerAvatarSpeech(latestAiMessage.text, {
                        wordByWord: true,
                      })
                    }
                    className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 border border-amber-500/40 text-amber-200 text-xs font-bold flex items-center gap-1"
                  >
                    <Footprints className="w-3.5 h-3.5" />
                    🔍 Palavra por Palavra (Pausado)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Histórico de Mensagens */}
        <div className="flex-1 p-3.5 sm:p-5 space-y-4 overflow-y-auto max-h-[44dvh] sm:max-h-[340px]">
          {messages.map((msg) => {
            if (msg.sender === 'ai') {
              return (
                <div key={msg.id} className="flex items-start gap-3 max-w-xl">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                    {scenario.avatar}
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-sm p-3.5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm sm:text-base font-medium text-slate-100">
                        {msg.text}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() =>
                            triggerAvatarSpeech(msg.text, { rate: 0.55 })
                          }
                          className="px-2 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-[10px] font-bold text-emerald-300"
                          title="Ouvir bem devagar (0.55x)"
                        >
                          🐢 0.55x
                        </button>
                        <button
                          onClick={() =>
                            triggerAvatarSpeech(msg.text, { wordByWord: true })
                          }
                          className="px-2 py-1 rounded-lg bg-amber-950 hover:bg-amber-900 border border-amber-500/30 text-[10px] font-bold text-amber-300"
                          title="Ouvir pausadamente palavra por palavra"
                        >
                          Pausado
                        </button>
                        <button
                          onClick={() =>
                            triggerAvatarSpeech(msg.text, { rate: 0.85 })
                          }
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-indigo-300 hover:text-white transition"
                          title="Ouvir fala do personagem"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-amber-300/90 font-medium">
                      🗣️ Como ler: “{generatePortuguesePhonetics(msg.text)}”
                    </p>

                    {showTranslations && msg.translation && (
                      <p className="text-xs text-slate-400 border-t border-slate-800/80 pt-1.5">
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

        {/* Respostas Sugeridas com 1 Toque (Para Iniciantes Não Travarem) */}
        <div className="px-3.5 sm:px-4 py-2.5 bg-slate-950/90 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Sugestões prontas para responder (ouça devagar ou toque para usar):
            </span>
            <button
              type="button"
              onClick={() => setShowQuickReplies((prev) => !prev)}
              className="text-[11px] text-slate-400 hover:text-white underline"
            >
              {showQuickReplies ? 'Ocultar sugestões' : 'Mostrar sugestões'}
            </button>
          </div>

          {showQuickReplies && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {quickReplies.map((qr, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 flex flex-col justify-between gap-2 text-xs transition"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-white leading-snug">
                      “{qr.en}”
                    </p>
                    <p className="text-[11px] text-amber-300">
                      🗣️ {generatePortuguesePhonetics(qr.en)}
                    </p>
                    {showTranslations && (
                      <p className="text-[11px] text-slate-400">{qr.pt}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        triggerAvatarSpeech(qr.en, { rate: 0.6 })
                      }
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-[11px] flex items-center gap-1"
                      title="Ouvir como pronunciar bem devagar"
                    >
                      🐢 Ouvir
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputText(qr.en)}
                      className="flex-1 py-1 px-2 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white font-bold text-[11px] text-center transition"
                    >
                      Usar Frase →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Barra de Dica Gradual (Incentiva Recuperação Ativa antes de revelar) */}
        {currentHint && (
          <div className="px-3.5 sm:px-4 py-2.5 bg-indigo-950/40 border-t border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-indigo-200">
            <div className="flex items-start sm:items-center gap-2 min-w-0">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
              {revealHintText ? (
                <span className="leading-snug break-words">{currentHint}</span>
              ) : (
                <span className="text-slate-300 leading-snug">
                  Tente formular sua resposta primeiro! Precisa de ajuda?
                </span>
              )}
            </div>
            {!revealHintText ? (
              <button
                type="button"
                onClick={() => setRevealHintText(true)}
                className="w-full sm:w-auto px-3 py-1.5 sm:py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold shrink-0 transition border border-slate-700 text-center"
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
                className="w-full sm:w-auto px-3 py-1.5 sm:py-1 rounded-lg bg-indigo-600/40 hover:bg-indigo-600 text-white font-semibold shrink-0 transition text-center"
              >
                Preencher Sugestão
              </button>
            )}
          </div>
        )}

        {/* Input de Texto e Microfone */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <button
            type="button"
            onClick={handleToggleMic}
            className={`p-3 sm:p-3.5 rounded-xl font-semibold transition flex items-center justify-center shrink-0 ${
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
                ? '🎙️ Ouvindo sua voz...'
                : 'Digite ou fale em inglês...'
            }
            className="min-w-0 flex-1 px-3.5 sm:px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoadingAI}
            className="px-4 sm:px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-sm flex items-center gap-2 transition shadow-lg shadow-indigo-600/20 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
}
