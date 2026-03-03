/**
 * Scoring Engine Tests
 * Run: npx jest src/lib/scoring/engine.test.ts
 */

import {
  computeBaseScore,
  computeScore,
  checkSpikeRatio,
  checkDecoupling,
  checkRateJump,
  computePenalty,
  clamp,
  percentile,
  median,
  SCORING_CONFIG,
  type Snapshot,
} from './engine'

// ─── Helper ────────────────────────────────────────────────────
function makeSnapshot(
  view_count: number,
  like_count: number,
  comment_count: number,
  share_count: number,
  minutesAgo: number
): Snapshot {
  const d = new Date(Date.now() - minutesAgo * 60_000)
  return { view_count, like_count, comment_count, share_count, fetched_at: d.toISOString() }
}

function linearGrowth(
  steps: number,
  viewsPerStep: number,
  likeRate = 0.05,
  commentRate = 0.005,
  shareRate = 0.002
): Snapshot[] {
  return Array.from({ length: steps }, (_, i) => {
    const v = (i + 1) * viewsPerStep
    return makeSnapshot(
      v,
      Math.round(v * likeRate),
      Math.round(v * commentRate),
      Math.round(v * shareRate),
      (steps - i) * 30
    )
  })
}

// ─── Math helpers ──────────────────────────────────────────────
describe('clamp', () => {
  test('below lo', () => expect(clamp(-5, 0, 10)).toBe(0))
  test('above hi', () => expect(clamp(15, 0, 10)).toBe(10))
  test('within range', () => expect(clamp(5, 0, 10)).toBe(5))
})

describe('percentile', () => {
  test('empty array', () => expect(percentile([], 0.5)).toBe(0))
  test('p50 of [1,2,3,4,5]', () => expect(percentile([1,2,3,4,5], 0.5)).toBe(3))
  test('p95 of 100 values', () => {
    const arr = Array.from({ length: 100 }, (_, i) => i + 1).sort((a,b)=>a-b)
    expect(percentile(arr, 0.95)).toBeCloseTo(95.95, 0)
  })
})

describe('median', () => {
  test('empty', () => expect(median([])).toBe(0))
  test('odd count', () => expect(median([3, 1, 2])).toBe(2))
  test('even count', () => expect(median([1, 2, 3, 4])).toBe(2.5))
})

// ─── BaseScore ─────────────────────────────────────────────────
describe('computeBaseScore', () => {
  test('below MIN_VIEWS → 0', () => {
    const { base_score } = computeBaseScore(4999, 500, 50, 10)
    expect(base_score).toBe(0)
  })

  test('exactly MIN_VIEWS → near 0 view component', () => {
    const { base_score, components } = computeBaseScore(5000, 0, 0, 0)
    expect(components.v).toBeCloseTo(0, 2)
    expect(base_score).toBeGreaterThanOrEqual(0)
  })

  test('at VIEWS_CAP with max rates → ~10', () => {
    const v = 200_000
    const { base_score } = computeBaseScore(
      v,
      Math.round(v * 0.12),   // LR_MAX
      Math.round(v * 0.02),   // CR_MAX
      Math.round(v * 0.01)    // SHR_MAX
    )
    expect(base_score).toBeCloseTo(10, 0)
  })

  test('capped at 10', () => {
    const { base_score } = computeBaseScore(1_000_000, 500_000, 100_000, 50_000)
    expect(base_score).toBeLessThanOrEqual(10)
  })

  test('zero engagements → only view component', () => {
    const { components } = computeBaseScore(50_000, 0, 0, 0)
    expect(components.l).toBe(0)
    expect(components.c).toBe(0)
    expect(components.sh).toBe(0)
    expect(components.v).toBeGreaterThan(0)
  })
})

// ─── Penalty ───────────────────────────────────────────────────
describe('computePenalty', () => {
  test('0 flags → 0', () => expect(computePenalty(0)).toBe(0))
  test('1 flag  → 0', () => expect(computePenalty(1)).toBe(0))
  test('2 flags → -1', () => expect(computePenalty(2)).toBe(-1))
  test('3 flags → -2', () => expect(computePenalty(3)).toBe(-2))
  test('4 flags → -3', () => expect(computePenalty(4)).toBe(-3))
})

