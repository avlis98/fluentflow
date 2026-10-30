export const LEVELS = [
  { id: 'ALL', label: 'Todos os Níveis', badge: 'A1–C1', color: 'indigo' },
  { id: 'A1-A2', label: 'Básico', badge: 'A1–A2', color: 'emerald' },
  { id: 'B1-B2', label: 'Intermediário', badge: 'B1–B2', color: 'amber' },
  { id: 'C1-C2', label: 'Avançado', badge: 'C1–C2', color: 'rose' },
];

export const INTERACTIVE_TEXTS = [
  {
    id: 'ny-morning',
    title: 'A Busy Morning in New York',
    subtitle: 'Uma manhã agitada em Nova York',
    level: 'A1-A2',
    category: 'Cotidiano & Viagem',
    duration: '2 min',
    accent: 'en-US',
    coverEmoji: '🗽',
    paragraphs: [
      {
        en: 'Every morning, Lucas wakes up at seven o’clock in his small apartment in Brooklyn. Before checking his phone, he stretches and makes a strong cup of coffee.',
        pt: 'Toda manhã, Lucas acorda às sete horas em seu pequeno apartamento no Brooklyn. Antes de checar o celular, ele se espreguiça e faz uma xícara de café forte.',
      },
      {
        en: 'At seven forty-five, he grabs his backpack and rushes to the subway station. The train is usually crowded, so he listens to an English podcast while standing.',
        pt: 'Às sete e quarenta e cinco, ele pega sua mochila e corre para a estação de metrô. O trem costuma estar lotado, então ele ouve um podcast em inglês enquanto fica em pé.',
      },
      {
        en: 'Even though the commute takes thirty minutes, Lucas enjoys watching the city wake up. Stepping out of the station in Manhattan always feels exciting.',
        pt: 'Embora o trajeto leve trinta minutos, Lucas gosta de ver a cidade acordar. Sair da estação em Manhattan sempre parece empolgante.',
      },
    ],
    vocabulary: {
      wakes: {
        word: 'wake up',
        phonetic: '/weɪk ʌp/',
        translation: 'acordar / despertar',
        partOfSpeech: 'Phrasal Verb',
        example: 'I usually wake up early on weekdays.',
      },
      stretches: {
        word: 'stretch',
        phonetic: '/stretʃ/',
        translation: 'espreguiçar-se / alongar',
        partOfSpeech: 'Verb',
        example: 'She stretches her arms after waking up.',
      },
      grabs: {
        word: 'grab',
        phonetic: '/ɡræb/',
        translation: 'pegar rapidamente / agarrar',
        partOfSpeech: 'Verb',
        example: 'Let’s grab a quick bite before the movie.',
      },
      rushes: {
        word: 'rush',
        phonetic: '/rʌʃ/',
        translation: 'apressar-se / correr com pressa',
        partOfSpeech: 'Verb',
        example: 'There is no need to rush; we have plenty of time.',
      },
      crowded: {
        word: 'crowded',
        phonetic: '/ˈkraʊ.dɪd/',
        translation: 'lotado / cheio de gente',
        partOfSpeech: 'Adjective',
        example: 'The restaurant gets very crowded on Friday nights.',
      },
      commute: {
        word: 'commute',
        phonetic: '/kəˈmjuːt/',
        translation: 'trajeto diário (casa–trabalho)',
        partOfSpeech: 'Noun / Verb',
        example: 'My morning commute takes about forty minutes.',
      },
      stepping: {
        word: 'step out',
        phonetic: '/step aʊt/',
        translation: 'sair (de um local/transporte)',
        partOfSpeech: 'Phrasal Verb',
        example: 'He stepped out of the cab and looked at the building.',
      },
    },
    quiz: [
      {
        question: 'What does Lucas do before checking his phone?',
        options: [
          'He rushes to the subway station.',
          'He stretches and makes a strong cup of coffee.',
          'He listens to an English podcast.',
        ],
        correctIndex: 1,
        explanation: 'No primeiro parágrafo: "Before checking his phone, he stretches and makes a strong cup of coffee."',
      },
      {
        question: 'What does the word "commute" mean in the text?',
        options: [
          'O trajeto diário entre casa e trabalho',
          'Uma conversa no metrô',
          'O preço da passagem de trem',
        ],
        correctIndex: 0,
        explanation: '"Commute" refere-se ao deslocamento diário para o trabalho ou estudo.',
      },
    ],
  },
  {
    id: 'london-rain',
    title: 'Missed Connections at King’s Cross',
    subtitle: 'Conexões perdidas na estação King’s Cross',
    level: 'A1-A2',
    category: 'Diálogo & Viagem',
    duration: '3 min',
    accent: 'en-GB',
    coverEmoji: '☔',
    paragraphs: [
      {
        en: 'Clara arrived at King’s Cross station in London just as a heavy rain started pouring down. She looked at the departure board and realized her train to Edinburgh was delayed.',
        pt: 'Clara chegou à estação King’s Cross em Londres bem quando uma chuva forte começou a cair. Ela olhou para o painel de partidas e percebeu que seu trem para Edimburgo estava atrasado.',
      },
      {
        en: 'Instead of getting frustrated, she decided to find a cozy bakery nearby. She ordered a warm Earl Grey tea and a freshly baked scone.',
        pt: 'Em vez de ficar frustrada, ela decidiu encontrar uma padaria aconchegante por perto. Ela pediu um chá Earl Grey quente e um scone recém-assado.',
      },
      {
        en: 'While waiting, a friendly local sitting next to her struck up a conversation and gave her amazing tips on hidden gems to visit in Scotland.',
        pt: 'Enquanto esperava, um morador local simpático sentado ao lado dela puxou conversa e lhe deu dicas incríveis de lugares secretos para visitar na Escócia.',
      },
    ],
    vocabulary: {
      pouring: {
        word: 'pour down',
        phonetic: '/pɔːr daʊn/',
        translation: 'chover torrencialmente / cair com força',
        partOfSpeech: 'Phrasal Verb',
        example: 'It has been pouring down all afternoon.',
      },
      departure: {
        word: 'departure board',
        phonetic: '/dɪˈpɑː.tʃər bɔːd/',
        translation: 'painel de partidas / embarque',
        partOfSpeech: 'Noun',
        example: 'Check the departure board for our platform number.',
      },
      realized: {
        word: 'realize',
        phonetic: '/ˈrɪə.laɪz/',
        translation: 'perceber / dar-se conta (falso cognato!)',
        partOfSpeech: 'Verb',
        example: 'I didn’t realize how late it was.',
      },
      delayed: {
        word: 'delayed',
        phonetic: '/dɪˈleɪd/',
        translation: 'atrasado / adiado',
        partOfSpeech: 'Adjective',
        example: 'Our flight was delayed by two hours due to fog.',
      },
      cozy: {
        word: 'cozy',
        phonetic: '/ˈkəʊ.zi/',
        translation: 'aconchegante / acolhedor',
        partOfSpeech: 'Adjective',
        example: 'We found a cozy little café in the old town.',
      },
      struck: {
        word: 'strike up a conversation',
        phonetic: '/straɪk ʌp ə ˌkɒn.vəˈseɪ.ʃən/',
        translation: 'puxar conversa / iniciar um papo',
        partOfSpeech: 'Idiom',
        example: 'It’s easy to strike up a conversation with travelers.',
      },
      gems: {
        word: 'hidden gem',
        phonetic: '/ˌhɪd.ən ˈdʒem/',
        translation: 'tesouro escondido / lugar pouco conhecido e incrível',
        partOfSpeech: 'Idiom',
        example: 'That small beach is a real hidden gem.',
      },
    },
    quiz: [
      {
        question: 'Attention to the false friend: what does "realized" mean?',
        options: [
          'Realizou um sonho',
          'Percebeu / deu-se conta',
          'Construiu algo',
        ],
        correctIndex: 1,
        explanation: '"Realize" em inglês significa "perceber" ou "dar-se conta" (para "realizar/alcançar", usa-se "accomplish" ou "achieve").',
      },
      {
        question: 'What did Clara do when her train was delayed?',
        options: [
          'She went back to her hotel.',
          'She argued with the station staff.',
          'She went to a cozy bakery and had tea.',
        ],
        correctIndex: 2,
        explanation: 'Ela aproveitou o atraso para tomar um chá em uma padaria aconchegante.',
      },
    ],
  },
  {
    id: 'midnight-song',
    title: 'Song Lyrics: Neon Lights & Midnight Trains',
    subtitle: 'Letra Interativa: Aprenda ritmo, contrações e expressões poéticas',
    level: 'B1-B2',
    category: 'Música & Expressões',
    duration: '3 min',
    accent: 'en-US',
    coverEmoji: '🎸',
    paragraphs: [
      {
        en: '🎵 Walking down the avenue, chasing shadows in the rain / We used to talk for hours, now we barely say a name.',
        pt: '🎵 Caminhando pela avenida, perseguindo sombras na chuva / Costumávamos conversar por horas, agora mal dizemos um nome.',
      },
      {
        en: '🎵 Hold on to the memories, don’t let them fade away / Even when the night is cold, we’ll find a brighter day.',
        pt: '🎵 Segure-se às memórias, não deixe que elas desapareçam / Mesmo quando a noite estiver fria, encontraremos um dia mais iluminado.',
      },
      {
        en: '🎵 No matter what it takes, I’m gonna figure it out / Turning all these quiet doubts into something we can shout.',
        pt: '🎵 Não importa o que custe, eu vou descobrir um jeito / Transformando todas essas dúvidas silenciosas em algo que possamos gritar.',
      },
    ],
    vocabulary: {
      chasing: {
        word: 'chase',
        phonetic: '/tʃeɪs/',
        translation: 'perseguir / correr atrás de',
        partOfSpeech: 'Verb',
        example: 'She is chasing her dreams in a new city.',
      },
      used: {
        word: 'used to',
        phonetic: '/ˈjuːst tuː/',
        translation: 'costumava (hábito no passado)',
        partOfSpeech: 'Grammar Structure',
        example: 'We used to live near the beach when I was a kid.',
      },
      barely: {
        word: 'barely',
        phonetic: '/ˈbeə.li/',
        translation: 'mal / quase não / por pouco',
        partOfSpeech: 'Adverb',
        example: 'There was so much noise I could barely hear him.',
      },
      fade: {
        word: 'fade away',
        phonetic: '/feɪd əˈweɪ/',
        translation: 'desaparecer aos poucos / desvanecer',
        partOfSpeech: 'Phrasal Verb',
        example: 'The music slowly faded away.',
      },
      figure: {
        word: 'figure out',
        phonetic: '/ˈfɪɡ.jər aʊt/',
        translation: 'descobrir / entender / resolver',
        partOfSpeech: 'Phrasal Verb',
        example: 'Don’t worry, we will figure out a solution together.',
      },
    },
    quiz: [
      {
        question: 'What does "We used to talk for hours" express?',
        options: [
          'Estamos acostumados a falar por horas hoje em dia.',
          'Costumávamos conversar por horas no passado (mas não mais).',
          'Usamos o telefone por horas.',
        ],
        correctIndex: 1,
        explanation: '"Used to + verbo" indica algo que acontecia com frequência no passado, mas deixou de acontecer.',
      },
    ],
  },
  {
    id: 'remote-work',
    title: 'The Art of Asynchronous Communication',
    subtitle: 'Inglês para Trabalho Remoto e Equipes Globais',
    level: 'B1-B2',
    category: 'Carreira & Tech',
    duration: '4 min',
    accent: 'en-US',
    coverEmoji: '💻',
    paragraphs: [
      {
        en: 'Working with a distributed team across different time zones requires more than just fluent English; it demands clear and concise communication.',
        pt: 'Trabalhar com uma equipe distribuída em diferentes fusos horários exige mais do que apenas inglês fluente; exige uma comunicação clara e concisa.',
      },
      {
        en: 'Instead of sending a vague message like "Hello, are you there?" and waiting for a reply, experienced professionals provide full context upfront so colleagues can respond whenever they come online.',
        pt: 'Em vez de enviar uma mensagem vaga como "Olá, você está aí?" e esperar por uma resposta, profissionais experientes fornecem todo o contexto de antemão para que os colegas possam responder assim que entrarem online.',
      },
      {
        en: 'When we keep everyone in the loop through well-structured updates, we reduce unnecessary meetings and empower people to do their best deep work.',
        pt: 'Quando mantemos todos informados por meio de atualizações bem estruturadas, reduzimos reuniões desnecessárias e capacitamos as pessoas a fazerem seu melhor trabalho focado.',
      },
    ],
    vocabulary: {
      demands: {
        word: 'demand',
        phonetic: '/dɪˈmænd/',
        translation: 'exigir / demandar',
        partOfSpeech: 'Verb / Noun',
        example: 'This project demands close attention to detail.',
      },
      concise: {
        word: 'concise',
        phonetic: '/kənˈsaɪs/',
        translation: 'conciso / direto ao ponto',
        partOfSpeech: 'Adjective',
        example: 'Keep your pull request description clear and concise.',
      },
      upfront: {
        word: 'upfront',
        phonetic: '/ˌʌpˈfrʌnt/',
        translation: 'de antemão / logo de início / transparente',
        partOfSpeech: 'Adverb / Adjective',
        example: 'It’s best to be upfront about the project timeline.',
      },
      loop: {
        word: 'keep someone in the loop',
        phonetic: '/kiːp ɪn ðə luːp/',
        translation: 'manter alguém informado / por dentro',
        partOfSpeech: 'Idiom',
        example: 'Please keep me in the loop as the negotiation progresses.',
      },
      empower: {
        word: 'empower',
        phonetic: '/ɪmˈpaʊ.ər/',
        translation: 'capacitar / dar autonomia',
        partOfSpeech: 'Verb',
        example: 'Good leaders empower their teams to make decisions.',
      },
    },
    quiz: [
      {
        question: 'What does "keep everyone in the loop" mean in a workplace context?',
        options: [
          'Fazer reuniões repetitivas todos os dias',
          'Manter todos informados e atualizados sobre o andamento',
          'Trabalhar em um loop infinito de tarefas',
        ],
        correctIndex: 1,
        explanation: '"Keep in the loop" é uma expressão idiomática muito usada no trabalho para "manter a par / informado".',
      },
    ],
  },
  {
    id: 'paradox-choice',
    title: 'The Paradox of Modern Productivity',
    subtitle: 'Por que estar ocupado nem sempre significa ser produtivo',
    level: 'C1-C2',
    category: 'Ensaio & Reflexão',
    duration: '5 min',
    accent: 'en-US',
    coverEmoji: '🧠',
    paragraphs: [
      {
        en: 'In an era defined by relentless connectivity, we often conflate frantic busyness with meaningful accomplishment. Answering dozens of notifications feels productive in the moment, yet it fragments our attention span.',
        pt: 'Em uma era definida pela conectividade implacável, frequentemente confundimos a correria frenética com realizações significativas. Responder a dezenas de notificações parece produtivo no momento, mas fragmenta nossa capacidade de atenção.',
      },
      {
        en: 'True breakthroughs rarely stem from checking off trivial tasks; rather, they emerge when we carve out uninterrupted blocks of time to tackle complex problems.',
        pt: 'Verdadeiros avanços raramente surgem de riscar tarefas triviais da lista; pelo contrário, eles emergem quando reservamos blocos ininterruptos de tempo para enfrentar problemas complexos.',
      },
      {
        en: 'Ultimately, mastering your schedule is less about squeezing more into every hour and more about having the discernment to ruthlessy eliminate what no longer serves your long-term vision.',
        pt: 'Em última análise, dominar sua rotina tem menos a ver com espremer mais coisas em cada hora e mais com ter o discernimento para eliminar sem piedade o que não serve mais à sua visão de longo prazo.',
      },
    ],
    vocabulary: {
      relentless: {
        word: 'relentless',
        phonetic: '/rɪˈlent.ləs/',
        translation: 'implacável / incessante',
        partOfSpeech: 'Adjective',
        example: 'Her relentless pursuit of excellence inspired the whole team.',
      },
      conflate: {
        word: 'conflate',
        phonetic: '/kənˈfleɪt/',
        translation: 'confundir / fundir dois conceitos distintos como se fossem iguais',
        partOfSpeech: 'Verb',
        example: 'We should not conflate politeness with agreement.',
      },
      stem: {
        word: 'stem from',
        phonetic: '/stem frɒm/',
        translation: 'originar-se de / decorrer de',
        partOfSpeech: 'Phrasal Verb',
        example: 'Many communication issues stem from a lack of clarity.',
      },
      carve: {
        word: 'carve out',
        phonetic: '/kɑːv aʊt/',
        translation: 'reservar com esforço (tempo, espaço, carreira)',
        partOfSpeech: 'Phrasal Verb',
        example: 'Try to carve out thirty minutes a day for reading.',
      },
      tackle: {
        word: 'tackle',
        phonetic: '/ˈtæk.əl/',
        translation: 'enfrentar / lidar com (um problema ou desafio)',
        partOfSpeech: 'Verb',
        example: 'How should we tackle this performance bottleneck?',
      },
      discernment: {
        word: 'discernment',
        phonetic: '/dɪˈsɜːn.mənt/',
        translation: 'discernimento / bom julgamento',
        partOfSpeech: 'Noun',
        example: 'Leadership requires discernment under pressure.',
      },
    },
    quiz: [
      {
        question: 'According to the text, how do true breakthroughs emerge?',
        options: [
          'By answering notifications as fast as possible.',
          'When we carve out uninterrupted blocks of time to tackle complex problems.',
          'By squeezing more trivial tasks into every single hour.',
        ],
        correctIndex: 1,
        explanation: 'O segundo parágrafo destaca a importância de reservar tempo sem interrupções ("carve out uninterrupted blocks of time").',
      },
    ],
  },
];

