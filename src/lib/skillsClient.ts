import type {
  AdviceResult,
  ContradictionPair,
  Outcome,
  Profile,
  Take,
} from '@hindsight/types';
import profileFixture from '@/fixtures/profile.json';
import profileEmptyFixture from '@/fixtures/profile-empty.json';
import profilePartialFixture from '@/fixtures/profile-partial.json';
import adviceFixture from '@/fixtures/advice.json';

// profile.json is now FLAT (the Profile object itself, no wrapping).
// empty/partial fixtures are still wrapped {profile, contradictions}.
// ProfileResponse is what the ProfileView consumes — always wrapped.
const wrappedProfileFixture: ProfileResponse = {
  profile: profileFixture as unknown as ProfileResponse['profile'],
  contradictions: [
    {
      topic: 'What VCs are like',
      claim_a: {
        text: 'VCs are arrogant and sneaky',
        source_page: 'essays/vc-arrogant.md',
        date: '2005-03-01',
      },
      claim_b: {
        text: 'VCs are actually more upstanding than I thought, just timid',
        source_page: 'essays/vc-upstanding.md',
        date: '2008-11-01',
      },
      contradiction_summary:
        'In 2005 he called VCs arrogant and sneaky; in 2008 he conceded they were actually more upstanding than he thought — just timid.',
    },
  ],
};

function fixtureForState(): ProfileResponse {
  if (typeof window === 'undefined') return wrappedProfileFixture;
  const state = new URLSearchParams(window.location.search).get('state');
  if (state === 'empty') return profileEmptyFixture as unknown as ProfileResponse;
  if (state === 'partial')
    return profilePartialFixture as unknown as ProfileResponse;
  return wrappedProfileFixture;
}

function forceFixtureOnly(): boolean {
  if (typeof window === 'undefined') return false;
  const state = new URLSearchParams(window.location.search).get('state');
  return state === 'empty' || state === 'partial' || state === 'error';
}

const BASE_URL = 'http://localhost:3001';

// The shape ProfileView consumes: wrapped Profile + contradictions list.
// The on-disk profile.json is now flat; we wrap it in `wrappedProfileFixture`
// before handing it to consumers.
export type AbandonedThreadEvidence = {
  event: string;
  year: number;
  validated: boolean;
};

export type AbandonedThread = {
  thread_title: string;
  source_essay: string;
  source_date: string;
  original_quote: string;
  market_evidence: AbandonedThreadEvidence[];
  why_resurface: string;
};

export type ProfileResponse = {
  profile: typeof profileFixture;
  contradictions: ContradictionPair[];
  abandoned_threads?: AbandonedThread[];
};

export type FetchResult<T> = { data: T; live: boolean };

let profileCache: ProfileResponse | null = null;

// Captured fixtures from hindsight-skills, when present. Loaded by
// loadCapturedFixtures() on mount. These take precedence over the baked-in
// src/fixtures/ files in the fallback path.
let capturedProfile: ProfileResponse | null = null;
let capturedAdvice: AdviceResult | null = null;

/**
 * Loads `src/fixtures/captured/{profile,advice}.json` if present and stores
 * them as the primary fixture source. Symlink that directory to
 * `~/hindsight-skills/data/captured/` so Rayan's commits flow in on rebuild.
 * Returns which files were found so callers can log / decide.
 *
 * Files must exist at build time — Vite resolves the glob then. The captured
 * directory not existing is OK: glob returns empty, function is a no-op.
 */