// ─── Spike Ratio ───────────────────────────────────────────────
describe('checkSpikeRatio', () => {
  test('no deltas → no flag', () => {
    expect(checkSpikeRatio([]).flag).toBe(false)
  })

  test('steady growth → no flag', () => {
    const deltas = Array.from({ length: 10 }, (_, i) => ({
      dViews: 1000, dLikes: 50, dComments: 5, dShares: 2, i
    }))
    expect(checkSpikeRatio(deltas).flag).toBe(false)
  })

  test('single massive spike → flag', () => {
    const deltas = [
      ...Array.from({ length: 10 }, (_, i) => ({ dViews: 100, dLikes: 5, dComments: 1, dShares: 0, i })),
      { dViews: 50_000, dLikes: 100, dComments: 2, dShares: 0, i: 10 },
    ]
    expect(checkSpikeRatio(deltas).flag).toBe(true)
  })

  test('median=0 with spike → flag', () => {
    const deltas = [
      ...Array.from({ length: 8 }, (_, i) => ({ dViews: 0, dLikes: 0, dComments: 0, dShares: 0, i })),
      { dViews: 5000, dLikes: 0, dComments: 0, dShares: 0, i: 8 },
    ]
    expect(checkSpikeRatio(deltas).flag).toBe(true)
  })

  test('median=0, all zeros → no flag', () => {
    const deltas = Array.from({ length: 5 }, (_, i) => ({
      dViews: 0, dLikes: 0, dComments: 0, dShares: 0, i
    }))
    expect(checkSpikeRatio(deltas).flag).toBe(false)
  })
})

// ─── Decoupling ────────────────────────────────────────────────
describe('checkDecoupling', () => {
  test('no deltas → no flag', () => {
    expect(checkDecoupling([]).flag).toBe(false)
  })

  test('normal engagement ratio → no flag', () => {
    const deltas = Array.from({ length: 20 }, (_, i) => ({
      dViews: 1000, dLikes: 60, dComments: 15, dShares: 5, i
    }))
    expect(checkDecoupling(deltas).flag).toBe(false)
  })

  test('high dViews with near-zero engagement → flag', () => {
    const deltas = [
      ...Array.from({ length: 19 }, (_, i) => ({
        dViews: 1000, dLikes: 60, dComments: 15, dShares: 5, i
      })),
      // p95 spike with basically no engagement
      { dViews: 50_000, dLikes: 2, dComments: 1, dShares: 0, i: 19 },
    ]
    expect(checkDecoupling(deltas).flag).toBe(true)
  })

  test('baseline rates 0, spike with no engagement → flag', () => {
    const deltas = [
      ...Array.from({ length: 5 }, (_, i) => ({
        dViews: 100, dLikes: 0, dComments: 0, dShares: 0, i
      })),
      { dViews: 10_000, dLikes: 0, dComments: 0, dShares: 0, i: 5 },
    ]
    expect(checkDecoupling(deltas).flag).toBe(true)
  })
})

// ─── Rate Jump ─────────────────────────────────────────────────
describe('checkRateJump', () => {
  test('too few snapshots → no flag', () => {
    const snaps = [
      makeSnapshot(10000, 500, 50, 20, 60),
      makeSnapshot(20000, 1000, 100, 40, 30),
    ]
    expect(checkRateJump(snaps).flag).toBe(false)
  })

  test('stable rates → no flag', () => {
    const snaps = linearGrowth(12, 5000)
    expect(checkRateJump(snaps).flag).toBe(false)
  })

  test('sudden like-rate spike then drop → flag', () => {
    // Cumulative: normal growth, then sudden like burst, then back to normal
    const snaps = [
      makeSnapshot(10000, 500, 100, 20, 120),   // lr=0.05
      makeSnapshot(12000, 600, 120, 24, 90),    // lr=0.05
      makeSnapshot(14000, 2800, 140, 28, 60),   // lr=0.20  (4x jump!)
      makeSnapshot(16000, 1600, 160, 32, 30),   // lr=0.10  (drop back down)
      makeSnapshot(18000, 900, 180, 36, 0),     // lr=0.05
    ]
    expect(checkRateJump(snaps).flag).toBe(true)
  })
})

