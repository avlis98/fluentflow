// Algoritmo SM-2 Aprimorado (Spaced Repetition System Inteligente)
// quality: 0 = Errei (Again), 1 = Difícil (Hard), 2 = Bom (Good), 3 = Fácil (Easy)

export function calculateNextReview(card, quality) {
  const now = Date.now();
  let repetitions = card.repetitions || 0;
  let interval = card.interval || 0; // em dias
  let easeFactor = card.easeFactor || 2.5;

  const attempts = (card.attempts || 0) + 1;
  const correctCount = (card.correctCount || 0) + (quality >= 2 ? 1 : 0);
  const wrongCount = (card.wrongCount || 0) + (quality === 0 ? 1 : 0);
  const lapseCount =
    (card.lapseCount || 0) + (quality === 0 && repetitions > 0 ? 1 : 0);

  const historyEntry = {
    date: now,
    quality,
    previousInterval: interval,
  };
  const history = [...(card.history || []).slice(-19), historyEntry];

  if (quality === 0) {
    // Esquecido / Errei -> reduz intervalo, prioriza na fila imediata
    repetitions = 0;
    interval = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    return {
      ...card,
      repetitions,
      interval,
      easeFactor: Number(easeFactor.toFixed(2)),
      nextReview: now + 5 * 60 * 1000, // 5 minutos (prioridade máxima hoje)
      lastReviewed: now,
      attempts,
      correctCount,
      wrongCount,
      lapseCount,
      lastQuality: quality,
      history,
      status: 'relearning',
    };
  }

  if (quality === 1) {
    // Difícil -> intervalo curto conservador
    repetitions += 1;
    interval = interval === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (quality === 2) {
    // Bom -> progressão padrão SM-2 ajustada pelo histórico de erros
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 3;
    } else {
      const penaltyFactor = lapseCount > 2 ? 0.85 : 1.0;
      interval = Math.max(1, Math.round(interval * easeFactor * penaltyFactor));
    }
  } else if (quality === 3) {
    // Fácil -> reduz frequência de cartões já dominados
    repetitions += 1;
    if (repetitions === 1) {
      interval = 4;
    } else if (repetitions === 2) {
      interval = 7;
    } else {
      interval = Math.round(interval * easeFactor * 1.35);
    }
    easeFactor = Math.min(3.0, easeFactor + 0.15);
  }

  const nextReview = now + interval * 24 * 60 * 60 * 1000;
  const status = interval >= 7 ? 'mastered' : 'learning';

  return {
    ...card,
    repetitions,
    interval,
    easeFactor: Number(easeFactor.toFixed(2)),
    nextReview,
    lastReviewed: now,
    attempts,
    correctCount,
    wrongCount,
    lapseCount,
    lastQuality: quality,
    history,
    status,
  };
}

export function getIntervalPreview(card, quality) {
  const simulated = calculateNextReview(card, quality);
  if (quality === 0) return '< 5 min';
  if (simulated.interval === 1) return '1 dia';
  return `${simulated.interval} dias`;
}

// Filtra e ordena de forma inteligente:
// 1. Prioriza itens esquecidos ('relearning') ou com histórico de erros
// 2. Prioriza itens com revisão vencida (nextReview <= agora) ou novos
// 3. Evita repetir cartões já dominados ('mastered') cuja revisão está no futuro
export function getSmartReviewQueue(cards, { includeFuturePractice = false } = {}) {
  const now = Date.now();

  const dueOrForgotten = cards.filter((c) => {
    const isDue = (c.nextReview || 0) <= now;
    const isRelearning = c.status === 'relearning' || c.lastQuality === 0;
    return isDue || isRelearning;
  });

  const pool =
    dueOrForgotten.length > 0 || !includeFuturePractice
      ? dueOrForgotten
      : cards.filter((c) => c.status !== 'mastered');

  return [...pool].sort((a, b) => {
    // 1º: itens errados recentemente (relearning) vêm primeiro
    const aUrgent = a.status === 'relearning' || a.lastQuality === 0 ? 1 : 0;
    const bUrgent = b.status === 'relearning' || b.lastQuality === 0 ? 1 : 0;
    if (aUrgent !== bUrgent) return bUrgent - aUrgent;

    // 2º: maior taxa de erro histórico
    const aErrorScore = (a.wrongCount || 0) - (a.correctCount || 0) * 0.3;
    const bErrorScore = (b.wrongCount || 0) - (b.correctCount || 0) * 0.3;
    if (Math.abs(aErrorScore - bErrorScore) > 0.5) {
      return bErrorScore - aErrorScore;
    }

    // 3º: data de revisão mais antiga
    return (a.nextReview || 0) - (b.nextReview || 0);
  });
}