export async function loadCapturedFixtures(): Promise<{
  profileLoaded: boolean;
  adviceLoaded: boolean;
}> {
  const profileMatches = import.meta.glob(
    '/src/fixtures/captured/profile.json',
    { eager: true },
  ) as Record<string, { default: unknown }>;
  const adviceMatches = import.meta.glob(
    '/src/fixtures/captured/advice.json',
    { eager: true },
  ) as Record<string, { default: AdviceResult }>;
  const contradictionMatches = import.meta.glob(
    '/src/fixtures/contradiction-fallback.json',
    { eager: true },
  ) as Record<string, { default: unknown }>;
  const abandonedMatches = import.meta.glob(
    '/src/fixtures/abandoned-threads.json',
    { eager: true },
  ) as Record<string, { default: unknown }>;

  const rawProfile = Object.values(profileMatches)[0]?.default ?? null;
  const a = Object.values(adviceMatches)[0]?.default ?? null;
  const rawContradiction =
    Object.values(contradictionMatches)[0]?.default ?? null;

  const rawAbandoned = Object.values(abandonedMatches)[0]?.default ?? null;
  let abandonedThreads: AbandonedThread[] | null = null;
  if (Array.isArray(rawAbandoned)) {
    abandonedThreads = rawAbandoned as AbandonedThread[];
    console.log(
      '[skillsClient] abandoned threads loaded',
      abandonedThreads.length,
    );
  }

  // The fallback file is a single ContradictionPair. Strip any `_meta` and
  // wrap as a one-element array so the view's contradictions list renders it.
  let contradictionFallback: ContradictionPair[] | null = null;
  if (rawContradiction && typeof rawContradiction === 'object') {
    const { _meta, ...rest } = rawContradiction as Record<string, unknown> & {
      _meta?: unknown;
    };
    void _meta;
    contradictionFallback = [rest as unknown as ContradictionPair];
    console.log(
      '[DEMO_MODE] contradictions from fallback',
      contradictionFallback,
    );
  }

  // Captured profile may be flat (Profile) or wrapped ({profile, contradictions}).
  // Normalize to the wrapped ProfileResponse shape the view consumes.
  if (rawProfile && typeof rawProfile === 'object') {
    const r = rawProfile as Record<string, unknown>;
    const innerProfile =
      (r.profile as ProfileResponse['profile'] | undefined) ??
      (r as unknown as ProfileResponse['profile']);
    // Resolution: profile's own contradictions > curated fallback file > synthetic PG/VC.
    const innerContradictions =
      (r.contradictions as ProfileResponse['contradictions'] | undefined) ??
      contradictionFallback ??
      wrappedProfileFixture.contradictions;
    capturedProfile = {
      profile: innerProfile,
      contradictions: innerContradictions,
      abandoned_threads: abandonedThreads ?? undefined,
    };
    console.log('[skillsClient] captured profile loaded ✓');
  } else {
    capturedProfile = null;
    console.log('[skillsClient] captured profile not present');
  }

  // If the contradiction fallback loaded but there's no captured profile,
  // splice it into the baked-in wrappedProfileFixture so the default fallback
  // path also gets the curated contradiction (replaces the synthetic PG/VC).
  if (contradictionFallback && !capturedProfile) {
    wrappedProfileFixture.contradictions = contradictionFallback;
  }
  if (abandonedThreads && !capturedProfile) {
    wrappedProfileFixture.abandoned_threads = abandonedThreads;
  }

  capturedAdvice = a;
  if (a) console.log('[skillsClient] captured advice loaded ✓');
  else console.log('[skillsClient] captured advice not present');

  return { profileLoaded: !!capturedProfile, adviceLoaded: !!a };
}

const FETCH_TIMEOUT_MS = 3000;

