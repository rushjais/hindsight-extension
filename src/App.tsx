import { useCallback, useEffect, useState } from 'react';
import type { AdviceResult, Profile } from '@hindsight/types';
import { cn } from '@/lib/utils';
import { ProfileView, type ProfileViewData } from '@/components/ProfileView';
import { AdviceView } from '@/components/AdviceView';
import {
  DEMO_QUESTION,
  getAdvice,
  getProfile,
  prefetch,
} from '@/lib/skillsClient';

type View = 'profile' | 'advice';

export default function App() {
  const [view, setView] = useState<View>('profile');
  const [profile, setProfile] = useState<ProfileViewData | null>(null);
  const [advice, setAdvice] = useState<AdviceResult | null>(null);
  const [online, setOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    const { profileLive, adviceLive } = await prefetch();
    const p = await getProfile([]);
    const a = await getAdvice(
      DEMO_QUESTION,
      p.data.profile as unknown as Profile,
    );
    setProfile(p.data as unknown as ProfileViewData);
    setAdvice(a.data);
    setOnline(profileLive && adviceLive);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { profileLive, adviceLive } = await prefetch();
      if (cancelled) return;
      const p = await getProfile([]);
      if (cancelled) return;
      const a = await getAdvice(
        DEMO_QUESTION,
        p.data.profile as unknown as Profile,
      );
      if (cancelled) return;
      setProfile(p.data as unknown as ProfileViewData);
      setAdvice(a.data);
      setOnline(profileLive && adviceLive);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto flex h-full w-[380px] max-w-[380px] flex-col border-x border-border bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-md tracking-tight">Hindsight</h1>
          <span
            aria-label={
              online ? 'Connected to skills server' : 'Using cached fixtures'
            }
            title={online ? 'Live' : 'Fixtures'}
            className={cn(
              'size-1.5 rounded-full',
              online ? 'bg-[#16A34A]' : 'bg-text-muted',
            )}
          />
          <button
            type="button"
            onClick={load}
            disabled={refreshing}
            aria-label="Refresh"
            title="Refresh"
            className={cn(
              'leading-none text-text-secondary transition-colors duration-fast hover:text-foreground',
              refreshing && 'animate-spin',
            )}
            style={{ fontSize: '12px' }}
          >
            ↺
          </button>
        </div>
        <nav className="flex gap-1" role="tablist">
          {(['profile', 'advice'] as const).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={cn(
                'rounded-sm px-2 py-1 text-xs tracking-wide transition-colors duration-fast',
                view === v
                  ? 'text-foreground'
                  : 'text-text-muted hover:text-foreground',
              )}
            >
              {v}
            </button>
          ))}
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto">
        {view === 'profile' ? (
          profile ? (
            <ProfileView data={profile} />
          ) : (
            <LoadingState />
          )
        ) : advice ? (
          <AdviceView data={advice} />
        ) : (
          <LoadingState />
        )}
      </main>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex h-full items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center gap-2 text-text-muted">
        <span
          aria-hidden
          className="inline-block size-3 animate-spin rounded-full border-2 border-border border-t-primary"
        />
        <span className="text-[11px] uppercase tracking-[0.08em]">
          Loading…
        </span>
      </div>
    </div>
  );
}
