/**
 * Per-criterion SVG icons for the result screen reveal sequence (GAME-066 / DESIGN-010).
 *
 * Each icon is a 24×24 viewBox, 2px stroke, optimised for dark backgrounds.
 * Exported as inline SVG strings — no HTTP requests.
 *
 * Lookup: getCriterionIcon(criterionId, criterionType)
 *   - criterionType is the Criterion["type"] string for scenario criteria
 *   - criterionId prefix "validity:" is used for structural validity rows
 */

const ICONS: Record<string, string> = {
  district_count: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>`,

  population_balance: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="12" y1="3" x2="12" y2="21"/>
    <line x1="4" y1="8" x2="20" y2="8"/>
    <path d="M4 8 Q5 12 8 14 Q11 12 12 8"/>
    <path d="M12 8 Q13 12 16 14 Q19 12 20 8"/>
    <line x1="9" y1="21" x2="15" y2="21"/>
  </svg>`,

  seat_count: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="6" y="10" width="12" height="7" rx="1"/>
    <line x1="6" y1="10" x2="6" y2="7"/>
    <line x1="18" y1="10" x2="18" y2="7"/>
    <line x1="4" y1="17" x2="4" y2="21"/>
    <line x1="20" y1="17" x2="20" y2="21"/>
    <line x1="8" y1="7" x2="16" y2="7"/>
  </svg>`,

  majority_minority: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="9" cy="7" r="3"/>
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
    <circle cx="16" cy="7" r="3" stroke-dasharray="2 1"/>
  </svg>`,

  efficiency_gap: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="3" y1="21" x2="21" y2="21"/>
    <rect x="5" y="9" width="5" height="12"/>
    <rect x="14" y="4" width="5" height="17"/>
  </svg>`,

  mean_median: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 18 Q8 4 12 4 Q16 4 21 18"/>
    <line x1="10" y1="8" x2="10" y2="20" stroke-dasharray="2 1"/>
    <line x1="13" y1="7" x2="13" y2="20"/>
  </svg>`,

  compactness: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="7" cy="12" r="4"/>
    <path d="M14 8 Q17 6 19 9 Q22 11 20 14 Q19 17 16 16 Q13 18 13 15 Q11 12 14 8Z"/>
  </svg>`,

  safe_seats: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 3 L20 7 L20 13 Q20 18 12 21 Q4 18 4 13 L4 7 Z"/>
  </svg>`,

  competitive_seats: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="3" y1="18" x2="21" y2="18"/>
    <line x1="9" y1="18" x2="9" y2="10"/>
    <polygon points="7,10 9,6 11,10"/>
    <line x1="15" y1="18" x2="15" y2="10"/>
    <polygon points="13,10 15,6 17,10"/>
  </svg>`,

  "validity:all-assigned": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
    <line x1="5" y1="17" x2="7" y2="19"/>
    <line x1="7" y1="19" x2="9" y2="15"/>
  </svg>`,

  "validity:population-balance": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <line x1="12" y1="3" x2="12" y2="21"/>
    <line x1="4" y1="10" x2="20" y2="10"/>
    <path d="M4 10 Q5 15 8 17 Q11 15 12 10"/>
    <path d="M12 10 Q13 13 16 12 Q19 11 20 10"/>
    <line x1="9" y1="21" x2="15" y2="21"/>
  </svg>`,

  "validity:contiguity": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 12 Q5 10 7 12 Q9 14 11 12"/>
    <path d="M13 12 Q15 10 17 12 Q19 14 21 12"/>
    <line x1="11" y1="12" x2="13" y2="12" stroke-dasharray="1 2"/>
  </svg>`,
};

/**
 * Return inline SVG markup for the given criterion.
 *
 * criterionType: the Criterion["type"] value for scenario criteria (e.g. "seat_count")
 * criterionId:  the CriterionId string; validity rows use "validity:*" prefix
 */
export function getCriterionIcon(criterionId: string, criterionType: string): string {
  // Exact type match first
  if (criterionType in ICONS) return ICONS[criterionType]!;
  // Validity prefix match (criterionId like "validity:contiguity-5" → "validity:contiguity")
  if (criterionId.startsWith("validity:contiguity")) return ICONS["validity:contiguity"]!;
  if (criterionId.startsWith("validity:all-assigned")) return ICONS["validity:all-assigned"]!;
  if (criterionId.startsWith("validity:population-balance")) return ICONS["validity:population-balance"]!;
  // Fallback: neutral dash
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="12" x2="18" y2="12"/></svg>`;
}
