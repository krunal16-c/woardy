'use strict';

const {
  getWashThreshold,
  needsWashing,
  getUrgencyLevel,
  CATEGORY_THRESHOLD,
} = require('../laundryThreshold');

// ---------------------------------------------------------------------------
// getWashThreshold
// ---------------------------------------------------------------------------
describe('getWashThreshold', () => {
  describe('category defaults (no special tags)', () => {
    test.each([
      ['tops',        2],
      ['bottoms',     3],
      ['dresses',     2],
      ['outerwear',   8],
      ['shoes',      20],
      ['accessories',20],
    ])('%s → %d wears', (category, expected) => {
      expect(getWashThreshold({ category, tags: [] })).toBe(expected);
    });

    it('returns 3 for an unknown category', () => {
      expect(getWashThreshold({ category: 'unknown', tags: [] })).toBe(3);
    });

    it('returns 3 when category is missing', () => {
      expect(getWashThreshold({ tags: [] })).toBe(3);
    });
  });

  describe('sport / athletic tag — wash after every wear', () => {
    it('sport top → 1 wear', () => {
      expect(getWashThreshold({ category: 'tops', tags: ['sport'] })).toBe(1);
    });

    it('athletic bottom → 1 wear', () => {
      expect(getWashThreshold({ category: 'bottoms', tags: ['athletic'] })).toBe(1);
    });

    it('sport dress → 1 wear', () => {
      expect(getWashThreshold({ category: 'dresses', tags: ['sport'] })).toBe(1);
    });

    it('sport outerwear → 1 wear', () => {
      expect(getWashThreshold({ category: 'outerwear', tags: ['sport'] })).toBe(1);
    });

    it('sport takes priority over denim', () => {
      expect(getWashThreshold({ category: 'bottoms', tags: ['denim', 'sport'] })).toBe(1);
    });

    it('sport takes priority over formal dress', () => {
      expect(getWashThreshold({ category: 'dresses', tags: ['formal', 'sport'] })).toBe(1);
    });
  });

  describe('denim bottoms — robust fabric, worn more between washes', () => {
    it('denim bottoms → 5 wears', () => {
      expect(getWashThreshold({ category: 'bottoms', tags: ['denim'] })).toBe(5);
    });

    it('denim tag on tops does not change tops threshold', () => {
      expect(getWashThreshold({ category: 'tops', tags: ['denim'] })).toBe(2);
    });

    it('denim tag on outerwear does not change outerwear threshold', () => {
      expect(getWashThreshold({ category: 'outerwear', tags: ['denim'] })).toBe(8);
    });
  });

  describe('formal / evening dresses — worn on occasions, not daily', () => {
    it('formal dress → 3 wears', () => {
      expect(getWashThreshold({ category: 'dresses', tags: ['formal'] })).toBe(3);
    });

    it('evening dress → 3 wears', () => {
      expect(getWashThreshold({ category: 'dresses', tags: ['evening'] })).toBe(3);
    });

    it('formal tag on tops does not raise top threshold', () => {
      expect(getWashThreshold({ category: 'tops', tags: ['formal'] })).toBe(2);
    });

    it('formal tag on bottoms does not raise bottom threshold', () => {
      expect(getWashThreshold({ category: 'bottoms', tags: ['formal'] })).toBe(3);
    });
  });

  describe('summer / light tops and dresses — heat & sweat reduce threshold', () => {
    it('summer top → 1 wear (base 2 − 1)', () => {
      expect(getWashThreshold({ category: 'tops', tags: ['summer'] })).toBe(1);
    });

    it('light top → 1 wear', () => {
      expect(getWashThreshold({ category: 'tops', tags: ['light'] })).toBe(1);
    });

    it('summer dress → 1 wear (base 2 − 1)', () => {
      expect(getWashThreshold({ category: 'dresses', tags: ['summer'] })).toBe(1);
    });

    it('summer tag on bottoms has no effect', () => {
      expect(getWashThreshold({ category: 'bottoms', tags: ['summer'] })).toBe(3);
    });

    it('summer tag on outerwear has no effect', () => {
      expect(getWashThreshold({ category: 'outerwear', tags: ['summer'] })).toBe(8);
    });

    it('result never drops below 1', () => {
      expect(getWashThreshold({ category: 'tops', tags: ['summer', 'light'] })).toBeGreaterThanOrEqual(1);
    });
  });

  describe('defensive — missing / null fields', () => {
    it('handles missing tags property', () => {
      expect(getWashThreshold({ category: 'tops' })).toBe(2);
    });

    it('handles null tags', () => {
      expect(getWashThreshold({ category: 'tops', tags: null })).toBe(2);
    });

    it('handles non-array tags gracefully', () => {
      expect(() => getWashThreshold({ category: 'tops', tags: 'summer' })).not.toThrow();
    });
  });
});

