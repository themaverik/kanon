---
applyTo: "**/*.tsx,**/*.ts,**/*.css"
---

# Frontend Rules

## Style

- `const` by default, `let` when needed, never `var`
- async/await over promise chains
- TypeScript strict mode — avoid `any`
- ESLint + Prettier enforced — configure format-on-save

## Data and UI

- One data-fetching layer (e.g. React Query) for all API calls — no raw `fetch` in components
- One component library per repo — do not mix UI libraries
- Server components by default; client components only when state or browser APIs needed
- Forms validate against a schema (e.g. `react-hook-form` + `zod`)
- No mock data in shipped dashboards — connect them to real APIs

## Organisation

- Group by feature, not by type
- Files under 300 lines
- Import order: React → third-party → local (alphabetised within groups)
- Public before private; most important functions near top