// Dicionário auxiliar para qualquer palavra clicada nos textos que não esteja destacada
export const COMMON_DICTIONARY = {
  every: { translation: 'cada / todo(a)', phonetic: '/ˈev.ri/' },
  morning: { translation: 'manhã', phonetic: '/ˈmɔːr.nɪŋ/' },
  small: { translation: 'pequeno(a)', phonetic: '/smɔːl/' },
  before: { translation: 'antes de', phonetic: '/bɪˈfɔːr/' },
  checking: { translation: 'checar / verificar', phonetic: '/ˈtʃek.ɪŋ/' },
  strong: { translation: 'forte', phonetic: '/strɒŋ/' },
  coffee: { translation: 'café', phonetic: '/ˈkɒf.i/' },
  backpack: { translation: 'mochila', phonetic: '/ˈbæk.pæk/' },
  subway: { translation: 'metrô (EUA)', phonetic: '/ˈsʌb.weɪ/' },
  usually: { translation: 'geralmente / normalmente', phonetic: '/ˈjuː.ʒu.ə.li/' },
  standing: { translation: 'em pé', phonetic: '/ˈstæn.dɪŋ/' },
  even: { translation: 'mesmo / até', phonetic: '/ˈiː.vən/' },
  though: { translation: 'embora / apesar de', phonetic: '/ðəʊ/' },
  enjoys: { translation: 'gosta de / aprecia', phonetic: '/ɪnˈdʒɔɪz/' },
  watching: { translation: 'assistir / observar', phonetic: '/ˈwɒtʃ.ɪŋ/' },
  always: { translation: 'sempre', phonetic: '/ˈɔːl.weɪz/' },
  exciting: { translation: 'empolgante / emocionante', phonetic: '/ɪkˈsaɪ.tɪŋ/' },
  arrived: { translation: 'chegou', phonetic: '/əˈraɪvd/' },
  heavy: { translation: 'pesado(a) / forte', phonetic: '/ˈhev.i/' },
  instead: { translation: 'em vez disso', phonetic: '/ɪnˈsted/' },
  frustrated: { translation: 'frustrado(a)', phonetic: '/frʌsˈtreɪ.tɪd/' },
  bakery: { translation: 'padaria / confeitaria', phonetic: '/ˈbeɪ.kər.i/' },
  nearby: { translation: 'por perto / próximo', phonetic: '/ˌnɪəˈbaɪ/' },
  freshly: { translation: 'recém / fresquinho', phonetic: '/ˈfreʃ.li/' },
  friendly: { translation: 'amigável / simpático', phonetic: '/ˈfrend.li/' },
  waiting: { translation: 'esperando', phonetic: '/ˈweɪ.tɪŋ/' },
  requires: { translation: 'requer / exige', phonetic: '/rɪˈkwaɪəz/' },
  fluent: { translation: 'fluente', phonetic: '/ˈfluː.ənt/' },
  vague: { translation: 'vago(a) / impreciso', phonetic: '/veɪɡ/' },
  experienced: { translation: 'experiente', phonetic: '/ɪkˈspɪə.ri.ənst/' },
  colleagues: { translation: 'colegas de trabalho', phonetic: '/ˈkɒl.iːɡz/' },
  whenever: { translation: 'sempre que / quando quer que', phonetic: '/wenˈev.ər/' },
  unnecessary: { translation: 'desnecessário(a)', phonetic: '/ʌnˈnes.ə.ser.i/' },
  meetings: { translation: 'reuniões', phonetic: '/ˈmiː.tɪŋz/' },
  often: { translation: 'frequentemente / muitas vezes', phonetic: '/ˈɒf.ən/' },
  meaningful: { translation: 'significativo / com propósito', phonetic: '/ˈmiː.nɪŋ.fəl/' },
  accomplishment: { translation: 'realização / conquista', phonetic: '/əˈkʌm.plɪʃ.mənt/' },
  rarely: { translation: 'raramente', phonetic: '/ˈreə.li/' },
  uninterrupted: { translation: 'ininterrupto / sem pausas', phonetic: '/ˌʌn.ɪn.təˈrʌp.tɪd/' },
  ultimately: { translation: 'em última análise / no fim das contas', phonetic: '/ˈʌl.tɪ.mət.li/' },
  schedule: { translation: 'agenda / cronograma / rotina', phonetic: '/ˈskedʒ.uːl/' },
  squeezing: { translation: 'espremendo / encaixando à força', phonetic: '/ˈskwiːz.ɪŋ/' },
};

