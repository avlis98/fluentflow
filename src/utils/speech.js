// Utilitário de Voz, Shadowing e Recuperação Ativa (Web Speech API)

export function speakText(text, { rate = 1.0, accent = 'en-US', onEnd, onStart } = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.lang = accent;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    const preferredVoice =
      voices.find(
        (v) =>
          v.lang.toLowerCase().includes(accent.toLowerCase()) &&
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online'))
      ) ||
      voices.find((v) => v.lang.toLowerCase().includes(accent.toLowerCase())) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function createSpeechRecognition({ lang = 'en-US', onResult, onError, onEnd } = {}) {
  if (typeof window === 'undefined') return null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onresult = (event) => {
    let transcript = '';
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        isFinal = true;
      }
    }
    if (onResult) onResult(transcript, isFinal);
  };

  recognition.onerror = (event) => {
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
}

// Normaliza contrações para comparação justa de fala e escrita
function normalizeEnglishTokens(str) {
  return str
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\byou're\b/g, 'you are')
    .replace(/\bwe're\b/g, 'we are')
    .replace(/\bthey're\b/g, 'they are')
    .replace(/\bhe's\b/g, 'he is')
    .replace(/\bshe's\b/g, 'she is')
    .replace(/\bit's\b/g, 'it is')
    .replace(/\bdon't\b/g, 'do not')
    .replace(/\bdoesn't\b/g, 'does not')
    .replace(/\bdidn't\b/g, 'did not')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bi'd\b/g, 'i would')
    .replace(/\bi'll\b/g, 'i will')
    .replace(/\bwe'll\b/g, 'we will')
    .replace(/\bgonna\b/g, 'going to')
    .replace(/\bwanna\b/g, 'want to')
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function levenshteinDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[a.length][b.length];
}

// Avalia a pronúncia no modo Shadowing comparando a frase modelo e a transcrição reconhecida
export function evaluatePronunciation(targetSentence, spokenTranscript) {
  const originalDisplayWords = targetSentence
    .replace(/🎵/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const spokenTokens = normalizeEnglishTokens(spokenTranscript || '');

  if (spokenTokens.length === 0) {
    return {
      accuracy: 0,
      wordAnalysis: originalDisplayWords.map((w) => ({
        word: w,
        status: 'missed',
      })),
      feedback: 'Não detectamos sua voz. Tente falar um pouco mais perto do microfone.',
    };
  }

  let matchedScore = 0;
  const usedIndices = new Set();

  const wordAnalysis = originalDisplayWords.map((rawWord) => {
    const cleanTarget = rawWord
      .toLowerCase()
      .replace(/[’']/g, "'")
      .replace(/[^a-z0-9']/g, '');

    if (!cleanTarget) {
      return { word: rawWord, status: 'correct' };
    }

    // Procura correspondência exata
    let foundIdx = spokenTokens.findIndex(
      (tok, idx) => !usedIndices.has(idx) && tok === cleanTarget
    );

    if (foundIdx !== -1) {
      usedIndices.add(foundIdx);
      matchedScore += 1;
      return { word: rawWord, status: 'correct' };
    }

    // Procura correspondência aproximada (fonética/Levenshtein)
    let bestIdx = -1;
    let bestSim = 0;
    spokenTokens.forEach((tok, idx) => {
      if (usedIndices.has(idx)) return;
      const dist = levenshteinDistance(cleanTarget, tok);
      const maxLen = Math.max(cleanTarget.length, tok.length, 1);
      const sim = 1 - dist / maxLen;
      if (sim > bestSim) {
        bestSim = sim;
        bestIdx = idx;
      }
    });

    if (bestSim >= 0.65 && bestIdx !== -1) {
      usedIndices.add(bestIdx);
      matchedScore += 0.75;
      return { word: rawWord, status: 'close' };
    }

    return { word: rawWord, status: 'missed' };
  });

  const accuracy = Math.min(
    100,
    Math.round((matchedScore / Math.max(1, originalDisplayWords.length)) * 100)
  );

  const missedWords = wordAnalysis
    .filter((w) => w.status === 'missed')
    .map((w) => w.word.replace(/[^a-zA-Z']/g, ''))
    .filter(Boolean);

  let feedback = '';
  if (accuracy >= 90) {
    feedback = 'Excelente pronúncia e ritmo! Todas as palavras soaram claras e naturais.';
  } else if (accuracy >= 70) {
    feedback =
      missedWords.length > 0
        ? `Muito bom! Dê atenção especial à pronúncia de: "${missedWords.slice(0, 3).join(', ')}".`
        : 'Ótimo trabalho! Tente repetir mais uma vez conectando as palavras com fluidez.';
  } else {
    feedback =
      missedWords.length > 0
        ? `Ouça em velocidade reduzida (0.75x) e foque nas palavras destacadas em vermelho: "${missedWords.slice(0, 4).join(', ')}".`
        : 'Ouça o modelo em 0.75x e repita acompanhando o ritmo da frase.';
  }

  return {
    accuracy,
    wordAnalysis,
    feedback,
  };
}

// Gera pistas graduais (nível 1, 2 e 3) para Recuperação Ativa sem entregar a resposta de imediato
export function generateProgressiveHint(targetPhrase, level = 1) {
  const words = targetPhrase.trim().split(/\s+/);
  if (level <= 0) return '';

  if (level === 1) {
    // Nível 1: mostra a quantidade de palavras e a primeira palavra ou iniciais ocultas
    return `Estrutura (${words.length} ${words.length === 1 ? 'palavra' : 'palavras'}): ` +
      words
        .map((w, idx) =>
          idx === 0
            ? w[0] + '_'.repeat(Math.max(1, w.length - 1))
            : '_'.repeat(w.length)
        )
        .join(' ');
  }

  if (level === 2) {
    // Nível 2: mostra a primeira letra de cada palavra
    return (
      'Iniciais: ' +
      words
        .map((w) => {
          const clean = w.replace(/[^a-zA-Z]/g, '');
          if (clean.length <= 1) return w;
          return w[0] + '_'.repeat(Math.max(1, w.length - 1));
        })
        .join(' ')
    );
  }

  // Nível 3: mostra metade das letras de cada palavra
  return (
    'Quase lá: ' +
    words
      .map((w) => {
        const half = Math.ceil(w.length / 2);
        return w.slice(0, half) + '_'.repeat(Math.max(0, w.length - half));
      })
      .join(' ')
  );
}
