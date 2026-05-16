# Design System — Hindsight

A GStack Browser sidebar extension for reviewing your own takes, hit rates, and self-contradictions. The interface is an epistemic mirror, not a dashboard.

## Product Context
- **What this is:** A browser sidebar that surfaces your calibration profile (Profile view) and serves context-aware advice when you're forming a new take (Advice view).
- **Who it's for:** People who write, predict, advise, or take public positions and want hindsight on their own pattern of being right and wrong.
- **Surface:** Browser sidebar extension. Default width ~420px. Resizable. Three-panel Advice view stacks vertically below ~480px.
- **Project type:** Side-panel app embedded in GStack Browser. Behaves like a focused tool, not a destination.

## Aesthetic Direction
- **Direction:** Linear meets Notion, in Claude's voice. Typographic discipline from Linear; warm paper-like surfaces from Notion; a single Claude-brand accent that carries identity.
- **Mood:** Warm, candid, considered. The product is making you confront your record — it should feel like a trusted reader's notebook, not a verdict.
- **Decoration:** Minimal. Type, whitespace, and one accent color do the work. No gradients, no icons-in-circles, no decorative dividers.
- **Memorable thing:** The big hit-rate number on a warm off-white page, with a thin Claude-orange bar beneath it filled to the percentage value. The number tells you what; the bar shows you it. That's the screen.

## Color

Approach: **restrained**. One brand accent (Claude orange) carries identity. Verdict badges use a semantic green/amber/red palette — those are functional signals, not brand, and only appear on data, never on chrome.

### Light mode (primary)

```css
:root {
  /* Surface — warm neutral */
  --bg:              #FAF9F6;  /* warm off-white, body background */
  --surface:         #FFFFFF;  /* cards lift +1 step above bg */
  --surface-sunken:  #F4F2EC;  /* inset wells, code blocks */

  /* Border */
  --border:          #E5E3DE;  /* hairline default, warm beige-gray */
  --border-strong:   #D6D3CC;  /* emphasized dividers, focused inputs */

  /* Text */
  --text:            #1A1A1A;  /* primary, near-black */
  --text-secondary:  #6B6B6B;  /* supporting copy, labels */
  --text-muted:      #9B9B9B;  /* meta, timestamps, captions */
  --text-disabled:   #C9C9C9;

  /* Accent — Claude orange */
  --accent:          #D97757;  /* primary brand accent */
  --accent-hover:    #C56745;
  --accent-active:   #A85636;
  --accent-bg:       #FDF1EB;  /* subtle warm wash, hover states */
  --accent-border:   #F5C8B0;  /* selected outlines */

  /* Verdict badges (functional, not brand) */
  --verdict-green-bg:     #DCFCE7;
  --verdict-green-text:   #166534;
  --verdict-green-border: #BBF7D0;

  --verdict-amber-bg:     #FEF3C7;
  --verdict-amber-text:   #92400E;
  --verdict-amber-border: #FDE68A;

  --verdict-red-bg:       #FEE2E2;
  --verdict-red-text:     #991B1B;
  --verdict-red-border:   #FECACA;

  /* Focus ring */
  --ring: #D97757;
  --ring-offset: #FAF9F6;
}
```

### Hue separation
The verdict-amber background (`#FEF3C7`, hue ~48°) and the Claude orange accent (`#D97757`, hue ~15°) are 30°+ apart and read distinctly because the accent is desaturated terracotta while the verdict amber is pale yellow. Never place a verdict-amber badge directly next to an accent-colored element — give them at least a 12px gutter so the eye doesn't read them as a single warm group.

### Dark mode (deferred)

Not in v1. When added, base on `#1A1A1A`, brighten the accent ~12% to `#E48868` for adequate contrast against the dark base, and re-test verdict badges.

### Rules
- Accent is rare. Use it for one thing per screen: the focal number's bar, the primary action, the active tab indicator.
- Verdict badges only label takes, never UI chrome (buttons, tabs, links).
- Never use accent for error states. Red is for verdict only.
- The bar under the hit-rate percentage is the one place the accent earns its size. Everywhere else, it's a hairline or a small mark.
- Hover lifts are color, not shadow: `bg-surface → bg-accent-bg/40`.

## Typography

Approach: clean sans for everything. One typeface family for UI and display, paired monospace for tabular data (percentages, dates, hash IDs).

### Stack

```css
--font-sans: 'Geist', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
--font-mono: 'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace;
```

Load via `@fontsource-variable/geist` and `@fontsource-variable/geist-mono` (npm). Avoid CDN — extensions load offline.

### Scale (sidebar-tuned, tighter than full-page)

