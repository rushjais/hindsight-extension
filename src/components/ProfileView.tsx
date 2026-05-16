import type {
  ContradictionPair,
  OutcomeVerdict,
  Profile,
  TakeDomain,
} from '@hindsight/types';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type HighlightTakeView = {
  take_id: string;
  claim_text: string;
  claim_date: string;
  domain: TakeDomain;
  verdict_summary: string;
  verdict: OutcomeVerdict;
};

export type ProfileViewData = {
  profile: Omit<Profile, 'highlight_takes'> & {
    highlight_takes: HighlightTakeView[];
  };
  contradictions: ContradictionPair[];
};

type VerdictStyle = { text: string; bg: string; fg: string };

function verdictStyle(v: OutcomeVerdict): VerdictStyle {
  switch (v) {
    case 'correct':
      return { text: 'Correct', bg: '#E6F4EA', fg: '#1A7F37' };
    case 'partially correct':
      return { text: 'Partial', bg: '#FEF7CD', fg: '#854D0E' };
    case 'incorrect':
      return { text: 'Wrong', bg: '#FCE8E6', fg: '#C5221F' };
    case 'unresolvable':
      return { text: 'Open', bg: '#F4F3F1', fg: '#5E5E5E' };
  }
}

const CALIBRATION_DATA = [
  { name: 'Low Conv.', full: 'Low conviction', yours: 45, bench: 50, n: 8 },
  {
    name: 'Medium Conv.',
    full: 'Medium conviction',
    yours: 68,
    bench: 60,
    n: 13,
  },
  { name: 'High Conv.', full: 'High conviction', yours: 82, bench: 65, n: 17 },
];

type CalibrationDatum = (typeof CALIBRATION_DATA)[number];

function CalibrationTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: CalibrationDatum }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-[3px] border border-border bg-card px-2.5 py-2 text-[11px] leading-[1.4] shadow-sm">
      <div className="font-semibold text-foreground">
        {d.full}:{' '}
        <span className="font-mono tabular-nums" style={{ color: '#D97757' }}>
          {d.yours}%
        </span>{' '}
        accurate
      </div>
      <div className="mt-0.5 font-mono tabular-nums text-text-muted">
        n={d.n} takes · peers {d.bench}%
      </div>
    </div>
  );
}