export const INITIAL_FLASHCARDS = [
  {
    id: 'card-0',
    word: 'Could you help me?',
    phonetic: '/kʊd juː help miː/',
    translation: 'Você poderia me ajudar?',
    usageExplanation:
      'Bloco essencial para pedir ajuda com educação em qualquer lugar (lojas, aeroporto, trabalho). Para especificar a ação, use "Could you help me + verbo" ou "Could you help me with + substantivo".',
    example: 'Excuse me, could you help me find gate B12?',
    exampleTranslation: 'Com licença, você poderia me ajudar a encontrar o portão B12?',
    situations: [
      {
        context: 'No trabalho',
        en: 'Could you help me review this presentation?',
        pt: 'Você poderia me ajudar a revisar esta apresentação?',
      },
      {
        context: 'Em uma loja ou hotel',
        en: 'Could you help me with my luggage, please?',
        pt: 'Você poderia me ajudar com a minha bagagem, por favor?',
      },
    ],
    practicePrompt:
      'Imagine que você está no aeroporto ou no trabalho. Escreva ou fale uma frase pedindo ajuda usando "Could you help me...":',
    deck: 'Blocos Essenciais',
    level: 'A1-A2',
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReview: Date.now(),
    status: 'new',
  },
  {
    id: 'card-1',
    word: 'figure out how to',
    phonetic: '/ˈfɪɡ.jər aʊt haʊ tuː/',
    translation: 'descobrir / entender como fazer algo',
    usageExplanation:
      'Muito usado por nativos quando você precisa raciocinar para resolver um problema prático ou entender o funcionamento de algo.',
    example: 'Can you help me figure out how this software works?',
    exampleTranslation: 'Você pode me ajudar a descobrir como este software funciona?',
    situations: [
      {
        context: 'Tecnologia / Trabalho',
        en: 'We need to figure out how to reduce loading time.',
        pt: 'Precisamos descobrir como reduzir o tempo de carregamento.',
      },
      {
        context: 'Viagem',
        en: 'I’m trying to figure out how to buy a subway ticket.',
        pt: 'Estou tentando descobrir como comprar um bilhete de metrô.',
      },
    ],
    practicePrompt:
      'O que você está tentando aprender ou resolver ultimamente? Responda usando "figure out":',
    deck: 'Phrasal Verbs & Chunks',
    level: 'B1-B2',
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReview: Date.now(),
    status: 'new',
  },
  {
    id: 'card-2',
    word: 'By the way, did you...?',
    phonetic: '/baɪ ðə weɪ dɪd juː/',
    translation: 'A propósito / Aliás, você...?',
    usageExplanation:
      'Bloco perfeito para introduzir um assunto novo ou lembrar de uma pergunta no meio de uma conversa sem perder a naturalidade.',
    example: 'By the way, did you book the hotel for our trip?',
    exampleTranslation: 'A propósito, você reservou o hotel para a nossa viagem?',
    situations: [
      {
        context: 'Reunião de equipe',
        en: 'By the way, did you receive the updated report?',
        pt: 'A propósito, você recebeu o relatório atualizado?',
      },
      {
        context: 'Conversa entre amigos',
        en: 'By the way, what time does the movie start?',
        pt: 'Aliás, a que horas começa o filme?',
      },
    ],
    practicePrompt:
      'Faça uma pergunta casual para um amigo ou colega começando com "By the way...":',
    deck: 'Conversação & Viagem',
    level: 'A1-A2',
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReview: Date.now(),
    status: 'new',
  },
  {
    id: 'card-3',
    word: 'Please keep me in the loop',
    phonetic: '/pliːz kiːp miː ɪn ðə luːp/',
    translation: 'Por favor, me mantenha informado / por dentro',
    usageExplanation:
      'Expressão idiomática indispensável no ambiente profissional para pedir atualizações sobre um projeto ou decisão.',
    example: 'Please keep me in the loop about the client’s feedback.',
    exampleTranslation: 'Por favor, me mantenha informado sobre o feedback do cliente.',
    situations: [
      {
        context: 'E-mail ou Slack corporativo',
        en: 'Keep the team in the loop if the deadline changes.',
        pt: 'Mantenha a equipe informada caso o prazo mude.',
      },
    ],
    practicePrompt:
      'Peça para um colega te manter atualizado sobre um projeto usando "keep me in the loop":',
    deck: 'Carreira & Tech',
    level: 'B1-B2',
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReview: Date.now(),
    status: 'new',
  },
  {
    id: 'card-4',
    word: 'It was actually quite...',
    phonetic: '/ɪt wɒz ˈæk.tʃu.ə.li kwaɪt/',
    translation: 'Na verdade foi bem... (quebrando uma expectativa)',
    usageExplanation:
      'Atenção ao falso cognato: "actually" significa "na verdade / de fato" (para dizer "atualmente", use "currently" ou "nowadays").',
    example: 'I thought the test would be hard, but it was actually quite easy.',
    exampleTranslation: 'Achei que o teste seria difícil, mas na verdade foi bem fácil.',
    situations: [
      {
        context: 'Contando uma experiência',
        en: 'The hotel looked small online, but it was actually quite spacious.',
        pt: 'O hotel parecia pequeno online, mas na verdade era bem espaçoso.',
      },
    ],
    practicePrompt:
      'Conte algo que te surpreendeu positivamente usando "actually":',
    deck: 'Falsos Cognatos',
    level: 'A1-A2',
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReview: Date.now(),
    status: 'new',
  },
  {
    id: 'card-5',
    word: 'I’m looking forward to',
    phonetic: '/aɪm ˈlʊk.ɪŋ ˈfɔː.wəd tuː/',
    translation: 'Estou ansioso(a) por / Aguardo com expectativa',
    usageExplanation:
      'Regra de ouro: após "look forward to", se vier um verbo, ele SEMPRE termina em "-ing" (ex: looking forward to meeting you / traveling).',
    example: 'I’m really looking forward to meeting your team in person.',
    exampleTranslation: 'Estou muito ansioso para conhecer sua equipe pessoalmente.',
    situations: [
      {
        context: 'Final de entrevista ou e-mail',
        en: 'I look forward to hearing from you soon.',
        pt: 'Aguardo seu retorno em breve.',
      },
      {
        context: 'Planos de férias',
        en: 'We are looking forward to visiting London next month.',
        pt: 'Estamos ansiosos para visitar Londres no mês que vem.',
      },
    ],
    practicePrompt:
      'Pelo que você está ansioso(a) esta semana ou neste ano? Use "I’m looking forward to...":',
    deck: 'Phrasal Verbs & Chunks',
    level: 'B1-B2',
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReview: Date.now(),
    status: 'new',
  },
  {
    id: 'card-6',
    word: 'had to put off',
    phonetic: '/hæd tuː pʊt ɒf/',
    translation: 'tive/tivemos que adiar (deixar para depois)',
    usageExplanation:
      'Mais natural na fala cotidiana do que "postpone". Use "put off + substantivo" ou "put off + verbo com -ing".',
    example: 'We had to put off the outdoor event because of the storm.',
    exampleTranslation: 'Tivemos que adiar o evento ao ar livre por causa da tempestade.',
    situations: [
      {
        context: 'Rotina de trabalho',
        en: 'Let’s not put off this decision any longer.',
        pt: 'Não vamos adiar mais esta decisão.',
      },
    ],
    practicePrompt:
      'Crie uma frase dizendo que precisou adiar uma reunião ou viagem usando "put off":',
    deck: 'Phrasal Verbs & Chunks',
    level: 'B1-B2',
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReview: Date.now(),
    status: 'new',
  },
  {
    id: 'card-7',
    word: 'Let’s grab a bite',
    phonetic: '/lets ɡræb ə baɪt/',
    translation: 'Vamos comer algo rápido / fazer um lanche',
    usageExplanation:
      'Convite informal e muito comum para almoçar ou lanchar sem formalidade.',
    example: 'Are you hungry? Let’s grab a bite before the flight.',
    exampleTranslation: 'Está com fome? Vamos comer algo rápido antes do voo.',
    situations: [
      {
        context: 'Intervalo do trabalho',
        en: 'Do you want to grab a bite after the meeting?',
        pt: 'Quer comer alguma coisa rápida depois da reunião?',
      },
    ],
    practicePrompt:
      'Convide alguém para lanchar ou tomar café usando "grab a bite" ou "grab a coffee":',
    deck: 'Conversação & Viagem',
    level: 'A1-A2',
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReview: Date.now(),
    status: 'new',
  },
  {
    id: 'card-8',
    word: 'can be a double-edged sword',
    phonetic: '/kæn biː ə ˌdʌb.əl.edʒd ˈsɔːd/',
    translation: 'pode ser uma faca de dois gumes (tem prós e contras)',
    usageExplanation:
      'Excelente bloco avançado para argumentar em entrevistas ou debates quando algo traz vantagens e riscos ao mesmo tempo.',
    example: 'Working from home can be a double-edged sword if you don’t set boundaries.',
    exampleTranslation: 'Trabalhar de casa pode ser uma faca de dois gumes se você não definir limites.',
    situations: [
      {
        context: 'Debate sobre tecnologia',
        en: 'Social media is a double-edged sword for productivity.',
        pt: 'As redes sociais são uma faca de dois gumes para a produtividade.',
      },
    ],
    practicePrompt:
      'Cite algo na tecnologia ou no trabalho que tem lados bons e ruins usando "double-edged sword":',
    deck: 'Expressões Avançadas',
    level: 'C1-C2',
    repetitions: 0,
    interval: 0,
    easeFactor: 2.5,
    nextReview: Date.now(),
    status: 'new',
  },
];

