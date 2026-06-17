export interface SM2Result {
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReview: Date;
}

/**
 * Implémentation de l'algorithme de répétition espacée SuperMemo-2 (SM-2).
 * 
 * @param quality Note de rappel (0-5) : 
 *                0-2 = réponse fausse/oubliée, 
 *                3 = correcte avec difficultés, 
 *                4 = correcte avec hésitation, 
 *                5 = rappel parfait.
 * @param prevInterval Intervalle de révision précédent (en jours).
 * @param prevEaseFactor Facteur d'aisance précédent (par défaut 2.5).
 * @param prevRepetitions Nombre de répétitions réussies consécutives.
 */
export function calculateSM2(
  quality: number,
  prevInterval: number,
  prevEaseFactor: number,
  prevRepetitions: number
): SM2Result {
  let interval = 1;
  let easeFactor = prevEaseFactor;
  let repetitions = prevRepetitions;

  // 1. Recalculer le facteur d'aisance (ease factor)
  // easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // 2. Calculer l'intervalle et les répétitions
  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(prevInterval * easeFactor);
    }
    repetitions = repetitions + 1;
  } else {
    // Si la réponse est incorrecte (0, 1, 2)
    repetitions = 0;
    interval = 1;
  }

  // 3. Calculer la date de la prochaine révision
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  // Optionnel : Réinitialiser l'heure à minuit ou conserver l'heure actuelle
  // Pour plus de flexibilité, on garde l'heure actuelle mais décalée du nombre de jours
  
  return {
    interval,
    easeFactor,
    repetitions,
    nextReview,
  };
}
