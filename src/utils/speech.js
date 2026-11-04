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
  a: 'a',
  an: 'én',
  the: 'dê',
  arrange: 'a-rêindj',
  away: 'a-uêi',
  back: 'bék',
  become: 'bi-câm',
  best: 'bést',
  conversation: 'cón-ver-sêi-xân',
  during: 'diú-rin',
  even: 'í-ven',
  home: 'rôum',
  impact: 'ím-pékt',
  instead: 'in-stéd',
  movie: 'mú-vi',
  results: 'ri-zâlts',
  review: 'ri-viú',
  i: 'ái',
  "i'm": 'áim',
  "i'd": 'áid',
  "i'll": 'ái-ôl',
  "i've": 'áiv',
  you: 'iú',
  "you're": 'iôr',
  your: 'iôr',
  he: 'rí',
  him: 'rêm',
  his: 'rêz',
  she: 'xí',
  her: 'râr',
  it: 'êt',
  "it's": 'êts',
  we: 'uí',
  "we're": 'uír',
  "we'll": 'uí-ôl',
  they: 'dêi',
  "they're": 'dér',
  them: 'dém',
  their: 'dér',
  there: 'dér',
  my: 'mái',
  me: 'mí',
  our: 'áur',
  this: 'dês',
  that: 'dét',
  "that's": 'déts',
  these: 'díz',
  those: 'dôuz',
  what: 'uót',
  "what's": 'uóts',
  where: 'uér',
  when: 'uén',
  whenever: 'ué-né-ver',
  why: 'uái',
  who: 'rú',
  how: 'ráu',
  however: 'ráu-é-ver',
  which: 'uítch',
  while: 'uáil',
  is: 'êz',
  "isn't": 'ê-zânt',
  are: 'ár',
  "aren't": 'árnt',
  am: 'ém',
  was: 'uóz',
  "wasn't": 'uó-zânt',
  were: 'uâr',
  be: 'bí',
  been: 'bín',
  being: 'bí-in',
  have: 'rév',
  having: 'ré-vin',
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
  off: 'óf',
  in: 'ên',
  on: 'ón',
  at: 'ét',
  as: 'éz',
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
  beyond: 'bi-iónd',
  under: 'ân-der',
  over: 'ôu-ver',
  again: 'a-guén',
  against: 'a-guênst',
  across: 'a-crós',
  among: 'a-mâng',
  around: 'a-ráund',
  up: 'âp',
  down: 'dáun',
  out: 'áut',
  and: 'énd',
  or: 'ór',
  but: 'bât',
  so: 'sôu',
  yet: 'iét',
  because: 'bi-kóz',
  if: 'êf',
  though: 'dôu',
  although: 'ól-dôu',
  than: 'dén',
  then: 'dén',
  not: 'nót',
  no: 'nôu',
  yes: 'iés',
  yeah: 'ié',
  oh: 'ôu',
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
  nights: 'náits',
  tonight: 'tchu-náit',
  today: 'tchu-dêi',
  tomorrow: 'tchu-mó-rou',
  yesterday: 'iés-ter-dêi',
  now: 'náu',
  here: 'rír',
  right: 'ráit',
  alright: 'ól-ráit',
  very: 'vé-ri',
  much: 'mâtch',
  many: 'mé-ni',
  more: 'mór',
  most: 'môust',
  less: 'lés',
  some: 'sâm',
  any: 'é-ni',
  all: 'ól',
  almost: 'ól-môust',
  alone: 'a-lôun',
  along: 'a-lóng',
  another: 'a-nâ-der',
  other: 'â-der',
  others: 'â-derz',
  every: 'é-vri',
  everyone: 'é-vri-uãn',
  everything: 'é-vri-tin',
  something: 'sâm-tin',
  nothing: 'nâ-tin',
  anything: 'é-ni-tin',
  someone: 'sâm-uãn',
  always: 'ól-uêiz',
  never: 'né-ver',
  forever: 'fó-ré-ver',
  usually: 'iú-ju-a-li',
  often: 'ó-fen',
  sometimes: 'sâm-táimz',
  rarely: 'rér-li',
  barely: 'bér-li',
  really: 'rí-li',
  just: 'djâst',
  only: 'ôun-li',
  also: 'ól-sôu',
  too: 'tchú',
  well: 'uél',
  still: 'stêl',
  already: 'ól-ré-di',
  maybe: 'mêi-bi',
  perhaps: 'per-réps',
  probably: 'pró-ba-bli',
  actually: 'ék-tchu-a-li',
  currently: 'kâr-rent-li',
  recently: 'rí-sent-li',
  finally: 'fái-na-li',
  suddenly: 'sâ-den-li',
  quickly: 'kuík-li',
  slowly: 'slôu-li',
  freshly: 'fréx-li',
  friendly: 'frénd-li',
  properly: 'pró-per-li',
  certainly: 'sâr-ten-li',
  sincerely: 'sin-sír-li',
  globally: 'glôu-ba-li',
  ultimately: 'âl-ti-met-li',
  ruthlessly: 'rúf-les-li',
  ruthlessy: 'rúf-les-li',
  asynchronously: 'êi-sín-kro-nâs-li',
  asynchronous: 'êi-sín-kro-nâs',
  sure: 'xúr',
  quite: 'kuáit',
  quiet: 'kuái-et',
  quick: 'kuík',
  help: 'rélp',
  helped: 'rélpt',
  need: 'níd',
  want: 'uónt',
  wanna: 'uó-na',
  gonna: 'gó-na',
  like: 'láik',
  love: 'lâv',
  lovely: 'lâv-li',
  know: 'nôu',
  knowledge: 'nó-ledj',
  think: 'tínk',
  thinking: 'tín-kin',
  thought: 'tót',
  take: 'têik',
  takes: 'têiks',
  taking: 'têi-kin',
  make: 'mêik',
  makes: 'mêiks',
  making: 'mêi-kin',
  get: 'guét',
  gets: 'guéts',
  getting: 'gué-rin',
  got: 'gót',
  give: 'guêv',
  gave: 'guêiv',
  go: 'gôu',
  going: 'gôu-in',
  went: 'uént',
  come: 'câm',
  comes: 'câmz',
  coming: 'câ-min',
  see: 'sí',
  seem: 'sím',
  look: 'lúk',
  looks: 'lúks',
  looked: 'lúkt',
  looking: 'lú-kin',
  forward: 'fór-uârd',
  find: 'fáind',
  found: 'fáund',
  use: 'iúz',
  used: 'iúzd',
  work: 'uârk',
  works: 'uârks',
  working: 'uâr-kin',
  worked: 'uârkt',
  try: 'trái',
  trying: 'trái-in',
  ask: 'ésk',
  tell: 'tél',
  say: 'sêi',
  saying: 'sêi-in',
  speak: 'spík',
  talk: 'tók',
  talking: 'tó-kin',
  listen: 'lê-sen',
  listens: 'lê-senz',
  hear: 'rír',
  hearing: 'rí-rin',
  call: 'kól',
  wait: 'uêit',
  waiting: 'uêi-rin',
  stay: 'stêi',
  staying: 'stêi-in',
  stand: 'sténd',
  standing: 'stén-din',
  walk: 'uók',
  walking: 'uó-kin',
  run: 'rân',
  running: 'râ-nin',
  sit: 'sêt',
  sitting: 'sê-rin',
  step: 'stép',
  steps: 'stéps',
  stepped: 'stépt',
  stepping: 'sté-pin',
  leave: 'lív',
  keep: 'kíp',
  put: 'pút',
  set: 'sét',
  let: 'lét',
  "let's": 'léts',
  begin: 'bi-guên',
  start: 'stárt',
  started: 'stár-têd',
  stop: 'stóp',
  change: 'tchêindj',
  changes: 'tchêin-djez',
  switch: 'suítch',
  turn: 'târn',
  turning: 'târ-nin',
  open: 'ôu-pen',
  close: 'clôuz',
  buy: 'bái',
  pay: 'pêi',
  bring: 'brín',
  build: 'bêld',
  building: 'bêl-din',
  built: 'bêlt',
  create: 'cri-êit',
  decide: 'di-sáid',
  decided: 'di-sái-ded',
  decision: 'di-sê-jân',
  decisions: 'di-sê-jânz',
  understand: 'ân-der-sténd',
  remember: 'ri-mém-ber',
  forget: 'for-guét',
  forgive: 'for-guêv',
  learn: 'lârn',
  learning: 'lâr-nin',
  study: 'stâ-di',
  practice: 'prék-tês',
  figure: 'fí-guer',
  grab: 'gréb',
  grabs: 'grébz',
  bite: 'báit',
  wake: 'uêik',
  wakes: 'uêiks',
  waking: 'uêi-kin',
  stretch: 'strétch',
  stretches: 'stré-tchez',
  rush: 'râx',
  rushes: 'râ-xez',
  watch: 'uótch',
  watching: 'uó-tchin',
  enjoy: 'in-djói',
  enjoys: 'in-djóiz',
  enjoyed: 'in-djóid',
  feel: 'fíl',
  feels: 'fílz',
  feeling: 'fí-lin',
  arrive: 'a-ráiv',
  arrived: 'a-ráivd',
  pour: 'pór',
  pouring: 'pó-rin',
  realize: 'rí-a-láiz',
  realized: 'rí-a-láizd',
  delay: 'di-lêi',
  delayed: 'di-lêid',
  order: 'ór-der',
  ordered: 'ór-derd',
  bake: 'bêik',
  baked: 'bêikt',
  bakery: 'bêi-ke-ri',
  strike: 'stráik',
  struck: 'strâk',
  chase: 'tchêis',
  chasing: 'tchêi-sin',
  hold: 'rôuld',
  fade: 'fêid',
  faded: 'fêi-ded',
  shout: 'xáut',
  require: 'ri-kuái-er',
  requires: 'ri-kuái-erz',
  demand: 'di-ménd',
  demands: 'di-méndz',
  send: 'sénd',
  sending: 'sén-din',
  provide: 'pro-váid',
  respond: 'ris-pónd',
  reduce: 'ri-dús',
  empower: 'im-páu-er',
  define: 'di-fáin',
  defined: 'di-fáind',
  conflate: 'con-flêit',
  answer: 'én-ser',
  answering: 'én-se-rin',
  stem: 'stém',
  check: 'tchék',
  checking: 'tché-kin',
  emerge: 'i-mârdj',
  carve: 'kárv',
  tackle: 'té-kôl',
  tackled: 'té-kôld',
  master: 'més-ter',
  mastering: 'més-te-rin',
  squeeze: 'skuíz',
  squeezing: 'skuí-zin',
  eliminate: 'i-lí-mi-nêit',
  serve: 'sârv',
  serves: 'sârvz',
  served: 'sârvd',
  believe: 'bi-lív',
  choose: 'tchúz',
  explain: 'iks-plêin',
  follow: 'fó-lou',
  happen: 'ré-pen',
  hope: 'rôup',
  improve: 'im-prúv',
  improved: 'im-prúvd',
  live: 'lêv',
  living: 'lê-vin',
  miss: 'mês',
  missing: 'mê-sin',
  promise: 'pró-mês',
  reach: 'rítch',
  share: 'xér',
  smile: 'smáil',
  sound: 'sáund',
  sounds: 'sáundz',
  support: 'su-pórt',
  teach: 'títch',
  travel: 'tré-vôl',
  travelers: 'tré-ve-lerz',
  worry: 'uô-ri',
  write: 'ráit',
  book: 'búk',
  booked: 'búkt',
  booking: 'bú-kin',
  receive: 'ri-sív',
  prefer: 'pri-fâr',
  tap: 'tép',
  return: 'ri-târn',
  join: 'djóin',
  joining: 'djói-nin',
  kick: 'kík',
  handle: 'rén-dôl',
  handled: 'rén-dôld',
  face: 'fêis',
  faced: 'fêist',
  break: 'brêik',
  wrap: 'rép',
  scale: 'skêil',
  scaling: 'skêi-lin',
  assist: 'a-sêst',
  notice: 'nôu-tês',
  noticed: 'nôu-têst',
  apologize: 'a-pó-lo-djáiz',
  upgrade: 'âp-grêid',
  appreciate: 'a-prí-xi-êit',
  solve: 'sólv',
  solving: 'sól-vin',
  solved: 'sólvd',
  read: 'ríd',
  reading: 'rí-din',
  reader: 'rí-der',
  load: 'lôud',
  loading: 'lôu-din',
  set: 'sét',
  coffee: 'kó-fi',
  tea: 'tí',
  water: 'uó-rer',
  milk: 'mêlk',
  oat: 'ôut',
  iced: 'áist',
  hot: 'rót',
  cold: 'côuld',
  warm: 'uórm',
  small: 'smól',
  medium: 'mí-di-âm',
  large: 'lárdj',
  card: 'kárd',
  keycard: 'kí-kárd',
  credit: 'cré-dêt',
  cash: 'kéx',
  room: 'rúm',
  rooms: 'rúmz',
  hotel: 'rôu-tél',
  reservation: 'ré-zer-vêi-xân',
  airport: 'ér-pórt',
  flight: 'fláit',
  passport: 'pés-pórt',
  visit: 'vê-zêt',
  visiting: 'vê-ze-tin',
  purpose: 'pâr-pâs',
  vacation: 'vei-kêi-xân',
  business: 'bêz-nês',
  busyness: 'bê-zi-nes',
  day: 'dêi',
  days: 'dêiz',
  weekdays: 'uík-dêiz',
  friday: 'frái-dêi',
  november: 'no-vém-ber',
  week: 'uík',
  weeks: 'uíks',
  month: 'mânf',
  year: 'iír',
  years: 'iírz',
  time: 'táim',
  timeline: 'táim-láin',
  hour: 'áu-er',
  hours: 'áu-erz',
  minute: 'mê-net',
  minutes: 'mê-nets',
  second: 'sé-când',
  moment: 'môu-ment',
  era: 'é-ra',
  future: 'fiú-tcher',
  history: 'rês-to-ri',
  people: 'pí-pôl',
  person: 'pâr-sôn',
  family: 'fé-mi-li',
  friend: 'frénd',
  friends: 'fréndz',
  kid: 'kêd',
  way: 'uêi',
  thing: 'tín',
  things: 'tínz',
  life: 'láif',
  world: 'uârld',
  country: 'cân-tri',
  city: 'sê-ri',
  town: 'táun',
  midtown: 'mêd-táun',
  downtown: 'dáun-táun',
  street: 'strít',
  avenue: 'é-ve-niu',
  place: 'plêis',
  apartment: 'a-párt-ment',
  station: 'stêi-xân',
  subway: 'sâb-uêi',
  train: 'trêin',
  cab: 'kéb',
  gate: 'guêit',
  platform: 'plét-fórm',
  board: 'bórd',
  departure: 'di-pár-tcher',
  ticket: 'tê-ket',
  luggage: 'lâ-guedj',
  backpack: 'bék-pék',
  phone: 'fôun',
  cup: 'câp',
  podcast: 'pód-kést',
  commute: 'ca-miút',
  rain: 'rêin',
  storm: 'stórm',
  fog: 'fóg',
  weather: 'ué-der',
  scone: 'skôun',
  breakfast: 'brék-fâst',
  drink: 'drínk',
  counter: 'cáun-ter',
  restaurant: 'rés-to-rânt',
  garden: 'gár-den',
  lounge: 'láundj',
  suite: 'suít',
  floor: 'flór',
  beach: 'bítch',
  shadows: 'xé-douz',
  memories: 'mé-mo-riz',
  memory: 'mé-mo-ri',
  name: 'nêim',
  doubts: 'dáuts',
  voice: 'vóis',
  silence: 'sái-lens',
  music: 'miú-zik',
  light: 'láit',
  heart: 'rárt',
  dream: 'drím',
  dreams: 'drímz',
  truth: 'trúf',
  money: 'mâ-ni',
  power: 'páu-er',
  story: 'stó-ri',
  success: 'sâk-sés',
  system: 'sês-tem',
  problem: 'pró-blêm',
  problems: 'pró-blêmz',
  question: 'kués-tchân',
  questions: 'kués-tchânz',
  example: 'ig-zém-pôl',
  reason: 'rí-zôn',
  choice: 'tchóis',
  course: 'kórs',
  detail: 'dí-têil',
  event: 'i-vént',
  experience: 'iks-pí-ri-êns',
  experienced: 'iks-pí-ri-ênst',
  journey: 'djâr-ni',
  language: 'lén-guedj',
  english: 'ín-glix',
  team: 'tím',
  teams: 'tímz',
  "team's": 'tímz',
  project: 'pró-djekt',
  meeting: 'mí-rin',
  meetings: 'mí-rinz',
  deadline: 'déd-láin',
  schedule: 'ské-djul',
  double: 'dâ-bôl',
  edged: 'éd-jêd',
  sword: 'sórd',
  mind: 'máind',
  matter: 'mé-rer',
  together: 'tchu-gué-der',
  wonder: 'uân-der',
  wonderful: 'uân-der-fôl',
  great: 'grêit',
  awesome: 'ó-sâm',
  fantastic: 'fan-tés-tik',
  perfect: 'pâr-fekt',
  nice: 'náis',
  happy: 'ré-pi',
  ready: 'ré-di',
  able: 'êi-bôl',
  available: 'a-vêi-la-bôl',
  possible: 'pó-si-bôl',
  strong: 'stróng',
  crowded: 'cráu-ded',
  exciting: 'ik-sái-tin',
  heavy: 'ré-vi',
  frustrated: 'frâs-trêi-ted',
  cozy: 'côu-zi',
  nearby: 'nír-bái',
  near: 'nír',
  local: 'lôu-côl',
  next: 'nékst',
  amazing: 'a-mêi-zin',
  tips: 'têps',
  hidden: 'rê-den',
  gem: 'djém',
  gems: 'djémz',
  brighter: 'brái-ter',
  distributed: 'dis-trí-biu-ted',
  different: 'dê-frent',
  difficult: 'dê-fi-côlt',
  Zones: 'zôunz',
  zones: 'zôunz',
  fluent: 'flú-ent',
  clear: 'clír',
  concise: 'con-sáis',
  communication: 'co-miu-ni-kêi-xân',
  vague: 'vêig',
  message: 'mé-sedj',
  reply: 'ri-plái',
  professionals: 'pro-fé-xo-nôlz',
  full: 'fôl',
  context: 'cón-tekst',
  upfront: 'âp-frânt',
  colleagues: 'kó-ligz',
  online: 'ón-láin',
  structured: 'strâk-tcherd',
  updates: 'âp-dêits',
  updated: 'âp-dêi-ted',
  unnecessary: 'ân-né-ce-sé-ri',
  deep: 'díp',
  relentless: 'ri-lént-les',
  connectivity: 'co-nek-tí-vi-ti',
  frantic: 'frén-tik',
  meaningful: 'mí-nin-fôl',
  accomplishment: 'a-kâm-plix-ment',
  dozens: 'dâ-zenz',
  notifications: 'nôu-ti-fi-kêi-xânz',
  productive: 'pro-dâk-tiv',
  productivity: 'prôu-dâk-tí-vi-ti',
  fragments: 'frég-ments',
  attention: 'a-tén-xân',
  span: 'spén',
  true: 'trú',
  breakthroughs: 'brêik-truz',
  trivial: 'trí-vi-ôl',
  tasks: 'tésks',
  rather: 'ré-der',
  uninterrupted: 'ân-in-te-râp-ted',
  blocks: 'blóks',
  complex: 'cóm-pleks',
  discernment: 'di-sârn-ment',
  longer: 'lón-guer',
  long: 'lóng',
  term: 'târm',
  vision: 'vê-jân',
  early: 'âr-li',
  late: 'lêit',
  easy: 'í-zi',
  hard: 'rárd',
  fast: 'fést',
  new: 'niú',
  old: 'ôuld',
  young: 'iâng',
  big: 'bêg',
  biggest: 'bê-guest',
  little: 'lê-tôl',
  bit: 'bêt',
  lot: 'lót',
  plenty: 'plén-ti',
  enough: 'i-nâf',
  several: 'sé-ve-rôl',
  whole: 'rôul',
  important: 'im-pór-tânt',
  interesting: 'ín-tres-tin',
  simple: 'sêm-pôl',
  wrong: 'róng',
  tight: 'táit',
  spacious: 'spêi-xâs',
  hungry: 'rân-gri',
  outdoor: 'áut-dór',
  social: 'sôu-xôl',
  media: 'mí-di-a',
  software: 'sóf-tuér',
  regular: 'ré-guiu-lar',
  total: 'tôu-tôl',
  trip: 'trêp',
  background: 'bék-gráund',
  challenging: 'tché-len-djin',
  challenge: 'tché-lendj',
  challenges: 'tché-len-djez',
  key: 'kí',
  feature: 'fí-tcher',
  proactive: 'prôu-ék-tiv',
  approach: 'a-prôutch',
  part: 'párt',
  role: 'rôul',
  culture: 'câl-tcher',
  typical: 'tê-pi-côl',
  priorities: 'prai-ó-ri-tiz',
  quarter: 'kuór-ter',
  autonomy: 'ó-tó-no-mi',
  main: 'mêin',
  focus: 'fôu-câs',
  touch: 'tâtch',
  soon: 'sún',
  air: 'ér',
  conditioning: 'con-dê-xo-nin',
  inconvenience: 'in-con-ví-ni-êns',
  fifth: 'fêft',
  extra: 'éks-tra',
  charge: 'tchárdj',
  else: 'éls',
  seven: 'sé-ven',
  ten: 'tén',
  '10th': 'ténf',
  thirty: 'târ-ti',
  forty: 'fór-ti',
  five: 'fáiv',
  two: 'tchú',
  three: 'trí',
  "o'clock": 'o-clók',
  lucas: 'Lú-cas',
  clara: 'Clé-ra',
  sarah: 'Sé-ra',
  oliver: 'Ó-li-ver',
  brooklyn: 'Brúk-lin',
  manhattan: 'Man-ré-tân',
  london: 'Lân-dôn',
  edinburgh: 'É-din-bô-rô',
  scotland: 'Skót-lând',
  kensington: 'Kén-zing-tôn',
  grand: 'Grénd',
  "king's": 'Kíngz',
  cross: 'Crós',
  earl: 'Ârl',
  grey: 'Grêi',
  bean: 'Bín',
  brew: 'Brú',
  nyc: 'Én-Uái-Sí',
  united: 'Iu-nái-ted',
  states: 'Stêits',
  officer: 'Ó-fi-cer',
  b12: 'Bí-tuélv',
  arms: 'ármz',
  pull: 'púl',
  request: 'ri-kuést',
  description: 'dis-crêp-xân',
  negotiation: 'ni-gôu-xi-êi-xân',
  progresses: 'pro-gré-sez',
  leaders: 'lí-derz',
  leadership: 'lí-der-xêp',
  politeness: 'po-láit-nes',
  agreement: 'a-grí-ment',
  issues: 'ê-xuz',
  issue: 'ê-xu',
  lack: 'lék',
  clarity: 'clé-ri-ti',
  clarify: 'clé-ri-fái',
  performance: 'per-fór-mâns',
  bottleneck: 'bó-tôl-nék',
  pressure: 'pré-xer',
  pursuit: 'per-sút',
  excellence: 'ék-se-lens',
  inspired: 'in-spái-erd',
  solution: 'so-lú-xân',
  presentation: 'pré-zen-têi-xân',
  report: 'ri-pórt',
  feedback: 'fíd-bék',
  "client's": 'clái-ents',
  test: 'tést',
  boundaries: 'báun-da-riz',
  inside: 'in-sáid',
  noise: 'nóiz',
  number: 'nâm-ber',
  since: 'sêns',
  toward: 'tchu-órd',
  until: 'ân-têl',
  due: 'diú',
  growth: 'grôuf',
  company: 'câm-pa-ni',
};

