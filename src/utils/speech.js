// Utilitário de Voz, Sincronia Labial (Lip-Sync / Karaokê), Pronúncia Pausada e Pronúncia Figurada

let activeBoundaryInterval = null;
let activeWordByWordTimeouts = [];

function clearSpeechTimers() {
  if (activeBoundaryInterval) {
    clearInterval(activeBoundaryInterval);
    activeBoundaryInterval = null;
  }
  if (activeWordByWordTimeouts.length > 0) {
    activeWordByWordTimeouts.forEach((t) => clearTimeout(t));
    activeWordByWordTimeouts = [];
  }
}

export function speakText(
  text,
  {
    rate = 0.85,
    accent = 'en-US',
    pitch = 1.0,
    onEnd,
    onStart,
    onWordBoundary,
  } = {}
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  clearSpeechTimers();
  window.speechSynthesis.cancel();

  const cleanText = String(text || '').replace(/🎵/g, '').trim();
  if (!cleanText) {
    if (onEnd) onEnd();
    return;
  }

  const words = cleanText.split(/\s+/).filter(Boolean);
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.lang = accent;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    const preferredVoice =
      voices.find(
        (v) =>
          v.lang.toLowerCase().includes(accent.toLowerCase()) &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Online'))
      ) ||
      voices.find((v) => v.lang.toLowerCase().includes(accent.toLowerCase())) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
  }

  let nativeBoundaryFired = false;
  let currentWordIdx = 0;

  if (onWordBoundary) {
    utterance.onboundary = (event) => {
      if (event.name === 'word' || typeof event.charIndex === 'number') {
        nativeBoundaryFired = true;
        const prefix = cleanText.slice(0, event.charIndex);
        const wordIdx = Math.min(
          words.length - 1,
          Math.max(0, prefix.trim() ? prefix.trim().split(/\s+/).length : 0)
        );
        currentWordIdx = wordIdx;
        onWordBoundary(wordIdx, words[wordIdx] || '');
      }
    };
  }

  utterance.onstart = () => {
    if (onStart) onStart();
    if (onWordBoundary && words.length > 0) {
      onWordBoundary(0, words[0]);
      // Fallback para celulares/vozes que não disparam onboundary nativo
      const msPerWord = Math.max(240, Math.round(370 / Math.max(0.45, rate)));
      activeBoundaryInterval = setInterval(() => {
        if (!nativeBoundaryFired) {
          currentWordIdx += 1;
          if (currentWordIdx < words.length) {
            onWordBoundary(currentWordIdx, words[currentWordIdx]);
          }
        }
      }, msPerWord);
    }
  };

  const handleFinish = () => {
    clearSpeechTimers();
    if (onWordBoundary) onWordBoundary(-1, '');
    if (onEnd) onEnd();
  };

  utterance.onend = handleFinish;
  utterance.onerror = handleFinish;

  window.speechSynthesis.speak(utterance);
}

// Reproduz uma frase pausadamente, palavra por palavra, para facilitar a escuta de iniciantes
export function speakWordByWord(
  text,
  { accent = 'en-US', rate = 0.7, pauseMs = 360, onWordBoundary, onStart, onEnd } = {}
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  clearSpeechTimers();
  window.speechSynthesis.cancel();

  const cleanText = String(text || '').replace(/🎵/g, '').trim();
  const words = cleanText.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    if (onEnd) onEnd();
    return;
  }

  if (onStart) onStart();

  const speakNext = (idx) => {
    if (idx >= words.length) {
      clearSpeechTimers();
      if (onWordBoundary) onWordBoundary(-1, '');
      if (onEnd) onEnd();
      return;
    }

    if (onWordBoundary) onWordBoundary(idx, words[idx]);

    const cleanWord = words[idx].replace(/[^a-zA-Z0-9']/g, '') || words[idx];
    const u = new SpeechSynthesisUtterance(cleanWord);
    u.rate = rate;
    u.lang = accent;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferredVoice =
        voices.find((v) => v.lang.toLowerCase().includes(accent.toLowerCase())) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('en'));
      if (preferredVoice) u.voice = preferredVoice;
    }

    u.onend = () => {
      const timer = setTimeout(() => speakNext(idx + 1), pauseMs);
      activeWordByWordTimeouts.push(timer);
    };
    u.onerror = () => {
      const timer = setTimeout(() => speakNext(idx + 1), pauseMs);
      activeWordByWordTimeouts.push(timer);
    };

    window.speechSynthesis.speak(u);
  };

  speakNext(0);
}

