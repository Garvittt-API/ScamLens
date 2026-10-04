<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ScamLens project conventions

**Stack:** Next.js (App Router) + TypeScript + Tailwind v4 + vitest. npm only. One app:
frontend in `src/components`, backend route handlers in `src/app/api`.

**Non-negotiable product rules**

- Never put detection logic in an AI prompt. Deterministic signals live in
  `src/lib/signals/patterns.ts`; scoring lives in `src/lib/risk/`.
- The AI never produces the risk score. It may only fill summary/explanation/actions.
- Every input type (text/image/url) must produce the same `AnalysisResult`
  (`src/lib/types.ts`) via `runAnalysis` in `src/lib/pipeline/analyze.ts`.
- URL mode must never fetch or execute user URLs; keep the SSRF guard in
  `src/lib/url/safety.ts` intact.
- No user content in logs, errors, or history. Errors return `{ error, code }` with a real
  HTTP status via `handleRoute` in `src/lib/server/http.ts`.
- New signal categories need: pattern entry, weight in `src/lib/risk/config.ts`, category
  meta in `ResultDashboard.tsx`, and a baseline action in `src/lib/actions.ts`.

**Workflow**

- Before changing a file, read it; reuse existing UI primitives in `src/components/ui`.
- After any change run: `npm run lint && npm test && npm run build`. All three must pass.
- Add/extend vitest tests for new logic (tests live next to code in `__tests__/`).
- Keep dependencies minimal; justify every new package.