export function ProfileView({ data }: { data: ProfileViewData }) {
  const profile = data.profile ?? {
    user: '',
    corpus_size: 0,
    total_takes: 0,
    resolved_takes: 0,
    overall_hit_rate: 0,
    by_domain: [],
    patterns: [],
    highlight_takes: [],
  };
  const contradictions = data.contradictions ?? [];
  const by_domain = profile.by_domain ?? [];
  const highlight_takes = profile.highlight_takes ?? [];
  const hasResolved = profile.resolved_takes > 0;
  const pctText = hasResolved
    ? (profile.overall_hit_rate * 100).toFixed(1)
    : '—';

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* HERO METRIC CARD */}
      <section className="border border-border bg-card p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
          Calibration Accuracy
        </div>
        <div className="mt-2 flex items-baseline gap-2.5">
          <h1
            className="font-sans tabular-nums text-foreground"
            style={{
              fontSize: '44px',
              lineHeight: '1',
              fontWeight: 700,
              letterSpacing: '-0.025em',
            }}
          >
            {pctText}
            {hasResolved ? (
              <span
                className="text-foreground"
                style={{ fontSize: '28px', fontWeight: 600 }}
              >
                %
              </span>
            ) : null}
          </h1>
          {hasResolved ? <TrendBadge delta="+2.4%" /> : null}
        </div>
        <p className="mt-1 text-[12px] font-medium text-foreground">
          Relatively calibrated vs. peers
        </p>
        <p className="mt-1 text-[12px] leading-[1.4] text-text-muted">
          {profile.total_takes === 0
            ? 'No takes logged yet. Start writing to build your calibration profile.'
            : `${profile.resolved_takes} of ${profile.total_takes} takes resolved`}
        </p>
      </section>

      {/* DOMAIN PERFORMANCE */}
      <section className="border border-border bg-card p-4">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
          Domain Performance
        </h2>
        {by_domain.length === 0 ? (
          <EmptyHint>
            {profile.total_takes === 0
              ? 'Start logging takes to see your domain breakdown.'
              : 'Resolve some takes to see your domain breakdown.'}
          </EmptyHint>
        ) : null}
        <div className="space-y-3">
          {by_domain.map((d) => {
            const pct = Math.round(d.hit_rate * 100);
            return (
              <div key={d.domain}>
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-[13px] font-medium text-foreground">
                    {d.domain}
                  </span>
                  <span className="flex items-baseline gap-2 text-text-muted">
                    <span className="font-mono text-[11px] tabular-nums">
                      n={d.n}
                    </span>
                    <span className="font-mono text-[13px] font-medium tabular-nums text-foreground">
                      {pct}%
                    </span>
                  </span>
                </div>
                <div className="h-[4px] w-full bg-surface-sunken">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CALIBRATION CURVE */}
      <section className="border border-border bg-card p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
            Calibration Curve
          </h2>
          <div className="flex items-center gap-3 text-[10px] text-text-secondary">
            <LegendSwatch color="#D97757" label="You" />
            <LegendSwatch color="#E5E3DE" label="Peers" />
          </div>
        </div>
        <div style={{ width: '100%', height: 160 }}>
          <ResponsiveContainer>
            <BarChart
              data={CALIBRATION_DATA}
              margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
              barCategoryGap="22%"
              barGap={2}
            >
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#6B6B6B' }}
                tickLine={false}
                axisLine={{ stroke: '#E5E3DE' }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9B9B9B' }}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
                ticks={[0, 50, 100]}
              />
              <Tooltip
                cursor={{ fill: '#F4F2EC' }}
                content={<CalibrationTooltip />}
              />
              <Bar dataKey="yours" fill="#D97757" radius={[2, 2, 0, 0]} />
              <Bar dataKey="bench" fill="#E5E3DE" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* RECENT VERDICTS — compact feed */}
      <section>
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
          Recent Verdicts
        </h2>
        {highlight_takes.length === 0 ? (
          <EmptyHint>Verdicts appear once outcomes resolve.</EmptyHint>
        ) : null}
        <div className="divide-y divide-border border-y border-border">
          {highlight_takes.map((t) => (
            <div
              key={t.take_id}
              className="flex items-start gap-2.5 py-2.5"
            >
              <VerdictBadge verdict={t.verdict} />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] uppercase tabular-nums text-text-muted">
                  {t.claim_date} · {t.domain}
                </div>
                <p className="mt-0.5 text-[13px] leading-[1.4] text-foreground">
                  {t.claim_text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PERSPECTIVE SHIFT (self-contradictions) */}
      <section>
        <h2
          className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: '#D97757' }}
        >
          <ShiftIcon />
          Perspective Shift
        </h2>
        {contradictions.length === 0 ? (
          <EmptyHint>
            No contradictions surfaced yet. They appear as your corpus grows.
          </EmptyHint>
        ) : null}
        <div className="space-y-3">
          {contradictions.map((c) => (
            <div
              key={c.topic}
              className="p-4"
              style={{
                backgroundColor: '#FEF3E2',
                border: '1px solid #D97757',
              }}
            >
              <div className="mb-3 text-[13px] font-semibold text-foreground">
                {c.topic}
              </div>

              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                {c.claim_a.date.slice(0, 4)} · Original
              </div>
              <p className="mt-1 text-[13px] italic leading-[1.45] text-text-secondary">
                "{c.claim_a.text}"
              </p>

              <ShiftDivider />

              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                {c.claim_b.date.slice(0, 4)} · Revised
              </div>
              <p className="mt-1 text-[13px] font-semibold leading-[1.45] text-foreground">
                "{c.claim_b.text}"
              </p>

              <p
                className="mt-3 border-t pt-3 text-[12px] leading-[1.5] text-text-secondary"
                style={{ borderColor: 'rgba(217, 119, 87, 0.2)' }}
              >
                {c.contradiction_summary}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TrendBadge({ delta }: { delta: string }) {
  return (
    <span
      className="flex items-baseline gap-0.5 text-[12px] font-semibold tabular-nums"
      style={{ color: '#1A7F37' }}
      title="vs. last 30 days"
    >
      <UpArrowIcon />
      {delta}
      <span className="ml-1 text-[10px] font-normal text-text-muted">
        vs last 30 days
      </span>
    </span>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span
        aria-hidden
        className="inline-block size-2 rounded-[1px]"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function ShiftDivider() {
  return (
    <div className="my-3 flex items-center gap-2" aria-hidden>
      <span
        className="h-px flex-1"
        style={{ backgroundColor: 'rgba(217, 119, 87, 0.3)' }}
      />
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#D97757"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </svg>
      <span
        className="h-px flex-1"
        style={{ backgroundColor: 'rgba(217, 119, 87, 0.3)' }}
      />
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: OutcomeVerdict }) {
  const { text, bg, fg } = verdictStyle(verdict);
  return (
    <span
      className="shrink-0 rounded-sm px-1.5 py-[2px] text-[10px] font-bold uppercase tracking-[0.06em]"
      style={{ backgroundColor: bg, color: fg }}
    >
      {text}
    </span>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[12px] leading-[1.5] text-text-muted">{children}</p>
  );
}

function UpArrowIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  );
}

function ShiftIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}