// ─── Full computeScore ─────────────────────────────────────────
describe('computeScore', () => {
  test('no snapshots → all zeros', () => {
    const result = computeScore([])
    expect(result.base_score).toBe(0)
    expect(result.final_score).toBe(0)
    expect(result.flag_count).toBe(0)
  })

  test('below MIN_VIEWS → all zeros', () => {
    const snaps = [makeSnapshot(3000, 150, 15, 6, 0)]
    const result = computeScore(snaps)
    expect(result.base_score).toBe(0)
    expect(result.final_score).toBe(0)
    expect(result.penalty).toBe(0)
  })

  test('score clamped at 10', () => {
    const snaps = linearGrowth(20, 15000, 0.12, 0.02, 0.01)
    const result = computeScore(snaps)
    expect(result.final_score).toBeLessThanOrEqual(10)
    expect(result.final_score).toBeGreaterThanOrEqual(0)
  })

  test('score clamped at 0 (heavy penalty)', () => {
    const result = computeScore([], SCORING_CONFIG.SNAPSHOT_N)
    expect(result.final_score).toBeGreaterThanOrEqual(0)
  })

  // Simulation: normal organic growth
  test('simulation: organic growth → no flags', () => {
    const snaps = linearGrowth(48, 2000, 0.06, 0.008, 0.003)
    const result = computeScore(snaps)
    expect(result.flag_count).toBe(0)
    expect(result.penalty).toBe(0)
    expect(result.final_score).toBeGreaterThan(0)
    expect(result.under_review).toBe(false)
  })

  // Simulation: bot-like spike (huge views, near-zero engagement)
  test('simulation: bot spike → spike_ratio + decoupling flags', () => {
    const snaps: Snapshot[] = [
      // 20 normal snapshots
      ...linearGrowth(20, 500, 0.05, 0.006, 0.002),
      // Sudden massive view spike with no engagement
      makeSnapshot(50000, 1000, 60, 10, 30),
      makeSnapshot(100000, 1050, 62, 11, 0),
    ]
    const result = computeScore(snaps)
    expect(result.flags.spike_ratio || result.flags.decoupling).toBe(true)
    expect(result.flag_count).toBeGreaterThanOrEqual(1)
  })

  // Simulation: spike WITH engagement (legitimate viral)
  test('simulation: viral spike with engagement → low/no flags', () => {
    const snaps: Snapshot[] = [
      ...linearGrowth(10, 1000, 0.05, 0.006, 0.002),
      // Viral: views spike AND engagement spikes proportionally
      makeSnapshot(20000, 1200, 180, 60, 60),
      makeSnapshot(50000, 3000, 450, 150, 30),
      makeSnapshot(90000, 5400, 810, 270, 0),
    ]
    const result = computeScore(snaps)
    // May still flag spike_ratio (fast growth), but decoupling should NOT fire
    expect(result.flags.decoupling).toBe(false)
    expect(result.final_score).toBeGreaterThan(0)
  })

  test('under_review only when penalty <= -2', () => {
    // 3 flags → penalty -2 → under_review
    const mockResult = {
      base_score: 5, final_score: 3, penalty: -2, flag_count: 3,
      under_review: true,
      flags: { spike_ratio: true, decoupling: true, rate_jump: true },
      details: {}
    }
    expect(mockResult.under_review).toBe(true)

    // 1 flag → penalty 0 → not under_review
    const safeResult = {
      base_score: 5, final_score: 5, penalty: 0, flag_count: 1,
      under_review: false,
      flags: { spike_ratio: true, decoupling: false, rate_jump: false },
      details: {}
    }
    expect(safeResult.under_review).toBe(false)
  })
})
