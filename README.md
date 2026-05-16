# Hindsight

> The self-reflection layer GBrain doesn't have yet.

## What it is

Hindsight extracts your past predictions from GBrain, grades them against what actually happened, and corrects future advice for your specific blind spots.

## Built for

YC GStack × GBrain Hackathon, May 16 2026

## The five new GBrain skills

- **extract-takes** — pulls gradeable predictions from brain pages
- **resolve-outcomes** — grades takes against public outcomes
- **find-contradictions** — detects where you changed your mind
- **hindsight-profile** — builds your calibration profile
- **calibrated-advise** — gives advice that accounts for your blind spots

## Tech stack

- React + Vite + TypeScript + Tailwind + shadcn/ui
- GStack Browser extension (MV3)
- ZeroEntropy `zerank-2` for brain page retrieval
- The Hog API for fresh signal

## Install the GBrain skills

```bash
gbrain skillpack install https://github.com/rayan-arya/hindsight-skills
```

## Load the extension

1. `bun install && bun run build`
2. `chrome://extensions` → Developer mode → **Load unpacked** → select `dist/`

## Team

Rushil Jaiswal, Rayan Arya, Keshav Kotamraju