async function postJSON<T>(
  path: string,
  body: unknown,
  timeoutMs: number = FETCH_TIMEOUT_MS,
): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  console.log('[skillsClient] fetch start →', path);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as T;
    console.log('[skillsClient] fetch ok ←', path, json);
    return json;
  } catch (err) {
    console.warn('[skillsClient] fetch failed ✗', path, err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Server returns the typed envelope `HindsightProfileOutput { profile: Profile }`,
// but the view also needs `contradictions[]`. We unwrap the envelope and merge
// contradictions from the fixture until the server exposes them via
// /skills/find-contradictions on the demo path.
async function fetchProfile(
  resolvedTakes: Take[],
): Promise<ProfileResponse | null> {
  const raw = await postJSON<unknown>('/skills/hindsight-profile', {
    resolved_takes: resolvedTakes,
  });
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const profile =
    (r.profile as ProfileResponse['profile'] | undefined) ??
    (looksLikeProfile(r)
      ? (r as unknown as ProfileResponse['profile'])
      : undefined);
  if (!profile) {
    console.warn('[skillsClient] profile response missing .profile', raw);
    return null;
  }
  const contradictions =
    (r.contradictions as ProfileResponse['contradictions'] | undefined) ?? [];
  return { profile, contradictions };
}

// Server returns `CalibratedAdviseOutput { advice: AdviceResult }`. We unwrap
// the envelope and only accept the live response if it carries a usable
// synthesized_take (non-empty string). Anything else → fixture fallback.
//
// calibrated-advise can take 30-60s end-to-end (Claude generation +
// ZeroEntropy rerank + Hog signal merge), so we override the default
// 3s timeout to 60s for this single endpoint.
const ADVICE_TIMEOUT_MS = 60_000;

async function fetchAdvice(
  question: string,
  profile: Profile,
  forcePattern?: string,
): Promise<AdviceResult | null> {
  console.log('[advice] POST start');
  const start =
    typeof performance !== 'undefined' ? performance.now() : Date.now();
  const raw = await postJSON<unknown>(
    '/skills/calibrated-advise',
    {
      question,
      profile,
      force_pattern: forcePattern,
    },
    ADVICE_TIMEOUT_MS,
  );
  const elapsed = Math.round(
    (typeof performance !== 'undefined' ? performance.now() : Date.now()) -
      start,
  );
  console.log(`[advice] POST returned in ${elapsed}ms`);

  if (!raw || typeof raw !== 'object') {
    console.warn('[advice] response was null or non-object');
    return null;
  }
  const r = raw as Record<string, unknown>;
  const advice =
    (r.advice as AdviceResult | undefined) ??
    (r as unknown as AdviceResult);
  if (!advice || typeof advice !== 'object') {
    console.warn('[advice] response not an object', raw);
    return null;
  }
  const take = (advice as Partial<AdviceResult>).synthesized_take;
  if (typeof take !== 'string' || take.trim().length === 0) {
    console.warn('[advice] response missing synthesized_take', advice);
    return null;
  }
  console.log('[advice] live ✓ synthesized_take present');
  return advice;
}

function looksLikeProfile(r: Record<string, unknown>): boolean {
  return 'overall_hit_rate' in r && 'by_domain' in r;
}

// A profile is "useful" only if it has resolved takes and non-empty
// domain breakdown. The live server returns a structurally-valid but
// empty profile when called with resolved_takes: [], which would render
// as the "No takes logged yet" empty state — useless for the demo.
function profileIsUseful(p: ProfileResponse | null): boolean {
  if (!p) return false;
  const inner = (p as { profile?: { resolved_takes?: number; by_domain?: unknown[] } }).profile;
  if (!inner) return false;
  return (inner.resolved_takes ?? 0) > 0 && (inner.by_domain?.length ?? 0) > 0;
}

export async function getProfile(
  resolvedTakes: Take[],
): Promise<FetchResult<ProfileResponse>> {
  if (forceFixtureOnly()) {
    console.log('[skillsClient] getProfile → forced fixture');
    return { data: fixtureForState(), live: false };
  }
  // Captured fixtures (data/captured/profile.json via symlink) are the
  // locked demo content — primary source when present and non-empty.
  if (profileIsUseful(capturedProfile)) {
    console.log('[skillsClient] getProfile → captured (primary)');
    return { data: capturedProfile as ProfileResponse, live: false };
  }
  if (profileIsUseful(profileCache)) {
    console.log('[skillsClient] getProfile → cache hit');
    return { data: profileCache as ProfileResponse, live: true };
  }
  const fresh = await fetchProfile(resolvedTakes);
  if (profileIsUseful(fresh)) {
    profileCache = fresh;
    console.log('[skillsClient] getProfile → live', fresh);
    return { data: fresh as ProfileResponse, live: true };
  }
  // Live returned empty or failed — bundled wrappedProfileFixture has
  // the real captured stats (228 essays, 181 takes, 15 resolved, 67% hit
  // rate, full by_domain breakdown).
  console.log('[skillsClient] getProfile → bundled fixture (live was empty)');
  return { data: fixtureForState(), live: false };
}

/**
 * Live advice call. Empty question short-circuits to null — no fixture,
 * no live call — because the UI requires the user to ask something first.
 *
 * The `takes` param is forward-looking: when supplied, the right behavior
 * is to compute a fresh Profile via /skills/hindsight-profile first, then
 * call advice. Not implemented yet — for the demo we use the captured /
 * baked-in profile internally. Drop a TODO here when wiring that.
 */
export async function getAdvice(
  question: string,
  _takes?: Take[],
): Promise<FetchResult<AdviceResult> | null> {
  if (!question.trim()) return null;
  void _takes;
  if (forceFixtureOnly())
    return { data: adviceFixture as AdviceResult, live: false };
  const profileForAdvice = (capturedProfile?.profile ??
    (profileFixture as unknown as Profile)) as Profile;
  const fresh = await fetchAdvice(question, profileForAdvice);
  if (fresh) {
    return { data: fresh, live: true };
  }
  if (capturedAdvice) {
    console.log(
      '[advice] using captured fallback because: live fetchAdvice returned null (timeout, network error, or invalid response)',
    );
    return { data: capturedAdvice, live: false };
  }
  console.log(
    '[advice] using captured fallback because: no captured loaded — falling through to baked-in fixture',
  );
  return { data: adviceFixture as AdviceResult, live: false };
}

/** Read the captured demo advice synchronously — used by the manual
 * "Load captured demo answer" fallback button in AdviceView. Returns null
 * until loadCapturedFixtures() has run. */
export function getCapturedAdvice(): AdviceResult | null {
  return capturedAdvice;
}

export async function extractTakes(
  brainPage: string,
): Promise<{ takes: Take[] } | null> {
  return postJSON<{ takes: Take[] }>('/skills/extract-takes', {
    brain_page: brainPage,
  });
}

export async function resolveOutcomes(
  take: Take,
): Promise<{ outcome: Outcome | null } | null> {
  return postJSON<{ outcome: Outcome | null }>('/skills/resolve-outcomes', {
    take,
  });
}

export async function findContradictions(
  takes: Take[],
): Promise<{ contradictions: ContradictionPair[] } | null> {
  return postJSON<{ contradictions: ContradictionPair[] }>(
    '/skills/find-contradictions',
    { takes },
  );
}

export type PrefetchResult = {
  profileLive: boolean;
};

/**
 * Mount-time warmup. Only fetches the profile now — advice is request-driven
 * (the user types a question in AdviceView, which calls getAdvice on submit).
 */
export async function prefetch(): Promise<PrefetchResult> {
  if (forceFixtureOnly()) return { profileLive: false };
  // Skip live profile fetch when captured fixture is the demo's source of truth.
  const profile = capturedProfile ? null : await fetchProfile([]);
  if (profile) profileCache = profile;
  return { profileLive: !!profile };
}
