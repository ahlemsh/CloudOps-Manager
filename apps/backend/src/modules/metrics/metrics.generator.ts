/**
 * metrics.generator.ts
 *
 * Fonctions PURES de génération de métriques simulées.
 * Aucune dépendance externe (pas de Prisma, pas de NestJS) → facilement testables.
 *
 * Stratégie de simulation :
 *  - Chaque valeur évolue par variation douce : ±STEP_MAX par tick
 *  - Les valeurs sont bornées entre MIN (0) et MAX (100 pour %, kbps pour réseau)
 *  - Environ 1 tick sur SPIKE_PROBABILITY génère un pic CPU > 90 % pour la démo
 */

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Variation maximale par tick (en points de %) pour CPU, RAM, DISK */
const STEP_MAX = 8;

/** Variation maximale par tick pour le réseau (en kbps) */
const NETWORK_STEP_MAX = 200;

/** Probabilité (0–1) qu'un pic CPU soit généré au tick courant */
const SPIKE_PROBABILITY = 0.12; // ~1 pic toutes les ~8 mesures ≈ toutes les 4 min

/** Valeur minimale de CPU lors d'un pic */
const SPIKE_CPU_MIN = 91;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MetricSnapshot {
  cpu_percent: number;
  ram_percent: number;
  disk_percent: number;
  network_in_kbps: number;
  network_out_kbps: number;
}

// ─── Helpers internes ─────────────────────────────────────────────────────────

/**
 * Clamp une valeur dans [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Applique une variation douce aléatoire à `current` et retourne la nouvelle
 * valeur bornée dans [0, max].
 *
 * @param current  Valeur actuelle
 * @param stepMax  Amplitude maximale de la variation (positif ou négatif)
 * @param max      Borne supérieure (la borne inférieure est toujours 0)
 */
export function softStep(current: number, stepMax: number, max: number): number {
  const delta = (Math.random() * 2 - 1) * stepMax; // ∈ [-stepMax, +stepMax]
  return clamp(current + delta, 0, max);
}

// ─── API publique ─────────────────────────────────────────────────────────────

/**
 * Génère un nouveau snapshot de métriques à partir du snapshot précédent.
 *
 * Variation douce : chaque valeur évolue de ±STEP_MAX par rapport au tick
 * précédent, garantissant des courbes réalistes sans sauts brutaux.
 *
 * Pic occasionnel : avec une probabilité SPIKE_PROBABILITY, cpu_percent est
 * forcé entre SPIKE_CPU_MIN et 100 pour simuler une surcharge et déclencher
 * les alertes pendant la démonstration.
 *
 * @param previous  Snapshot précédent (ou valeurs initiales au démarrage)
 * @returns         Nouveau snapshot avec toutes les valeurs bornées [0, 100]
 */
export function generateNextMetric(previous: MetricSnapshot): MetricSnapshot {
  // Variation douce sur chaque indicateur
  let cpu      = softStep(previous.cpu_percent,      STEP_MAX,         100);
  const ram    = softStep(previous.ram_percent,      STEP_MAX,         100);
  const disk   = softStep(previous.disk_percent,     STEP_MAX / 2,     100); // disque évolue plus lentement
  const netIn  = softStep(previous.network_in_kbps,  NETWORK_STEP_MAX, 10_000);
  const netOut = softStep(previous.network_out_kbps, NETWORK_STEP_MAX, 10_000);

  // Pic CPU occasionnel pour la démo (déclenche les AlertRules CPU > seuil)
  if (Math.random() < SPIKE_PROBABILITY) {
    cpu = clamp(
      SPIKE_CPU_MIN + Math.random() * (100 - SPIKE_CPU_MIN),
      SPIKE_CPU_MIN,
      100,
    );
  }

  return {
    cpu_percent:      cpu,
    ram_percent:      ram,
    disk_percent:     disk,
    network_in_kbps:  netIn,
    network_out_kbps: netOut,
  };
}

/**
 * Génère un snapshot initial avec des valeurs plausibles au démarrage.
 * Utilisé quand il n'y a pas encore de mesure précédente en base.
 */
export function generateInitialMetric(): MetricSnapshot {
  return {
    cpu_percent:      clamp(20 + Math.random() * 40, 0, 100), // 20–60 %
    ram_percent:      clamp(30 + Math.random() * 40, 0, 100), // 30–70 %
    disk_percent:     clamp(10 + Math.random() * 30, 0, 100), // 10–40 %
    network_in_kbps:  clamp(100 + Math.random() * 900, 0, 10_000),
    network_out_kbps: clamp(50  + Math.random() * 450, 0, 10_000),
  };
}