export const ROLEPLAY_SCENARIOS = [
  {
    id: 'coffee-shop',
    title: 'Cafeteria em Nova York',
    role: 'Maya (Barista no Bean & Brew)',
    avatar: '☕',
    level: 'A1-A2',
    accent: 'en-US',
    description: 'Faça um pedido completo, personalize sua bebida e escolha como pagar.',
    initialMessage: "Hi there! Welcome to Bean & Brew NYC. What can I get started for you today?",
    initialTranslation: "Olá! Bem-vindo ao Bean & Brew NYC. O que posso preparar para você hoje?",
    missions: [
      { id: 'order', label: 'Peça uma bebida ou lanche (ex: latte, cappuccino, muffin)', keywords: ['coffee', 'latte', 'cappuccino', 'tea', 'espresso', 'americano', 'muffin', 'croissant', 'would like', 'can i get', 'can i have', 'i want'] },
      { id: 'customize', label: 'Escolha o tamanho ou tipo de leite/gelo (ex: medium, oat milk, iced)', keywords: ['small', 'medium', 'large', 'hot', 'iced', 'oat', 'almond', 'milk', 'sugar', 'for here', 'to go'] },
      { id: 'pay', label: 'Pergunte o valor ou diga como vai pagar (card, Apple Pay, cash)', keywords: ['how much', 'pay', 'card', 'credit', 'cash', 'apple pay', 'total', 'receipt', 'thank'] },
    ],
    turns: [
      {
        match: ['coffee', 'latte', 'cappuccino', 'tea', 'espresso', 'americano', 'muffin', 'croissant', 'like', 'have', 'get'],
        reply: "Awesome choice! Would you like that small, medium, or large? And do you prefer regular milk or oat milk?",
        translation: "Ótima escolha! Você gostaria dele pequeno, médio ou grande? E prefere leite normal ou leite de aveia?",
        hint: "Try saying: 'Could I have a medium with oat milk, please? And is it possible to make it iced?'",
      },
      {
        match: ['small', 'medium', 'large', 'oat', 'almond', 'regular', 'iced', 'hot', 'milk', 'sugar', 'please'],
        reply: "Got it! Will that be for here or to go? Your total comes to $5.75 whenever you're ready.",
        translation: "Anotado! Vai ser para tomar aqui ou para viagem? O total fica $5,75 quando estiver pronto.",
        hint: "Try saying: 'To go, please. Can I pay by credit card?'",
      },
      {
        match: ['card', 'pay', 'cash', 'apple', 'go', 'here', 'much', 'thank', 'thanks'],
        reply: "Perfect, you can just tap your card right here on the reader. Your drink will be ready at the counter in just a minute! Have a wonderful day!",
        translation: "Perfeito, você pode só aproximar seu cartão aqui na maquininha. Sua bebida estará pronta no balcão em um minuto! Tenha um dia maravilhoso!",
        hint: "Try saying: 'Thank you so much! Have a great day too!'",
      },
    ],
    defaultReply: "Sure thing! Anything else I can get for you today, or would you like to pay by card?",
    defaultTranslation: "Com certeza! Mais alguma coisa que posso pegar para você hoje, ou gostaria de pagar com cartão?",
  },
  {
    id: 'airport-immigration',
    title: 'Imigração no Aeroporto Internacional',
    role: 'Officer Miller (US Customs & Border Protection)',
    avatar: '✈️',
    level: 'A1-A2',
    accent: 'en-US',
    description: 'Responda às perguntas do oficial de imigração sobre o motivo da viagem, estadia e duração.',
    initialMessage: "Good evening. Passport, please. What is the purpose of your visit to the United States?",
    initialTranslation: "Boa noite. Passaporte, por favor. Qual é o objetivo da sua visita aos Estados Unidos?",
    missions: [
      { id: 'purpose', label: 'Explique o motivo da viagem (turismo, férias ou negócios)', keywords: ['vacation', 'tourism', 'tourist', 'business', 'holiday', 'travel', 'visiting', 'conference', 'sightseeing'] },
      { id: 'duration', label: 'Informe quanto tempo vai ficar (ex: ten days, two weeks)', keywords: ['days', 'week', 'weeks', 'month', 'staying', 'until', 'return'] },
      { id: 'stay', label: 'Diga onde vai se hospedar (hotel, Airbnb, casa de amigos)', keywords: ['hotel', 'airbnb', 'hostel', 'friend', 'manhattan', 'staying at', 'booked', 'reservation'] },
    ],
    turns: [
      {
        match: ['vacation', 'tourism', 'tourist', 'business', 'holiday', 'visiting', 'conference', 'trip', 'sightseeing'],
        reply: "I see. How long will you be staying in the country, and do you have a return ticket?",
        translation: "Entendo. Por quanto tempo você vai ficar no país e você tem passagem de volta?",
        hint: "Try saying: 'I am staying for ten days, and yes, my return flight is on November 10th.'",
      },
      {
        match: ['days', 'week', 'weeks', 'month', 'return', 'ticket', 'flight'],
        reply: "Alright. And where will you be staying during your trip?",
        translation: "Certo. E onde você vai ficar hospedado durante a sua viagem?",
        hint: "Try saying: 'I have a reservation at a hotel in Midtown Manhattan.'",
      },
      {
        match: ['hotel', 'airbnb', 'hostel', 'friend', 'family', 'manhattan', 'downtown', 'reservation', 'booked'],
        reply: "Everything looks good. Here is your passport back. Enjoy your stay and welcome to the United States!",
        translation: "Tudo parece certo. Aqui está seu passaporte de volta. Aproveite sua estadia e bem-vindo aos Estados Unidos!",
        hint: "Try saying: 'Thank you very much, Officer! Have a good evening.'",
      },
    ],
    defaultReply: "Could you clarify how long you're staying and which hotel you booked?",
    defaultTranslation: "Você poderia esclarecer por quanto tempo vai ficar e qual hotel reservou?",
  },
  {
    id: 'tech-interview',
    title: 'Entrevista Internacional (Tech / Corporativo)',
    role: 'Sarah Jenkins (Hiring Manager)',
    avatar: '💼',
    level: 'B1-B2',
    accent: 'en-US',
    description: 'Apresente sua experiência profissional, fale sobre um desafio que resolveu e faça uma pergunta.',
    initialMessage: "Hi! Thanks so much for joining the call today. To kick things off, could you tell me a little bit about your background and what you're currently working on?",
    initialTranslation: "Oi! Muito obrigada por entrar na chamada hoje. Para começarmos, você poderia me contar um pouco sobre sua trajetória e no que está trabalhando atualmente?",
    missions: [
      { id: 'intro', label: 'Apresente sua área/experiência atual', keywords: ['work', 'experience', 'developer', 'engineer', 'designer', 'manager', 'years', 'currently', 'focused', 'background', 'student', 'learning'] },
      { id: 'challenge', label: 'Conte sobre um projeto ou como lida com desafios em equipe', keywords: ['project', 'team', 'problem', 'challenge', 'solved', 'built', 'deadline', 'communication', 'helped', 'improved'] },
      { id: 'question', label: 'Faça uma pergunta sobre a cultura ou rotina da equipe', keywords: ['culture', 'team', 'day-to-day', 'stack', 'challenges', 'question', 'how does', 'what is'] },
    ],
    turns: [
      {
        match: ['work', 'experience', 'developer', 'engineer', 'designer', 'years', 'currently', 'background', 'study', 'software', 'building'],
        reply: "That's a great background! Could you share an example of a challenging problem or project you tackled recently and how you handled it?",
        translation: "Ótima trajetória! Você poderia compartilhar um exemplo de um problema ou projeto desafiador que enfrentou recentemente e como lidou com ele?",
        hint: "Try saying: 'Recently, our team faced a tight deadline on a key feature. I helped break down the tasks and improved our communication.'",
      },
      {
        match: ['project', 'team', 'problem', 'challenge', 'solved', 'built', 'deadline', 'helped', 'improved', 'worked'],
        reply: "I really like your proactive approach to problem-solving. Before we wrap up this part, do you have any questions for me about the role or our team culture?",
        translation: "Gostei muito da sua abordagem proativa para resolver problemas. Antes de encerrarmos esta parte, você tem alguma pergunta para mim sobre a vaga ou a cultura da nossa equipe?",
        hint: "Try saying: 'Yes! What does a typical day look like for someone in this role, and what are the biggest priorities for the next quarter?'",
      },
      {
        match: ['culture', 'typical', 'day', 'priorities', 'team', 'question', 'how', 'what', 'remote'],
        reply: "Great question! We work asynchronously with a lot of autonomy, and our main focus right now is scaling our platform globally. You did fantastic today—we'll be in touch with next steps very soon!",
        translation: "Ótima pergunta! Trabalhamos de forma assíncrona com muita autonomia, e nosso foco principal agora é escalar nossa plataforma globalmente. Você foi muito bem hoje — entraremos em contato com os próximos passos em breve!",
        hint: "Try saying: 'Thank you for your time, Sarah! I really enjoyed our conversation and look forward to hearing from you.'",
      },
    ],
    defaultReply: "That sounds interesting! How did that impact your team's results, and do you have any questions about our company culture?",
    defaultTranslation: "Isso parece interessante! Como isso impactou os resultados da sua equipe, e você tem alguma pergunta sobre a cultura da nossa empresa?",
  },
  {
    id: 'hotel-problem',
    title: 'Resolvendo Imprevisto no Hotel',
    role: 'Oliver (Recepcionista em Londres)',
    avatar: '🏨',
    level: 'B1-B2',
    accent: 'en-GB',
    description: 'Faça o check-in e resolva educadamente um problema com o ar-condicionado ou Wi-Fi do quarto.',
    initialMessage: "Good afternoon! Welcome to The Kensington Grand. How may I assist you today?",
    initialTranslation: "Boa tarde! Bem-vindo ao The Kensington Grand. Como posso ajudá-lo hoje?",
    missions: [
      { id: 'checkin', label: 'Faça o check-in informando que tem uma reserva', keywords: ['check in', 'check-in', 'reservation', 'booked', 'booking', 'name', 'room'] },
      { id: 'issue', label: 'Relate um problema no quarto (Wi-Fi, barulho ou ar-condicionado)', keywords: ['working', 'broken', 'wifi', 'wi-fi', 'air conditioning', 'cold', 'noisy', 'issue', 'problem', 'change'] },
      { id: 'solution', label: 'Aceite a troca de quarto e pergunte sobre o horário do café da manhã', keywords: ['breakfast', 'time', 'thank', 'sounds good', 'great', 'key', 'floor'] },
    ],
    turns: [
      {
        match: ['check', 'reservation', 'booked', 'booking', 'room', 'name'],
        reply: "Certainly! I have your reservation right here for three nights. However, if there is anything you need with your room, just let me know!",
        translation: "Certamente! Tenho sua reserva bem aqui para três noites. Caso precise de qualquer coisa com seu quarto, é só me avisar!",
        hint: "Try saying: 'Actually, I just went up to room 304 and noticed the air conditioning isn't working properly. Would it be possible to switch rooms?'",
      },
      {
        match: ['working', 'broken', 'wifi', 'wi-fi', 'air', 'cold', 'hot', 'noisy', 'problem', 'issue', 'switch', 'change'],
        reply: "Oh, I sincerely apologize for the inconvenience! Let me upgrade you right away to a quiet suite on the fifth floor at no extra charge. Is there anything else I can help you with?",
        translation: "Oh, peço sinceras desculpas pelo inconveniente! Deixe-me fazer um upgrade imediato para uma suíte silenciosa no quinto andar sem custo extra. Há mais alguma coisa em que eu possa ajudar?",
        hint: "Try saying: 'That sounds wonderful, thank you! By the way, what time is breakfast served in the morning?'",
      },
      {
        match: ['breakfast', 'time', 'morning', 'thank', 'wonderful', 'great', 'perfect'],
        reply: "Breakfast is served from 7:00 AM to 10:30 AM in the garden lounge. Here is your new keycard for room 508. Enjoy your stay!",
        translation: "O café da manhã é servido das 7h às 10h30 no salão do jardim. Aqui está seu novo cartão-chave para o quarto 508. Aproveite a estadia!",
        hint: "Try saying: 'Appreciate your help, Oliver! Have a lovely afternoon.'",
      },
    ],
    defaultReply: "I'd be happy to help with that! Would you like me to arrange another room for you or tell you about our breakfast hours?",
    defaultTranslation: "Ficarei feliz em ajudar com isso! Gostaria que eu providenciasse outro quarto ou informasse sobre o horário do café da manhã?",
  },
];

