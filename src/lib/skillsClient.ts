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

function fixtureForState(): typeof profileFixture {
  if (typeof window === 'undefined') return profileFixture;
  const state = new URLSearchParams(window.location.search).get('state');
  if (state === 'empty') return profileEmptyFixture as typeof profileFixture;
  if (state === 'partial')
    return profilePartialFixture as typeof profileFixture;
  return profileFixture;
}

function forceFixtureOnly(): boolean {
  if (typeof window === 'undefined') return false;
  const state = new URLSearchParams(window.location.search).get('state');
  return state === 'empty' || state === 'partial' || state === 'error';
}

const BASE_URL = 'http://localhost:3001';

export const DEMO_QUESTION =
  'Should YC double down on Bay Area founders or expand to global remote founders?';

export type ProfileResponse = typeof profileFixture;

export type FetchResult<T> = { data: T; live: boolean };

let profileCache: ProfileResponse | null = null;
let adviceCache: AdviceResult | null = null;

const FETCH_TIMEOUT_MS = 3000;

async function postJSON<T>(path: string, body: unknown): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
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
    (r.contradictions as ProfileResponse['contradictions'] | undefined) ??
    profileFixture.contradictions;
  return { profile, contradictions };
}

// Server returns `CalibratedAdviseOutput { advice: AdviceResult }`. We unwrap.
async function fetchAdvice(
  question: string,
  profile: Profile,
  forcePattern?: string,
): Promise<AdviceResult | null> {
  const raw = await postJSON<unknown>('/skills/calibrated-advise', {
    question,
    profile,
    force_pattern: forcePattern,
  });
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const advice =
    (r.advice as AdviceResult | undefined) ??
    (r as unknown as AdviceResult);
  if (!advice || typeof advice !== 'object' || !('question' in advice)) {
    console.warn('[skillsClient] advice response missing required fields', raw);
    return null;
  }
  return advice;
}

function looksLikeProfile(r: Record<string, unknown>): boolean {
  return 'overall_hit_rate' in r && 'by_domain' in r;
}

export async function getProfile(
  resolvedTakes: Take[],
): Promise<FetchResult<ProfileResponse>> {
  if (forceFixtureOnly()) {
    console.log('[skillsClient] getProfile → forced fixture');
    return { data: fixtureForState(), live: false };
  }
  if (profileCache) {
    console.log('[skillsClient] getProfile → cache hit');
    return { data: profileCache, live: true };
  }
  const fresh = await fetchProfile(resolvedTakes);
  if (fresh) {
    profileCache = fresh;
    console.log('[skillsClient] getProfile → live', fresh);
    return { data: fresh, live: true };
  }
  console.log('[skillsClient] getProfile → fixture fallback');
  return { data: fixtureForState(), live: false };
}

export async function getAdvice(
  question: string,
  profile: Profile,
  forcePattern?: string,
): Promise<FetchResult<AdviceResult>> {
  if (forceFixtureOnly())
    return { data: adviceFixture as AdviceResult, live: false };
  if (adviceCache) return { data: adviceCache, live: true };
  const fresh = await fetchAdvice(question, profile, forcePattern);
  if (fresh) {
    adviceCache = fresh;
    return { data: fresh, live: true };
  }
  return { data: adviceFixture as AdviceResult, live: false };
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
  adviceLive: boolean;
};

export async function prefetch(): Promise<PrefetchResult> {
  if (forceFixtureOnly()) return { profileLive: false, adviceLive: false };
  const profile = await fetchProfile([]);
  if (profile) profileCache = profile;
  const profileForAdvice = (profile ?? profileFixture)
    .profile as unknown as Profile;
  const advice = await fetchAdvice(DEMO_QUESTION, profileForAdvice);
  if (advice) adviceCache = advice;
  return { profileLive: !!profile, adviceLive: !!advice };
}
