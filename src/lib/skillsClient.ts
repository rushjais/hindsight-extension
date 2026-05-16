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
  'Should YC double down on Bay Area founders or expand globally?';

export type ProfileResponse = typeof profileFixture;

export type FetchResult<T> = { data: T; live: boolean };

let profileCache: ProfileResponse | null = null;
let adviceCache: AdviceResult | null = null;

async function postJSON<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchProfile(
  resolvedTakes: Take[],
): Promise<ProfileResponse | null> {
  return postJSON<ProfileResponse>('/skills/hindsight-profile', {
    resolved_takes: resolvedTakes,
  });
}

async function fetchAdvice(
  question: string,
  profile: Profile,
  forcePattern?: string,
): Promise<AdviceResult | null> {
  return postJSON<AdviceResult>('/skills/calibrated-advise', {
    question,
    profile,
    force_pattern: forcePattern,
  });
}

export async function getProfile(
  resolvedTakes: Take[],
): Promise<FetchResult<ProfileResponse>> {
  if (forceFixtureOnly()) return { data: fixtureForState(), live: false };
  if (profileCache) return { data: profileCache, live: true };
  const fresh = await fetchProfile(resolvedTakes);
  if (fresh) {
    profileCache = fresh;
    return { data: fresh, live: true };
  }
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