| Token       | Size  | Line  | Weight | Use                                              |
|-------------|-------|-------|--------|--------------------------------------------------|
| `text-xs`   | 11px  | 16px  | 500    | Meta labels, badge text, timestamps              |
| `text-sm`   | 12px  | 18px  | 400    | Secondary copy, captions                         |
| `text-base` | 13px  | 20px  | 400    | Default body, UI text                            |
| `text-md`   | 14px  | 22px  | 500    | Emphasized body, table headers                   |
| `text-lg`   | 16px  | 24px  | 600    | Section headings (e.g. "Domain breakdown")       |
| `text-xl`   | 20px  | 28px  | 600    | View titles ("Profile", "Advice")                |
| `text-2xl`  | 28px  | 32px  | 600    | Card subhead numerics, secondary display         |
| `text-3xl`  | 44px  | 48px  | 600    | **Big hit-rate percentage.** The screen.         |

### Weights
- `400` regular — body, default UI
- `500` medium — labels, table headers, UI defaults in Geist
- `600` semibold — headings, the hero number
- Skip 700+. Geist semibold is heavy enough; bolder reads as shouting at this density.

### Tabular numerals
All numeric values (percentages, counts, scores) must use `font-variant-numeric: tabular-nums`. Use Geist Mono for adjacent digit columns where alignment matters (e.g. the domain breakdown rows: `82%`, `54%`, `50%` need to align right-edge).

### Tracking
- Default: `letter-spacing: 0`
- `text-3xl` hero number: `letter-spacing: -0.02em` (tighten the big number)
- `text-xs` uppercase labels: `letter-spacing: 0.04em`, `text-transform: uppercase`

## Spacing

Base unit: **4px**. Comfortable density — closer to Linear's tight grid than Notion's generous one, because sidebars demand efficiency.

| Token  | Value | Common use                            |
|--------|-------|---------------------------------------|
| `0.5`  | 2px   | Hairline gaps inside compact controls |
| `1`    | 4px   | Icon-text gap, badge padding-y        |
| `2`    | 8px   | Tight stack, list item gap            |
| `3`    | 12px  | Default form-row gap                  |
| `4`    | 16px  | Card padding, default block gap       |
| `5`    | 20px  | Section gap inside a card             |
| `6`    | 24px  | Gap between cards                     |
| `8`    | 32px  | View-level section breaks             |
| `10`   | 40px  | Top breathing room for hero number    |
| `12`   | 48px  | View top padding                      |

### Density rules
- Sidebar content padding: `16px` horizontal, `12px` between rows.
- Card internal padding: `16px` all sides. Cards stack with `16px` gap.
- The hero hit-rate card gets `32px` vertical padding to give the number room.
- Three-panel Advice view: `12px` gap between panels when horizontal, `16px` when stacked.

## Layout

Approach: **grid-disciplined**. The sidebar is too narrow for editorial play. Predictable vertical rhythm wins.

### Container
- Width: fills sidebar (CSS `width: 100%`, never fixed).
- Max content width inside: none — fluid to sidebar edge.
- Horizontal safe area: `16px` left/right gutters at all widths.

### Breakpoint
One internal breakpoint: **480px** (Tailwind `wide:`).
- `< 480px`: Advice three-panel stacks vertically (single column).
- `≥ 480px`: Three panels render side-by-side, equal width (`flex-1`), `12px` gap.

### Grid
- Profile view: single column.
- Advice panels: `display: flex` with `flex: 1 1 0` per panel above breakpoint, `flex-direction: column` below.

### Border radius
| Token       | Value | Use                                |
|-------------|-------|------------------------------------|
| `radius-sm` | 4px   | Badges, small inputs               |
| `radius-md` | 6px   | **Default.** Cards, buttons, inputs|
| `radius-lg` | 8px   | Large surfaces, modals             |
| `radius-full` | 9999px | Avatars, status dots             |

6px is the workhorse. It's Linear's tell — sharper than Notion's 4px buttons but softer than 8px shadcn defaults.

### Borders
- Default: `1px solid var(--border)`. Hairlines do most of the visual work.
- Cards: border + `bg-surface` on `bg`. No shadow at rest.
- Focused inputs: `1px solid var(--accent)` + `box-shadow: 0 0 0 3px var(--accent-bg)`.

### Shadows
Used sparingly. Borders carry the structure.

```css
--shadow-xs: 0 1px 2px 0 rgba(26, 26, 26, 0.04);
--shadow-sm: 0 1px 3px 0 rgba(26, 26, 26, 0.06), 0 1px 2px 0 rgba(26, 26, 26, 0.04);
--shadow-md: 0 4px 8px -2px rgba(26, 26, 26, 0.08), 0 2px 4px -2px rgba(26, 26, 26, 0.04);
```

`shadow-sm` on hover for cards that link somewhere. `shadow-md` for popovers/tooltips only.

## Components (token map)

These are conventions, not full specs — implementation lives in `src/components/ui/`.

