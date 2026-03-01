# cc-model

Which Claude AI models are powering your sessions?

Shows the distribution of Opus, Sonnet, and Haiku usage across your Claude Code history — and how that's changed over time.

## Usage

```bash
npx cc-model
```

```
cc-model — Which Claude models power your sessions

  Opus 4.5    ████████████████████████████   249  ( 53%)
  Opus 4.6    █████████████████░░░░░░░░░░░   147  ( 31%)
  Sonnet 4.6  █████░░░░░░░░░░░░░░░░░░░░░░░    46  ( 10%)
  Haiku 4.5   ██░░░░░░░░░░░░░░░░░░░░░░░░░░    17  (  4%)
  Sonnet 4.5  █░░░░░░░░░░░░░░░░░░░░░░░░░░░     8  (  2%)

───────────────────────────────────────────────────────
  Total sessions: 467
  Current model:  Opus 4.6
  Primary model:  Opus 4.5 (249 sessions)

  Run with --timeline to see week-by-week model history
```

## Timeline view

```bash
npx cc-model --timeline
```

```
cc-model — Week-by-week model usage

  2026-W02   20  Opus 4.5×20
  2026-W03   33  Opus 4.5×30  Haiku 4.5×3
  2026-W05   76  Opus 4.5×75  Haiku 4.5×1
  2026-W06  146  Opus 4.5×115  Opus 4.6×15  Haiku 4.5×8  Sonnet 4.5×8
  2026-W07   37  Opus 4.6×36  Haiku 4.5×1
  2026-W08   91  Opus 4.6×53  Sonnet 4.6×38
  2026-W09   50  Opus 4.6×41  Sonnet 4.6×8
  2026-W10    2  Opus 4.6×2
```

The timeline reveals the exact week you switched models — and whether you ever mix them within a week.

## Options

```bash
npx cc-model               # Model distribution
npx cc-model --timeline    # Week-by-week breakdown
npx cc-model --json        # JSON output
npx cc-model --help        # Show help
```

## What the data shows

- **Primary model**: Which model has handled the most sessions overall
- **Current model**: The model used in your most recent session
- **Timeline**: When you switched models, and how often you mix Opus/Sonnet/Haiku

## Browser Version

→ **[yurukusa.github.io/cc-model](https://yurukusa.github.io/cc-model/)**

Drag in your `~/.claude` folder. Includes distribution chart and interactive timeline. Runs locally.

## Part of cc-toolkit

cc-model is tool #50 in [cc-toolkit](https://yurukusa.github.io/cc-toolkit/) — 50 free tools for Claude Code users.

Related:
- [cc-session-length](https://github.com/yurukusa/cc-session-length) — Session duration distribution
- [cc-momentum](https://github.com/yurukusa/cc-momentum) — Week-by-week session trend
- [cc-depth](https://github.com/yurukusa/cc-depth) — Conversation turns per session

---

**GitHub**: [yurukusa/cc-model](https://github.com/yurukusa/cc-model)
**Try it**: `npx cc-model`
