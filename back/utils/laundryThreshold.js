'use strict';

/**
 * Consumer-behaviour wash thresholds.
 *
 * Derived from common garment care conventions:
 *  - Sportswear: wash after every wear (sweat)
 *  - T-shirts / everyday tops: every 2 wears
 *  - Trousers / non-denim bottoms: every 3 wears
 *  - Denim: every 5 wears (fabric degrades faster with frequent washing)
 *  - Formal/evening dresses: every 3 wears (worn on occasions, not daily)
 *  - Regular dresses: every 2 wears
 *  - Outerwear/jackets: every 8 wears
 *  - Shoes/accessories: rarely laundered — high threshold to avoid false flags
 */
const CATEGORY_THRESHOLD = {
  tops:        2,
  bottoms:     3,
  dresses:     2,
  outerwear:   8,
  shoes:       20,
  accessories: 20,
};

const DEFAULT_THRESHOLD = 3;

/**
 * Returns the recommended number of wears before washing for a given item.
 *
 * Tag priority (highest → lowest):
 *   1. sport / athletic  → always 1
 *   2. denim (bottoms only) → 5
 *   3. formal / evening (dresses only) → 3
 *   4. summer / light (tops & dresses) → base − 1, min 1
 *   5. category default
 */
function getWashThreshold(item) {
  const category = item.category || '';
  const rawTags = item.tags;
  const tags = new Set(
    Array.isArray(rawTags)
      ? rawTags.map(t => String(t).toLowerCase())
      : []
  );

  // Highest priority: athletic / sport items must be washed after every wear
  if (tags.has('sport') || tags.has('athletic')) return 1;

  const base = CATEGORY_THRESHOLD[category] ?? DEFAULT_THRESHOLD;

  // Denim bottoms tolerate more wears than regular bottoms
  if (category === 'bottoms' && tags.has('denim')) return 5;

  // Formal / evening dresses are worn on occasions, not daily
  if (category === 'dresses' && (tags.has('formal') || tags.has('evening'))) return 3;

  // Summer / light tops and dresses collect more sweat — wash one wear sooner
  if (
    (category === 'tops' || category === 'dresses') &&
    (tags.has('summer') || tags.has('light'))
  ) {
    return Math.max(1, base - 1);
  }

  return base;
}

/**
 * Returns true when an item has met or exceeded its wash threshold.
 */
function needsWashing(item) {
  return (item.wornSinceWash || 0) >= getWashThreshold(item);
}

/**
 * Returns the urgency level of an item relative to its wash threshold.
 *
 *  null      – below threshold (no action needed)
 *  'due'     – exactly at threshold (time to wash)
 *  'overdue' – 1 wear past threshold
 *  'urgent'  – 2+ wears past threshold
 */
function getUrgencyLevel(item) {
  const threshold = getWashThreshold(item);
  const worn = item.wornSinceWash || 0;
  const over = worn - threshold;

  if (over < 0)  return null;
  if (over === 0) return 'due';
  if (over === 1) return 'overdue';
  return 'urgent';
}

module.exports = { getWashThreshold, needsWashing, getUrgencyLevel, CATEGORY_THRESHOLD };