### Verdict badge
```
inline-flex items-center gap-1
text-xs font-medium uppercase tracking-wide
px-2 py-0.5 rounded-sm
border
```
- Green: `bg-verdict-green-bg text-verdict-green-text border-verdict-green-border`
- Amber: `bg-verdict-amber-bg text-verdict-amber-text border-verdict-amber-border`
- Red: `bg-verdict-red-bg text-verdict-red-text border-verdict-red-border`

### Card
```
bg-surface border border-border rounded-md p-4
```
Hover (only if interactive): `hover:border-border-strong transition-colors duration-150`.

### Hit-rate hero
```
text-3xl font-semibold tracking-tight tabular-nums text-text
```
Followed directly below by a calibration bar — a thin horizontal rule, 2px tall, that fills to the percentage value:
```html
<div class="mt-2 h-0.5 w-full bg-border rounded-full overflow-hidden">
  <div class="h-full bg-accent" style="width: 82%" />
</div>
```
The bar is the identity moment of the app. Subtle but unmistakable: the only place where Claude orange earns scale.

### Domain breakdown row
```
grid grid-cols-[1fr_auto] items-center py-2 gap-3
border-b border-border last:border-b-0
```
Label `text-base text-text`, percentage right-aligned `font-mono text-md tabular-nums text-text`. Optional inline mini-bar (2px tall, accent-colored, max-width 48px) between label and percentage to echo the hero treatment at small scale.

### Self-contradiction pair
```
bg-surface-sunken border-l-2 border-accent p-3 rounded-r-md
```
Two stacked takes inside, separated by `12px` vertical gap and a centered `—` divider in `text-muted`. The left border is the accent — the contradiction is the one place chrome earns the accent treatment, because the contradiction *is* the signal.

### Panel (Advice view)
```
flex-1 min-w-0 bg-surface border border-border rounded-md p-4
```
Panel header: `text-xs uppercase tracking-wide text-text-secondary mb-3`.

### Synthesized answer (bottom of Advice)
```
border-t border-border-strong pt-4 mt-6
text-md leading-relaxed text-text
```
No card chrome. Reads as the conclusion of the page, not another box.

## Motion

Approach: **minimal-functional**. Transitions clarify state changes, never decorate.

```css
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

--duration-fast:   100ms;  /* hover color shifts */
--duration-base:   150ms;  /* default state transitions */
--duration-slow:   250ms;  /* view-level layout changes */
```

### Rules
- Color changes: `100ms ease-out`.
- Hover lifts (border/bg shift): `150ms ease-out`.
- Panel stacking transition at the 480px breakpoint: `250ms ease-in-out`.
- The calibration bar animates from `width: 0%` to its value on first render: `400ms cubic-bezier(0.16, 1, 0.3, 1)`. Once. Never on subsequent renders.
- No bouncy easings. No scroll-triggered animations. No entrance animations on other elements.
- Respect `prefers-reduced-motion: reduce` — collapse all durations to `0ms` (including the calibration bar — it renders at full width immediately).

## Decisions Log

| Date       | Decision                                              | Rationale                                                                             |
|------------|-------------------------------------------------------|---------------------------------------------------------------------------------------|
| 2026-05-16 | Geist + Geist Mono                                    | Linear-clean, designed for UI, offline-loadable via fontsource, mono pairs for tabular nums |
| 2026-05-16 | Claude orange `#D97757` as sole brand accent          | Match Claude brand for product affinity; warm terracotta pairs with warm off-white base |
| 2026-05-16 | Warm neutrals (`#FAF9F6` bg, `#E5E3DE` border)        | Match Claude brand palette; warm grays harmonize with warm orange accent              |
| 2026-05-16 | Verdict palette stays green/amber/red                 | Verdict is functional signal, not brand — never recolor functional states to match brand |
| 2026-05-16 | Verdict-amber and accent given 12px+ gutter           | Hue distance is 30°+ but both are warm — separation prevents reading as one group     |
| 2026-05-16 | 4px base spacing, sidebar-tuned scale                 | Sidebars need tighter density than full pages; Linear-leaning over Notion-leaning     |
| 2026-05-16 | 6px default border radius                             | Linear's tell; sharper than Notion, softer than shadcn default                        |
| 2026-05-16 | Borders do structural work, not shadows               | Editorial restraint; shadows reserved for popovers                                    |
| 2026-05-16 | Calibration bar under hero hit-rate as identity moment | The accent earns size in exactly one place; it visualizes the value being read        |
| 2026-05-16 | Internal breakpoint at 480px for Advice three-panel   | Below 480px three columns become unreadable; vertical stack is the honest fallback    |
| 2026-05-16 | Dark mode deferred to v2                              | Ship the light system first; dark needs separate color reckoning                      |