export function stopSpeaking() {
  clearSpeechTimers();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function createSpeechRecognition({
  lang = 'en-US',
  continuous = false,
  onResult,
  onError,
  onEnd,
} = {}) {
  if (typeof window === 'undefined') return null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.continuous = continuous;

  recognition.onresult = (event) => {
    let transcript = '';
    let isFinal = true;
    for (let i = 0; i < event.results.length; i++) {
      transcript += (i > 0 ? ' ' : '') + event.results[i][0].transcript.trim();
      if (!event.results[i].isFinal) {
        isFinal = false;
      }
    }
    if (onResult) onResult(transcript.trim(), isFinal);
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
export function evaluatePronunciation(
  targetSentence,
  spokenTranscript,
  { isInterim = false } = {}
) {
  const originalDisplayWords = String(targetSentence || '')
    .replace(/🎵/g, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const spokenTokens = normalizeEnglishTokens(spokenTranscript || '');

  if (spokenTokens.length === 0) {
    return {
      accuracy: 0,
      isInterim,
      wordAnalysis: originalDisplayWords.map((w) => ({
        word: w,
        status: isInterim ? 'pending' : 'missed',
      })),
      feedback: isInterim
        ? 'Ouvindo sua voz... continue lendo a frase em voz alta.'
        : 'Não detectamos sua voz. Tente falar um pouco mais perto do microfone.',
    };
  }

  let matchedScore = 0;
  let evaluableCount = 0;
  const usedIndices = new Set();

  const wordAnalysis = originalDisplayWords.map((rawWord) => {
    const cleanTarget = rawWord
      .toLowerCase()
      .replace(/[’']/g, "'")
      .replace(/[^a-z0-9']/g, '');

    if (!cleanTarget) {
      return { word: rawWord, status: 'pending' };
    }

    evaluableCount += 1;

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

    return { word: rawWord, status: isInterim ? 'pending' : 'missed' };
  });

  const accuracy = Math.min(
    100,
    Math.round((matchedScore / Math.max(1, evaluableCount)) * 100)
  );

  const missedWords = wordAnalysis
    .filter((w) => w.status === 'missed')
    .map((w) => w.word.replace(/[^a-zA-Z']/g, ''))
    .filter(Boolean);

  let feedback = '';
  if (isInterim) {
    feedback = '🎙️ Ouvindo em tempo real... as palavras reconhecidas ficam verdes enquanto você lê.';
  } else if (accuracy >= 90) {
    feedback = 'Excelente pronúncia e ritmo! Todas as palavras soaram claras e naturais.';
  } else if (accuracy >= 70) {
    feedback =
      missedWords.length > 0
        ? `Muito bom! Dê atenção especial à pronúncia de: "${missedWords.slice(0, 3).join(', ')}".`
        : 'Ótimo trabalho! Tente repetir mais uma vez conectando as palavras com fluidez.';
  } else {
    feedback =
      missedWords.length > 0
        ? `Ouça em velocidade reduzida (0.55x) e foque nas palavras destacadas em vermelho: "${missedWords.slice(0, 4).join(', ')}".`
        : 'Ouça o modelo em 0.55x e repita acompanhando o ritmo da frase.';
  }

  return {
    accuracy,
    isInterim,
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

// Mapa fonético intuitivo em Português Brasileiro ("Como Soa") para palavras e blocos frequentes
const PT_PHONETIC_MAP = {
  i: 'ái',
  "i'm": 'áim',
  "i'd": 'áid',
  "i'll": 'ái-ôl',
  "i've": 'áiv',
  you: 'iú',
  "you're": 'iôr',
  your: 'iôr',
  he: 'rí',
  she: 'xí',
  it: 'êt',
  "it's": 'êts',
  we: 'uí',
  "we're": 'uír',
  they: 'dêi',
  "they're": 'dér',
  them: 'dém',
  their: 'dér',
  there: 'dér',
  my: 'mái',
  me: 'mí',
  our: 'áur',
  his: 'rêz',
  her: 'râr',
  this: 'dês',
  that: 'dét',
  "that's": 'déts',
  these: 'díz',
  those: 'dôuz',
  what: 'uót',
  "what's": 'uóts',
  where: 'uér',
  when: 'uén',
  why: 'uái',
  who: 'rú',
  how: 'ráu',
  which: 'uítch',
  is: 'êz',
  are: 'ár',
  am: 'ém',
  was: 'uóz',
  were: 'uâr',
  be: 'bí',
  been: 'bín',
  being: 'bí-in',
  have: 'rév',
  has: 'réz',
  had: 'réd',
  do: 'dú',
  does: 'dâz',
  did: 'dêd',
  "don't": 'dôunt',
  "doesn't": 'dâ-zânt',
  "didn't": 'dê-dânt',
  can: 'kén',
  "can't": 'ként',
  could: 'cúd',
  would: 'uúd',
  should: 'xúd',
  will: 'uêl',
  "won't": 'uôunt',
  may: 'mêi',
  might: 'máit',
  must: 'mâst',
  to: 'tchú',
  for: 'fór',
  of: 'óv',
  in: 'ên',
  on: 'ón',
  at: 'ét',
  with: 'uêf',
  without: 'uê-dáut',
  from: 'fróm',
  by: 'bái',
  about: 'a-báut',
  into: 'ên-tchu',
  through: 'trú',
  after: 'éf-ter',
  before: 'bi-fór',
  between: 'bi-tuín',
  under: 'ân-der',
  over: 'ôu-ver',
  again: 'a-guén',
  and: 'énd',
  or: 'ór',
  but: 'bât',
  so: 'sôu',
  because: 'bi-kóz',
  if: 'êf',
  when: 'uén',
  while: 'uái-ôl',
  though: 'dôu',
  although: 'ól-dôu',
  not: 'nót',
  no: 'nôu',
  yes: 'iés',
  yeah: 'ié',
  please: 'plíz',
  thank: 'ténk',
  thanks: 'ténks',
  sorry: 'só-ri',
  excuse: 'iks-kiúz',
  welcome: 'uél-câm',
  hi: 'rái',
  hello: 're-lôu',
  hey: 'rêi',
  good: 'gúd',
  morning: 'mór-nin',
  afternoon: 'éf-ter-nún',
  evening: 'ív-nin',
  night: 'náit',
  today: 'tchu-dêi',
  tomorrow: 'tchu-mó-rou',
  yesterday: 'iés-ter-dêi',
  now: 'náu',
  here: 'rír',
  right: 'ráit',
  very: 'vé-ri',
  much: 'mâtch',
  more: 'mór',
  most: 'môust',
  some: 'sâm',
  any: 'é-ni',
  all: 'ól',
  every: 'é-vri',
  everything: 'é-vri-tin',
  something: 'sâm-tin',
  nothing: 'nâ-tin',
  anything: 'é-ni-tin',
  someone: 'sâm-uãn',
  always: 'ól-uêiz',
  never: 'né-ver',
  usually: 'iú-ju-a-li',
  often: 'ó-fen',
  sometimes: 'sâm-táimz',
  really: 'rí-li',
  just: 'djâst',
  only: 'ôun-li',
  also: 'ól-sôu',
  too: 'tchú',
  well: 'uél',
  still: 'stêl',
  already: 'ól-ré-di',
  maybe: 'mêi-bi',
  sure: 'xúr',
  help: 'rélp',
  need: 'níd',
  want: 'uónt',
  like: 'láik',
  love: 'lâv',
  know: 'nôu',
  think: 'tínk',
  take: 'têik',
  make: 'mêik',
  get: 'guét',
  getting: 'gué-rin',
  give: 'guêv',
  go: 'gôu',
  going: 'gôu-in',
  come: 'câm',
  coming: 'câ-min',
  see: 'sí',
  look: 'lúk',
  looking: 'lú-kin',
  forward: 'fór-uârd',
  find: 'fáind',
  use: 'iúz',
  work: 'uârk',
  working: 'uâr-kin',
  try: 'trái',
  trying: 'trái-in',
  ask: 'ésk',
  tell: 'tél',
  say: 'sêi',
  speak: 'spík',
  talk: 'tók',
  listen: 'lê-sen',
  hear: 'rír',
  call: 'kól',
  wait: 'uêit',
  waiting: 'uêi-rin',
  stay: 'stêi',
  staying: 'stêi-in',
  leave: 'lív',
  keep: 'kíp',
  let: 'lét',
  "let's": 'léts',
  begin: 'bi-guên',
  start: 'stárt',
  started: 'stár-têd',
  stop: 'stóp',
  change: 'tchêindj',
  switch: 'suítch',
  turn: 'târn',
  open: 'ôu-pen',
  close: 'clôuz',
  buy: 'bái',
  pay: 'pêi',
  bring: 'brín',
  understand: 'ân-der-sténd',
  remember: 'ri-mém-ber',
  forget: 'for-guét',
  learn: 'lârn',
  learning: 'lâr-nin',
  study: 'stâ-di',
  practice: 'prék-tês',
  figure: 'fí-guer',
  out: 'áut',
  grab: 'gréb',
  bite: 'báit',
  coffee: 'kó-fi',
  tea: 'tí',
  water: 'uó-rer',
  milk: 'mêlk',
  oat: 'ôut',
  iced: 'áist',
  hot: 'rót',
  cold: 'côuld',
  small: 'smól',
  medium: 'mí-di-âm',
  large: 'lárdj',
  card: 'kárd',
  credit: 'cré-dêt',
  cash: 'kéx',
  room: 'rúm',
  hotel: 'rôu-tél',
  reservation: 'ré-zer-vêi-xân',
  airport: 'ér-pórt',
  flight: 'fláit',
  passport: 'pés-pórt',
  visit: 'vê-zêt',
  purpose: 'pâr-pâs',
  vacation: 'vei-kêi-xân',
  business: 'bêz-nês',
  days: 'dêiz',
  week: 'uík',
  weeks: 'uíks',
  time: 'táim',
  day: 'dêi',
  year: 'iír',
  years: 'iírz',
  people: 'pí-pôl',
  way: 'uêi',
  thing: 'tín',
  things: 'tínz',
  life: 'láif',
  world: 'uârld',
  place: 'plêis',
  problem: 'pró-blêm',
  question: 'kués-tchân',
  questions: 'kués-tchânz',
  team: 'tím',
  project: 'pró-djekt',
  meeting: 'mí-rin',
  deadline: 'déd-láin',
  schedule: 'ské-djul',
  double: 'dâ-bôl',
  edged: 'éd-jêd',
  sword: 'sórd',
  mind: 'máind',
  matter: 'mé-rer',
  actually: 'ék-tchu-a-li',
  probably: 'pró-ba-bli',
  instead: 'in-stéd',
  together: 'tchu-gué-der',
  wonderful: 'uân-der-fôl',
  great: 'grêit',
  awesome: 'ó-sâm',
  perfect: 'pâr-fekt',
  nice: 'náis',
  happy: 'ré-pi',
  ready: 'ré-di',
  able: 'êi-bôl',
  possible: 'pó-si-bôl',
};

function approximateWordToPt(rawWord) {
  const match = rawWord.match(/^([^a-zA-Z0-9']*)([a-zA-Z0-9'’]+)([^a-zA-Z0-9']*)$/);
  if (!match) return rawWord;
  const [, prefix, core, suffix] = match;
  const lower = core.toLowerCase().replace(/’/g, "'");

  if (PT_PHONETIC_MAP[lower]) {
    const mapped = PT_PHONETIC_MAP[lower];
    const isCapital = core[0] === core[0].toUpperCase() && core[0] !== core[0].toLowerCase();
    const formatted = isCapital ? mapped.charAt(0).toUpperCase() + mapped.slice(1) : mapped;
    return `${prefix}${formatted}${suffix}`;
  }

  // Regras fonéticas aproximadas para palavras fora do dicionário
  let approx = lower
    .replace(/tion\b/g, 'xân')
    .replace(/sion\b/g, 'jân')
    .replace(/igh/g, 'ái')
    .replace(/ough/g, 'ôu')
    .replace(/augh/g, 'ó')
    .replace(/ph/g, 'f')
    .replace(/sh/g, 'x')
    .replace(/ch/g, 'tch')
    .replace(/^th/g, 'd')
    .replace(/th/g, 'f')
    .replace(/wh/g, 'u')
    .replace(/^w/g, 'u')
    .replace(/^h/g, 'r')
    .replace(/ee/g, 'í')
    .replace(/ea/g, 'í')
    .replace(/oo/g, 'ú')
    .replace(/ou/g, 'áu')
    .replace(/ow/g, 'áu')
    .replace(/ay\b/g, 'êi')
    .replace(/ey\b/g, 'êi')
    .replace(/ing\b/g, 'in')
    .replace(/ed\b/g, 'd')
    .replace(/er\b/g, 'er')
    .replace(/le\b/g, 'ôl')
    .replace(/ck/g, 'k')
    .replace(/qu/g, 'ku')
    .replace(/^kn/g, 'n')
    .replace(/^wr/g, 'r');

  if (approx.length > 2 && approx.endsWith('e') && !approx.endsWith('ee')) {
    approx = approx.slice(0, -1);
  }

  const isCapital = core[0] === core[0].toUpperCase() && core[0] !== core[0].toLowerCase();
  if (isCapital && approx.length > 0) {
    approx = approx.charAt(0).toUpperCase() + approx.slice(1);
  }

  return `${prefix}${approx}${suffix}`;
}

export function generatePortuguesePhonetics(sentence) {
  if (!sentence) return '';
  const clean = String(sentence).replace(/🎵/g, '').trim();
  if (!clean) return '';
  return clean
    .split(/\s+/)
    .map((w) => approximateWordToPt(w))
    .join(' ');
}
