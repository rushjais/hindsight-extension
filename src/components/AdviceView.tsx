import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import type {
  AdviceResult,
  BrainPage,
  FreshSignalItem,
} from '@hindsight/types';
import { getAdvice, getCapturedAdvice } from '@/lib/skillsClient';

const WARNING_AMBER = '#CA8A04';

const BLIND_SPOT_HEADLINE_MAX_WORDS = 16;
const BLIND_SPOT_PATTERN_MAX_WORDS = 12;
const BLIND_SPOT_FALLBACK_HEADLINE =
  "Check the domain breakdown for this question's calibration.";

function clampWords(s: string, max: number): string {
  const trimmed = s.trim();
  if (!trimmed) return '';
  const words = trimmed.split(/\s+/);
  if (words.length <= max) return trimmed;
  return words.slice(0, max).join(' ') + '…';
}

// Resolve the Blind Spot Warning from the live response. Accepts two shapes:
// the contract-correct `calibration_adjustment` (Hindsight types), and a
// forward-looking `blind_spot` shape Rayan may ship later. Falls back to a
// generic sentence if neither is present.
function resolveBlindSpot(advice: AdviceResult | null): {
  headline: string;
  pattern: string;
} {
  const bs = (advice as unknown as {
    blind_spot?: { headline?: string; pattern?: string };
  } | null)?.blind_spot;
  const adj = advice?.calibration_adjustment;

  const rawHeadline = bs?.headline ?? adj?.adjustment_text ?? '';
  const rawPattern = bs?.pattern ?? adj?.applicable_pattern ?? '';

  const headline =
    clampWords(rawHeadline, BLIND_SPOT_HEADLINE_MAX_WORDS) ||
    BLIND_SPOT_FALLBACK_HEADLINE;
  const pattern = clampWords(rawPattern, BLIND_SPOT_PATTERN_MAX_WORDS);

  return { headline, pattern };
}

export function AdviceView() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<AdviceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The question the user actually submitted (frozen at submit time).
  // Drives the Question card so the user's typed text is always what's
  // shown — never overwritten by what the server echoes back.
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const submit = useCallback(async () => {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setAdvice(null);
    setSubmittedQuestion(q);
    try {
      const result = await getAdvice(q);
      if (result?.data) {
        setAdvice(result.data);
      } else {
        setError(
          'No answer came back from the skills server. Use the captured demo as a fallback.',
        );
      }
    } catch {
      setError(
        'Request failed. Use the captured demo as a fallback.',
      );
    } finally {
      setLoading(false);
    }
  }, [question, loading]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void submit();
    }
  };

  const loadCapturedFallback = useCallback(() => {
    const cap = getCapturedAdvice();
    if (cap) {
      setAdvice(cap);
      setError(null);
    } else {
      setError(
        'Captured demo answer is not loaded. Reload the extension.',
      );
    }
  }, []);

  const canSubmit = question.trim().length > 0 && !loading;
  const relevant_pages = advice?.relevant_pages ?? [];
  const fresh_signal = advice?.fresh_signal ?? [];
  const synthesized_take = advice?.synthesized_take ?? '';
  const bullets = parseAnswer(synthesized_take);
  const blindSpot = resolveBlindSpot(advice);

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* ASK INPUT */}
      <section className="border border-border bg-card p-4">
        <label
          htmlFor="hindsight-ask"
          className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary"
        >
          Ask
        </label>
        <textarea
          id="hindsight-ask"
          ref={textareaRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask Paul Graham's brain anything…"
          rows={2}
          disabled={loading}
          className="mt-2 w-full resize-none rounded-md border border-border bg-background p-3 text-[14px] leading-[1.45] text-foreground placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:opacity-60"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[10px] text-text-muted">
            <kbd className="font-mono">⌘</kbd>
            <span className="mx-0.5">+</span>
            <kbd className="font-mono">↵</kbd>
            <span className="ml-1">to send</span>
          </span>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canSubmit}
            className="rounded-md bg-primary px-4 py-1.5 text-[13px] font-semibold text-white transition-colors duration-fast hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Asking…' : 'Ask'}
          </button>
        </div>
      </section>

      {/* LOADING */}
      {loading ? (
        <section className="border border-border bg-card p-4 text-center">
          <div className="flex flex-col items-center gap-2 text-text-muted">
            <span
              aria-hidden
              className="inline-block size-3 animate-spin rounded-full border-2 border-border border-t-primary"
            />
            <span className="text-[12px]">Reading 181 takes…</span>
          </div>
        </section>
      ) : null}

      {/* ERROR */}
      {error ? (
        <section
          className="border p-4"
          style={{
            backgroundColor: 'rgba(217, 119, 87, 0.06)',
            borderColor: 'rgba(217, 119, 87, 0.3)',
          }}
        >
          <p className="text-[13px] leading-[1.45] text-foreground">{error}</p>
          <button
            type="button"
            onClick={loadCapturedFallback}
            className="mt-2 rounded-md border border-primary/40 bg-card px-3 py-1 text-[12px] font-semibold text-primary transition-colors duration-fast hover:bg-primary/5"
          >
            Load captured demo answer
          </button>
        </section>
      ) : null}

      {/* QUESTION CARD — shows immediately on submit, sourced from local state */}
      {submittedQuestion ? (
        <section className="border border-border bg-card p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary">
            Question
          </div>
          <p className="mt-2 text-[15px] italic leading-[1.4] text-foreground">
            "{submittedQuestion}"
          </p>
        </section>
      ) : null}

      {/* Everything below renders only after an answer arrives */}
      {advice ? (
        <>
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
          {blindSpot.headline}
        </p>
        {blindSpot.pattern ? (
          <p className="mt-3 text-[11px] leading-[1.5] text-text-muted">
            <span className="font-semibold uppercase tracking-[0.06em]">
              Pattern
            </span>
            <span className="mx-1.5 text-text-muted/60">·</span>
            {blindSpot.pattern}
          </p>
        ) : null}
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
        </>
      ) : null}
    </div>
  );
}

// Readability rules applied to every Calibrated Answer render:
//   - Max 3 bullets
//   - Max 14 words per bullet (longer sentences are skipped, not truncated)
//   - No ellipsis — bullets must be full short sentences
// If no qualifying short sentences, fall back to a single bullet containing
// the raw synthesized_take — never invent question-specific content.
const MAX_BULLETS = 3;
const MAX_WORDS_PER_BULLET = 14;

function parseAnswer(
  text: string | undefined | null,
): { text: string; lead?: boolean }[] {
  const trimmed = text?.trim();
  if (!trimmed) return [];

  const shortSentences = trimmed
    .split(/\n+|(?<=\.)\s+/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .filter((s) => s.split(/\s+/).length <= MAX_WORDS_PER_BULLET)
    .slice(0, MAX_BULLETS);

  // No qualifying short sentences? Show the raw answer as a single lead
  // bullet rather than inventing question-specific content.
  if (shortSentences.length === 0) return [{ text: trimmed, lead: true }];
  return shortSentences.map((t, i) => ({ text: t, lead: i === 0 }));
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
      {pages.map((p) => {
        const category = categoryFromUrl(p.url);
        return (
          <div
            key={p.url}
            className="flex flex-col gap-1 py-2.5"
          >
            <p className="text-[13px] font-medium leading-[1.4] text-foreground">
              {p.title}
            </p>
            {p.relevance ? (
              <p className="text-[11px] leading-[1.4] text-text-secondary italic">
                {p.relevance}
              </p>
            ) : null}
            {category ? (
              <span className="text-[10px] uppercase tracking-[0.06em] text-text-muted">
                {category}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
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
