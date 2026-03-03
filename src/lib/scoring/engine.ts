/**
 * ClipContest 10-Point Scoring Engine
 *
 * Input per video: views, likes, comments, shares
 * + time-series snapshots (every 30 min) for flag computation
 *
 * Final score = clamp(BaseScore + Penalty, 0, 10)
 */

// ─── Constants ────────────────────────────────────────────────
export const SCORING_CONFIG = {
  MIN_VIEWS:       100,   // TODO: set back to 5_000 for production
  VIEWS_CAP:   200_000,
  LR_MAX:         0.12,   // max like rate
  CR_MAX:         0.02,   // max comment rate
  SHR_MAX:        0.01,   // max share rate
  SNAPSHOT_N:       48,   // default snapshot window
  SPIKE_RATIO_THRESHOLD: 12,
  DECOUPLING_THRESHOLD:  0.3,
  RATE_JUMP_FACTOR:      3.0,
  RATE_JUMP_DROP:        0.5,
  P95_PERCENTILE:        0.95,
} as const

// ─── Types ────────────────────────────────────────────────────
export type Snapshot = {
  view_count:    number
  like_count:    number
  comment_count: number
  share_count:   number
  fetched_at:    string   // ISO timestamp
}

export type ScoreResult = {
  base_score:  number
  final_score: number
  penalty:     number
  flag_count:  number
  under_review: boolean
  flags: {
    spike_ratio:  boolean
    decoupling:   boolean
    rate_jump:    boolean
  }
  details: Record<string, unknown>
}

// ─── Math helpers ─────────────────────────────────────────────
export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = p * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return percentile(sorted, 0.5)
}

// ─── BaseScore ────────────────────────────────────────────────
export function computeBaseScore(
  views: number,
  likes: number,
  comments: number,
  shares: number,
  cfg = SCORING_CONFIG
): { base_score: number; components: Record<string, number> } {
  if (views < cfg.MIN_VIEWS) {
    return { base_score: 0, components: { v: 0, l: 0, c: 0, sh: 0 } }
  }

  // Views component (0..2) — log scale
  const logMin = Math.log10(cfg.MIN_VIEWS)
  const logCap = Math.log10(cfg.VIEWS_CAP)
  const logRange = logCap - logMin
  const V = clamp(Math.log10(views) - logMin, 0, logRange)
  const v_points = 2 * (V / logRange)

  // Like-rate component (0..2) — sqrt curve
  const LR = likes / views
  const l_points = 2 * Math.sqrt(clamp(LR, 0, cfg.LR_MAX) / cfg.LR_MAX)

  // Comment-rate component (0..3) — sqrt curve
  const CR = comments / views
  const c_points = 3 * Math.sqrt(clamp(CR, 0, cfg.CR_MAX) / cfg.CR_MAX)

  // Share-rate component (0..3) — sqrt curve
  const ShR = shares / views
  const sh_points = 3 * Math.sqrt(clamp(ShR, 0, cfg.SHR_MAX) / cfg.SHR_MAX)

  const base_score = clamp(v_points + l_points + c_points + sh_points, 0, 10)

  return {
    base_score: Math.round(base_score * 10000) / 10000,
    components: {
      v:  Math.round(v_points  * 10000) / 10000,
      l:  Math.round(l_points  * 10000) / 10000,
      c:  Math.round(c_points  * 10000) / 10000,
      sh: Math.round(sh_points * 10000) / 10000,
    },
  }
}

// ─── Delta helpers ────────────────────────────────────────────
type Delta = {
  dViews:    number
  dLikes:    number
  dComments: number
  dShares:   number
  i:         number
}

function computeDeltas(snapshots: Snapshot[]): Delta[] {
  const deltas: Delta[] = []
  for (let i = 1; i < snapshots.length; i++) {
    const prev = snapshots[i - 1]
    const curr = snapshots[i]
    deltas.push({
      dViews:    Math.max(0, curr.view_count    - prev.view_count),
      dLikes:    Math.max(0, curr.like_count    - prev.like_count),
      dComments: Math.max(0, curr.comment_count - prev.comment_count),
      dShares:   Math.max(0, curr.share_count   - prev.share_count),
      i,
    })
  }
  return deltas
}

// ─── Flag 1: Spike Ratio ──────────────────────────────────────
export function checkSpikeRatio(
  deltas: Delta[],
  threshold = SCORING_CONFIG.SPIKE_RATIO_THRESHOLD
): { flag: boolean; sr: number; medianViews: number; maxViews: number } {
  if (deltas.length === 0) return { flag: false, sr: 0, medianViews: 0, maxViews: 0 }

  const viewDeltas = deltas.map(d => d.dViews)
  const med = median(viewDeltas)
  const maxV = Math.max(...viewDeltas)

  let flag = false
  let sr = 0

  if (med > 0) {
    sr = maxV / med
    flag = sr > threshold
  } else {
    // median == 0: flag if any spike exists
    flag = maxV > 0
    sr = maxV > 0 ? Infinity : 0
  }

  return { flag, sr: isFinite(sr) ? sr : 999, medianViews: med, maxViews: maxV }
}