// Analisador inteligente de frases em inglês (detecta erros comuns de brasileiros e sugere melhorias naturais)
export function analyzeUserEnglish(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  const corrections = [];

  // 1. "I have X years" -> "I am X years old"
  const ageMatch = lower.match(/\bi have (\d+) years\b/);
  if (ageMatch) {
    corrections.push({
      type: 'correction',
      title: 'Dica de Fluência (Idade em Inglês)',
      explanation: 'Em inglês usamos o verbo "to be" (I am) para falar de idade, e não "have".',
      betterWay: trimmed.replace(/i have (\d+) years(\s*old)?/i, 'I am $1 years old'),
      vocabToSave: {
        word: 'I am ... years old',
        phonetic: '/aɪ æm ... jɪərz əʊld/',
        translation: 'Eu tenho ... anos de idade',
        example: 'I am twenty-eight years old.',
      },
    });
  }

  // 2. "depend of" -> "depend on"
  if (lower.includes('depend of') || lower.includes('depends of')) {
    corrections.push({
      type: 'correction',
      title: 'Preposição Correta: Depend ON',
      explanation: 'O verbo "depend" sempre pede a preposição "on" (e nunca "of").',
      betterWay: trimmed.replace(/depends?\s+of/gi, (m) => m.replace(/of/i, 'on')),
      vocabToSave: {
        word: 'depend on',
        phonetic: '/dɪˈpend ɒn/',
        translation: 'depender de',
        example: 'It depends on the weather.',
      },
    });
  }

  // 3. "informations" -> "information"
  if (lower.includes('informations')) {
    corrections.push({
      type: 'correction',
      title: 'Substantivo Incontável: Information',
      explanation: '"Information" é incontável em inglês e nunca leva "s" no plural.',
      betterWay: trimmed.replace(/informations/gi, 'information'),
      vocabToSave: {
        word: 'a piece of information',
        phonetic: '/ˌɪn.fəˈmeɪ.ʃən/',
        translation: 'uma informação (incontável)',
        example: 'Thank you for all the useful information.',
      },
    });
  }

  // 4. "explain me" -> "explain to me"
  if (lower.includes('explain me')) {
    corrections.push({
      type: 'correction',
      title: 'Estrutura: Explain TO me',
      explanation: 'Diferente de "tell me", o verbo "explain" exige a preposição "to" antes da pessoa.',
      betterWay: trimmed.replace(/explain me/gi, 'explain to me'),
      vocabToSave: {
        word: 'explain to someone',
        phonetic: '/ɪkˈspleɪn tuː/',
        translation: 'explicar para alguém',
        example: 'Could you explain this rule to me?',
      },
    });
  }

  // 5. "I want a..." -> "Could I have a..." / "I'd like a..." (Politeness upgrade)
  if (lower.startsWith('i want ')) {
    const rest = trimmed.slice(7);
    corrections.push({
      type: 'upgrade',
      title: 'Soando mais natural e educado',
      explanation: 'Usar "I want..." em restaurantes ou lojas pode soar muito direto. Nativos preferem "I’d like..." ou "Could I get...".',
      betterWay: `I'd like ${rest}`,
      vocabToSave: {
        word: "I'd like / Could I get...",
        phonetic: '/aɪd laɪk/',
        translation: 'Eu gostaria de... / Você poderia me vê...',
        example: "I'd like a medium iced latte, please.",
      },
    });
  }

  // 6. "work in" vs "work on" / general positive natural upgrade
  if (corrections.length === 0) {
    if (trimmed.split(/\s+/).length <= 4) {
      return {
        type: 'upgrade',
        title: 'Expanda sua frase como um nativo',
        explanation: 'Sua resposta está compreensível! Você pode deixá-la ainda mais natural adicionando expressões de cortesia ou conectivos.',
        betterWay: `${trimmed.replace(/[.!?]+$/, '')}, please. Thank you!`,
        vocabToSave: {
          word: 'If you don’t mind',
          phonetic: '/ɪf juː dəʊnt maɪnd/',
          translation: 'Se você não se importar (expressão de cortesia)',
          example: 'Could I have a glass of water, if you don’t mind?',
        },
      };
    }

    return {
      type: 'praise',
      title: 'Ótima construção em inglês! ✨',
      explanation: 'Sua frase soou clara, bem estruturada e adequada ao contexto da conversa.',
      betterWay: trimmed,
      vocabToSave: null,
    };
  }

  return corrections[0];
}
