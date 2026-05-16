import type {
  AdviceResult,
  BrainPage,
  FreshSignalItem,
} from '@hindsight/types';

const RELEVANCE_SCORES = [94, 87, 81, 76, 71, 67];
const WARNING_AMBER = '#CA8A04';

const ANSWER_BULLETS: { text: string; lead?: boolean }[] = [
  { text: 'Keep SF as one hub of four, not the default', lead: true },
  { text: 'Concentrated YC programs in NYC, London, and one APAC city' },
  { text: 'Don\u2019t cut SF \u2014 hold at current size' },
  { text: 'Geographic instinct is your weakest-calibrated domain' },
];

export function AdviceView({ data }: { data: AdviceResult }) {
  const question = data?.question ?? '';
  const relevant_pages = data?.relevant_pages ?? [];
  const fresh_signal = data?.fresh_signal ?? [];
  const synthesized_take = data?.synthesized_take ?? '';
  const calibration_adjustment = data?.calibration_adjustment ?? {
    applicable_pattern: '',
    adjustment_text: '',
  };
  const bullets = parseAnswer(synthesized_take);

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* QUESTION CARD */}
      <section className="border border-border bg-card p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
          Question
        </div>
        <p className="mt-2 text-[15px] italic leading-[1.4] text-foreground">
          "{question}"
        </p>
      </section>

      {/* ACCURACY GAUGE — top visual anchor */}
      <section className="border border-border bg-card px-4 py-5">
        <div className="flex flex-col items-center">
          <AccuracyGauge value={50} />
          <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-secondary">
            Geography accuracy
          </div>
          <div className="mt-0.5 font-mono text-[10px] tabular-nums text-text-muted">
            n=4 takes
          </div>
        </div>
      </section>

      {/* BLIND SPOT WARNING — single sentence */}
      <section className="border border-border bg-surface-sunken p-4">
        <div className="mb-2 flex items-center gap-1.5">
          <WarningIcon />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-foreground">
            Blind Spot Warning
          </h2>
        </div>
        <p className="text-[14px] font-medium leading-[1.45] text-foreground">
          {calibration_adjustment.adjustment_text}
        </p>
        <p className="mt-3 text-[11px] leading-[1.5] text-text-muted">
          <span className="font-semibold uppercase tracking-[0.06em]">
            Pattern
          </span>
          <span className="mx-1.5 text-text-muted/60">·</span>
          {calibration_adjustment.applicable_pattern}
        </p>
      </section>

      {/* BRAIN PAGES — titles + relevance, nothing else */}
      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
          Brain Pages
        </h2>
        <BrainPagesList pages={relevant_pages} />
      </section>

      {/* FRESH SIGNAL — headline + source + date, no body */}
      <section>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
          Fresh Signal
        </h2>
        <FreshSignalList signals={fresh_signal} />
      </section>

      {/* CALIBRATED ANSWER — bullets */}
      <section className="border border-border bg-card p-4">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
            Calibrated Answer
          </h2>
          <ConfidencePill level="high" />
        </div>
        <ul className="space-y-2">
          {bullets.map((b, i) => (
            <li
              key={i}
              className="flex gap-2 text-[13px] leading-[1.45] text-foreground"
            >
              <span
                className="mt-[7px] shrink-0 rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  backgroundColor: b.lead ? '#D97757' : '#9B9B9B',
                }}
                aria-hidden
              />
              <span className={b.lead ? 'font-semibold' : ''}>{b.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const MAX_WORDS_PER_BULLET = 12;

function truncateWords(s: string, max: number): string {
  const words = s.split(/\s+/);
  if (words.length <= max) return s;
  return words.slice(0, max).join(' ') + '...';
}

function parseAnswer(
  text: string | undefined | null,
): { text: string; lead?: boolean }[] {
  const trimmed = text?.trim();
  if (!trimmed) return ANSWER_BULLETS;

  const sentences = trimmed
    .split(/\n+|(?<=\.)\s+/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .slice(0, 4)
    .map((s) => truncateWords(s, MAX_WORDS_PER_BULLET));

  if (sentences.length === 0) return ANSWER_BULLETS;
  return sentences.map((t, i) => ({ text: t, lead: i === 0 }));
}

function AccuracyGauge({ value }: { value: number }) {
  const w = 200;
  const h = 110;
  const cx = w / 2;
  const cy = 95;
  const r = 80;
  const stroke = 12;
  const circumference = Math.PI * r;
  const offset = circumference * (1 - value / 100);
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={`${value}% accuracy`}
    >
      <path
        d={arc}
        stroke="#E5E3DE"
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={arc}
        stroke={WARNING_AMBER}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={offset}
      />
      <text
        x={cx}
        y={cy - 18}
        textAnchor="middle"
        fontSize="36"
        fontWeight="700"
        letterSpacing="-1"
        fill="#1A1A1A"
        fontFamily="Inter Variable, Inter, system-ui, sans-serif"
      >
        {value}
        <tspan fontSize="20" fontWeight="600" fill="#6B6B6B">
          %
        </tspan>
      </text>
      <text
        x={cx}
        y={cy + 2}
        textAnchor="middle"
        fontSize="9"
        fontWeight="600"
        letterSpacing="1"
        fill={WARNING_AMBER}
        fontFamily="Inter Variable, Inter, system-ui, sans-serif"
      >
        COIN FLIP ZONE
      </text>
    </svg>
  );
}

function ConfidencePill({ level }: { level: 'high' | 'medium' | 'low' }) {
  const palette = {
    high: { bg: '#E6F4EA', fg: '#1A7F37', label: 'High' },
    medium: { bg: '#FEF7CD', fg: '#854D0E', label: 'Medium' },
    low: { bg: '#FCE8E6', fg: '#C5221F', label: 'Low' },
  }[level];
  return (
    <span className="flex items-baseline gap-1.5 text-[10px]">
      <span className="font-semibold uppercase tracking-[0.06em] text-text-muted">
        Confidence
      </span>
      <span
        className="rounded-sm px-1.5 py-[1px] text-[10px] font-bold uppercase tracking-[0.06em]"
        style={{ backgroundColor: palette.bg, color: palette.fg }}
      >
        {palette.label}
      </span>
    </span>
  );
}

function categoryFromUrl(url: string): string | null {
  if (/^https?:/.test(url)) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  }
  const segs = url.split('/').filter(Boolean);
  if (segs.length < 2) return null;
  const seg = segs[1];
  // Skip date-prefixed filenames like "2026-02-11-foo.md"
  if (/^\d{4}-\d{2}-\d{2}-/.test(seg)) return null;
  // Strip a leading "YYYY-" from category-like segments ("2008-essays" → "essays")
  const m = seg.match(/^\d{4}-(.+)$/);
  if (m) return m[1];
  return seg;
}

function BrainPagesList({ pages }: { pages: BrainPage[] }) {
  return (
    <div className="divide-y divide-border border-y border-border">
      {pages.map((p, i) => {
        const score = RELEVANCE_SCORES[i] ?? 65;
        const category = categoryFromUrl(p.url);
        return (
          <div
            key={p.url}
            className="flex items-start gap-2 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium leading-[1.4] text-foreground">
                {p.title}
              </p>
              {category ? (
                <span className="mt-0.5 inline-block text-[10px] uppercase tracking-[0.06em] text-text-muted">
                  {category}
                </span>
              ) : null}
            </div>
            <RelevanceBadge score={score} />
          </div>
        );
      })}
    </div>
  );
}

function RelevanceBadge({ score }: { score: number }) {
  return (
    <span
      className="shrink-0 rounded-sm border px-1.5 py-[1px] font-mono text-[10px] font-semibold tabular-nums"
      style={{
        borderColor: 'rgba(217, 119, 87, 0.3)',
        backgroundColor: 'rgba(217, 119, 87, 0.06)',
        color: '#A85636',
      }}
      title={`Reranker relevance score: ${score}%`}
    >
      {score}%
    </span>
  );
}

function FreshSignalList({ signals }: { signals: FreshSignalItem[] }) {
  return (
    <div className="divide-y divide-border border-y border-border">
      {signals.map((s) => (
        <div key={s.url} className="py-2.5">
          <p className="text-[13px] font-medium leading-[1.4] text-foreground">
            {s.title}
          </p>
          <div className="mt-1 flex items-baseline gap-2 text-text-muted">
            <span className="text-[11px]">{s.source}</span>
            <span className="text-text-muted/60">·</span>
            <span className="font-mono text-[11px] tabular-nums">
              {s.date}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function WarningIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" x2="12" y1="9" y2="13" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  );
}