function approximateSingleWordToPt(rawWord) {
  const match = rawWord.match(
    /^([^a-zA-Z0-9]*)(['’]?)([a-zA-Z0-9]+(?:['’][a-zA-Z0-9]+)*)(['’]?)([^a-zA-Z0-9]*)$/
  );
  if (!match) return rawWord;
  const [, leadPunct, leadQuote, core, trailQuote, trailPunct] = match;
  const prefix = `${leadPunct}${leadQuote}`;
  const suffix = `${trailQuote}${trailPunct}`;
  const lower = core.toLowerCase().replace(/’/g, "'");

  if (PT_PHONETIC_MAP[lower]) {
    const mapped = PT_PHONETIC_MAP[lower];
    const isCapital =
      core[0] === core[0].toUpperCase() && core[0] !== core[0].toLowerCase();
    const formatted = isCapital
      ? mapped.charAt(0).toUpperCase() + mapped.slice(1)
      : mapped;
    return `${prefix}${formatted}${suffix}`;
  }

  // Se tiver possessivo 's (ex: friend's), traduz a base e adiciona "z"
  if (lower.endsWith("'s")) {
    const base = lower.slice(0, -2);
    if (PT_PHONETIC_MAP[base]) {
      const mapped = `${PT_PHONETIC_MAP[base]}z`;
      const isCapital =
        core[0] === core[0].toUpperCase() && core[0] !== core[0].toLowerCase();
      const formatted = isCapital
        ? mapped.charAt(0).toUpperCase() + mapped.slice(1)
        : mapped;
      return `${prefix}${formatted}${suffix}`;
    }
  }

  // Regras fonéticas inteligentes para palavras novas coladas pelo aluno
  let approx = lower
    .replace(/tion\b/g, '-xân')
    .replace(/tions\b/g, '-xânz')
    .replace(/sion\b/g, '-jân')
    .replace(/sions\b/g, '-jânz')
    .replace(/ture\b/g, '-tcher')
    .replace(/tures\b/g, '-tcherz')
    .replace(/sure\b/g, '-jer')
    .replace(/ous\b/g, '-âs')
    .replace(/ness\b/g, '-nes')
    .replace(/ment\b/g, '-ment')
    .replace(/ments\b/g, '-ments')
    .replace(/ful\b/g, '-fôl')
    .replace(/less\b/g, '-les')
    .replace(/able\b/g, '-a-bôl')
    .replace(/ible\b/g, '-i-bôl')
    .replace(/igh/g, 'ái')
    .replace(/ough/g, 'ôu')
    .replace(/augh/g, 'ó')
    .replace(/bt/g, 't')
    .replace(/ph/g, 'f')
    .replace(/sh/g, 'x')
    .replace(/tch/g, 'tch')
    .replace(/(?<!t)ch/g, 'tch')
    .replace(/^th(?=[aeiouy])/g, 'd')
    .replace(/^thr/g, 'tr')
    .replace(/th/g, 'f')
    .replace(/wh/g, 'u')
    .replace(/^w/g, 'u')
    .replace(/^h/g, 'r')
    .replace(/ee/g, 'í')
    .replace(/ea/g, 'í')
    .replace(/oo/g, 'ú')
    .replace(/ou/g, 'áu')
    .replace(/ow\b/g, 'ôu')
    .replace(/ow/g, 'áu')
    .replace(/ay\b/g, 'êi')
    .replace(/ey\b/g, 'êi')
    .replace(/([bcdfghjklmnpqrstvwxz])\1ing\b/g, '$1-in')
    .replace(/ing\b/g, '-in')
    .replace(/([td])ed\b/g, '$1-ed')
    .replace(/ed\b/g, 'd')
    .replace(/([bcdfghjklmnpqrstvwxz])le\b/g, '$1ôl')
    .replace(/er\b/g, '-er')
    .replace(/ly\b/g, '-li')
    .replace(/ck/g, 'k')
    .replace(/qu/g, 'ku')
    .replace(/^kn/g, 'n')
    .replace(/^wr/g, 'r')
    .replace(/([bcdfghjklmnpqrstvwxz])\1+/g, '$1')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');

  if (approx.length > 3 && approx.endsWith('e') && !approx.endsWith('ee')) {
    approx = approx.slice(0, -1);
  }

  const isCapital =
    core[0] === core[0].toUpperCase() && core[0] !== core[0].toLowerCase();
  if (isCapital && approx.length > 0) {
    approx = approx.charAt(0).toUpperCase() + approx.slice(1);
  }

  return `${prefix}${approx}${suffix}`;
}

function approximateWordToPt(rawToken) {
  // Divide palavras compostas por hífen ou travessão (ex: forty-five, problem-solving, today—we'll)
  if (/[-–—/]/.test(rawToken)) {
    return rawToken
      .split(/([-–—/])/)
      .map((part) =>
        /[-–—/]/.test(part) ? part : approximateSingleWordToPt(part)
      )
      .join('');
  }
  return approximateSingleWordToPt(rawToken);
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