// ─── Flag 2: Decoupling ───────────────────────────────────────
export function checkDecoupling(
  deltas: Delta[],
  p95 = SCORING_CONFIG.P95_PERCENTILE,
  threshold = SCORING_CONFIG.DECOUPLING_THRESHOLD
): { flag: boolean; baseline_lr: number; baseline_cr: number; p95_views: number } {
  if (deltas.length === 0) {
    return { flag: false, baseline_lr: 0, baseline_cr: 0, p95_views: 0 }
  }

  const totalViews    = deltas.reduce((s, d) => s + d.dViews, 0)
  const totalLikes    = deltas.reduce((s, d) => s + d.dLikes, 0)
  const totalComments = deltas.reduce((s, d) => s + d.dComments, 0)

  const baseline_lr = totalViews > 0 ? totalLikes    / totalViews : 0
  const baseline_cr = totalViews > 0 ? totalComments / totalViews : 0

  const sortedViews = [...deltas.map(d => d.dViews)].sort((a, b) => a - b)
  const p95_views   = percentile(sortedViews, p95)

  const highViewDeltas = deltas.filter(d => d.dViews >= p95_views && d.dViews > 0)

  let flag = false

  for (const d of highViewDeltas) {
    const lr_i = d.dLikes    / Math.max(d.dViews, 1)
    const cr_i = d.dComments / Math.max(d.dViews, 1)

    if (baseline_lr > 0 || baseline_cr > 0) {
      if (
        lr_i < threshold * baseline_lr &&
        cr_i < threshold * baseline_cr
      ) {
        flag = true
        break
      }
    } else {
      // baseline rates == 0: flag if large view spike with zero engagement
      if (d.dViews > 0 && d.dLikes + d.dComments === 0) {
        flag = true
        break
      }
    }
  }

  return { flag, baseline_lr, baseline_cr, p95_views }
}

// ─── Flag 3: Rate Jump ────────────────────────────────────────
export function checkRateJump(
  snapshots: Snapshot[],
  jumpFactor = SCORING_CONFIG.RATE_JUMP_FACTOR,
  dropFactor = SCORING_CONFIG.RATE_JUMP_DROP
): { flag: boolean; details: string } {
  if (snapshots.length < 3) return { flag: false, details: 'not enough snapshots' }

  type Rates = { lr: number; cr: number; shr: number }

  // Cumulative rates per snapshot
  const rates: Rates[] = snapshots.map(s => ({
    lr:  s.view_count > 0 ? s.like_count    / s.view_count : 0,
    cr:  s.view_count > 0 ? s.comment_count / s.view_count : 0,
    shr: s.view_count > 0 ? s.share_count   / s.view_count : 0,
  }))

  for (let t = 1; t < rates.length - 1; t++) {
    const prev = rates[t - 1]
    const curr = rates[t]
    const next = rates[t + 1]

    for (const key of ['lr', 'cr', 'shr'] as const) {
      const prevVal = prev[key]
      const currVal = curr[key]
      const nextVal = next[key]

      if (prevVal > 0 && currVal > jumpFactor * prevVal) {
        // Jumped — check if it drops back next snapshot
        if (nextVal < currVal * (1 - dropFactor)) {
          return {
            flag: true,
            details: `${key} jumped ${(currVal / prevVal).toFixed(1)}x at t=${t}, dropped ${((1 - nextVal / currVal) * 100).toFixed(0)}%`,
          }
        }
      }
    }
  }

  return { flag: false, details: 'no rate jumps detected' }
}

// ─── Penalty ──────────────────────────────────────────────────
export function computePenalty(flagCount: number): number {
  if (flagCount <= 1) return 0
  if (flagCount === 2) return -1
  if (flagCount === 3) return -2
  return -3  // >= 4
}

// ─── Main: compute_scores ─────────────────────────────────────
export function computeScore(
  snapshots: Snapshot[],
  n = SCORING_CONFIG.SNAPSHOT_N,
  cfg = SCORING_CONFIG
): ScoreResult {
  if (snapshots.length === 0) {
    return {
      base_score: 0, final_score: 0, penalty: 0, flag_count: 0,
      under_review: false,
      flags: { spike_ratio: false, decoupling: false, rate_jump: false },
      details: { reason: 'no_snapshots' },
    }
  }

  // Use most recent N snapshots, ordered oldest→newest
  const window = [...snapshots]
    .sort((a, b) => new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime())
    .slice(-n)

  const latest = window[window.length - 1]

  // BaseScore from latest cumulative counts
  const { base_score, components } = computeBaseScore(
    latest.view_count,
    latest.like_count,
    latest.comment_count,
    latest.share_count,
    cfg
  )

  // If below MIN_VIEWS → everything is 0
  if (latest.view_count < cfg.MIN_VIEWS) {
    return {
      base_score: 0, final_score: 0, penalty: 0, flag_count: 0,
      under_review: false,
      flags: { spike_ratio: false, decoupling: false, rate_jump: false },
      details: { reason: 'below_min_views', views: latest.view_count, components },
    }
  }

  const deltas = computeDeltas(window)

  const spikeResult      = checkSpikeRatio(deltas)
  const decouplingResult = checkDecoupling(deltas)
  const rateJumpResult   = checkRateJump(window)

  const flags = {
    spike_ratio: spikeResult.flag,
    decoupling:  decouplingResult.flag,
    rate_jump:   rateJumpResult.flag,
  }

  const flag_count = Object.values(flags).filter(Boolean).length
  const penalty    = computePenalty(flag_count)
  const final_score = Math.round(clamp(base_score + penalty, 0, 10) * 10000) / 10000
  const under_review = penalty <= -2

  return {
    base_score,
    final_score,
    penalty,
    flag_count,
    under_review,
    flags,
    details: {
      components,
      snapshots_used: window.length,
      latest_views: latest.view_count,
      spike: { sr: spikeResult.sr, median: spikeResult.medianViews, max: spikeResult.maxViews },
      decoupling: { baseline_lr: decouplingResult.baseline_lr, baseline_cr: decouplingResult.baseline_cr, p95: decouplingResult.p95_views },
      rate_jump: rateJumpResult.details,
    },
  }
}