// ---------------------------------------------------------------------------
// needsWashing
// ---------------------------------------------------------------------------
describe('needsWashing', () => {
  it('returns false when item has never been worn', () => {
    expect(needsWashing({ category: 'tops', tags: [], wornSinceWash: 0 })).toBe(false);
  });

  it('returns false when worn count is below threshold', () => {
    // tops threshold = 2, worn 1 → not yet
    expect(needsWashing({ category: 'tops', tags: [], wornSinceWash: 1 })).toBe(false);
  });

  it('returns true when worn count equals threshold', () => {
    expect(needsWashing({ category: 'tops', tags: [], wornSinceWash: 2 })).toBe(true);
  });

  it('returns true when worn count exceeds threshold', () => {
    expect(needsWashing({ category: 'tops', tags: [], wornSinceWash: 5 })).toBe(true);
  });

  it('treats missing wornSinceWash as 0 (never worn)', () => {
    expect(needsWashing({ category: 'tops', tags: [] })).toBe(false);
  });

  it('sport top needs washing after exactly 1 wear', () => {
    expect(needsWashing({ category: 'tops', tags: ['sport'], wornSinceWash: 1 })).toBe(true);
  });

  it('sport top is clean after 0 wears', () => {
    expect(needsWashing({ category: 'tops', tags: ['sport'], wornSinceWash: 0 })).toBe(false);
  });

  it('denim bottom is clean after 3 wears (threshold = 5)', () => {
    expect(needsWashing({ category: 'bottoms', tags: ['denim'], wornSinceWash: 3 })).toBe(false);
  });

  it('denim bottom needs washing after 5 wears', () => {
    expect(needsWashing({ category: 'bottoms', tags: ['denim'], wornSinceWash: 5 })).toBe(true);
  });

  it('outerwear is clean after 4 wears (threshold = 8)', () => {
    expect(needsWashing({ category: 'outerwear', tags: [], wornSinceWash: 4 })).toBe(false);
  });

  it('outerwear needs washing after 8 wears', () => {
    expect(needsWashing({ category: 'outerwear', tags: [], wornSinceWash: 8 })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getUrgencyLevel
// ---------------------------------------------------------------------------
describe('getUrgencyLevel', () => {
  it('returns null when below threshold', () => {
    expect(getUrgencyLevel({ category: 'tops', tags: [], wornSinceWash: 1 })).toBeNull();
  });

  it('returns null for an unworn item', () => {
    expect(getUrgencyLevel({ category: 'tops', tags: [], wornSinceWash: 0 })).toBeNull();
  });

  it('returns "due" when worn count equals threshold', () => {
    // tops: threshold = 2
    expect(getUrgencyLevel({ category: 'tops', tags: [], wornSinceWash: 2 })).toBe('due');
  });

  it('returns "overdue" when 1 above threshold', () => {
    expect(getUrgencyLevel({ category: 'tops', tags: [], wornSinceWash: 3 })).toBe('overdue');
  });

  it('returns "urgent" when 2 above threshold', () => {
    expect(getUrgencyLevel({ category: 'tops', tags: [], wornSinceWash: 4 })).toBe('urgent');
  });

  it('returns "urgent" when far above threshold', () => {
    expect(getUrgencyLevel({ category: 'tops', tags: [], wornSinceWash: 10 })).toBe('urgent');
  });

  it('sport top is "due" after 1 wear', () => {
    expect(getUrgencyLevel({ category: 'tops', tags: ['sport'], wornSinceWash: 1 })).toBe('due');
  });

  it('sport top is "overdue" after 2 wears', () => {
    expect(getUrgencyLevel({ category: 'tops', tags: ['sport'], wornSinceWash: 2 })).toBe('overdue');
  });

  it('denim bottom is null after 3 wears (threshold = 5)', () => {
    expect(getUrgencyLevel({ category: 'bottoms', tags: ['denim'], wornSinceWash: 3 })).toBeNull();
  });

  it('denim bottom is "due" after 5 wears', () => {
    expect(getUrgencyLevel({ category: 'bottoms', tags: ['denim'], wornSinceWash: 5 })).toBe('due');
  });

  it('denim bottom is "overdue" after 6 wears', () => {
    expect(getUrgencyLevel({ category: 'bottoms', tags: ['denim'], wornSinceWash: 6 })).toBe('overdue');
  });

  it('outerwear is null after 7 wears (threshold = 8)', () => {
    expect(getUrgencyLevel({ category: 'outerwear', tags: [], wornSinceWash: 7 })).toBeNull();
  });

  it('formal dress is "due" after 3 wears', () => {
    expect(getUrgencyLevel({ category: 'dresses', tags: ['formal'], wornSinceWash: 3 })).toBe('due');
  });
});
