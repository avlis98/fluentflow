// Algoritmo SM-2 (Spaced Repetition System estilo Anki)
// quality: 0 = Errei (Again), 1 = Difícil (Hard), 2 = Bom (Good), 3 = Fácil (Easy)

export function calculateNextReview(card, quality) {
  const now = Date.now();
  let repetitions = card.repetitions || 0;
  let interval = card.interval || 0; // em dias
  let easeFactor = card.easeFactor || 2.5;

  if (quality === 0) {
    // Errei -> reinicia repetições, revisa hoje/em breve
    repetitions = 0;
    interval = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    return {
      ...card,
      repetitions,
      interval,
      easeFactor: Number(easeFactor.toFixed(2)),
      nextReview: now, // imediato/hoje
      lastReviewed: now,
      status: 'learning',
    };
  }

  if (quality === 1) {
    // Difícil
    repetitions += 1;
    interval = interval === 0 ? 1 : Math.max(1, Math.round(interval * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (quality === 2) {
    // Bom
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 3;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  } else if (quality === 3) {
    // Fácil
    repetitions += 1;
    if (repetitions === 1) {
      interval = 4;
    } else {
      interval = Math.round(interval * easeFactor * 1.3);
    }
    easeFactor = easeFactor + 0.15;
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
    status,
  };
}

export function getIntervalPreview(card, quality) {
  const simulated = calculateNextReview(card, quality);
  if (quality === 0) return '< 10 min';
  if (simulated.interval === 1) return '1 dia';
  return `${simulated.interval} dias`;
}
