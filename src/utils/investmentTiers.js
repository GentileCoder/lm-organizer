/**
 * The investment analyzer's ROI score tiers. `tier` matches a `.tier-*` class in
 * styles/utilities.css, so the color always comes from the active theme instead of a
 * hardcoded hex — see utils/investmentCalc.js for where `scoreTier` is assigned.
 */
export const SCORE_TIERS = [
  { stars: '⭐⭐⭐⭐⭐', label: 'Excellent', range: 'ROI > 50%', tier: 'excellent' },
  { stars: '⭐⭐⭐⭐', label: 'Great', range: 'ROI 30–50%', tier: 'great' },
  { stars: '⭐⭐⭐', label: 'Good', range: 'ROI 15–30%', tier: 'good' },
  { stars: '⭐⭐', label: 'Fair', range: 'ROI 5–15%', tier: 'fair' },
  { stars: '⭐', label: 'Poor', range: 'ROI 0–5%', tier: 'poor' },
  { stars: '💸', label: 'Loss', range: 'Negative ROI', tier: 'loss' },
]

export function tierClass(tier) {
  return `tier-${tier}`
}

const TIER_BY_SCORE = ['loss', 'poor', 'fair', 'good', 'great', 'excellent']

/**
 * Analyses saved before this file existed only have a numeric `score` (0-5) and a hex
 * `scoreColor`, not `scoreTier` — derive it from `score` so old saved data still renders
 * with the right color instead of falling through to no color at all.
 */
export function tierFromScore(score) {
  return TIER_BY_SCORE[score] ?? 'good'
}
