---
applyTo: "**/*.tsx,**/*.ts,**/*.css"
---

# Frontend Rules

## Style

- `const` by default, `let` when needed, never `var`
- async/await over promise chains
- TypeScript strict mode: avoid `any`
- ESLint + Prettier enforced. Configure format-on-save

## Data and UI

- One data-fetching layer (e.g. React Query) for all API calls. No raw `fetch` in components *(Kanōn)*
- One component library per repo. Do not mix UI libraries
- Server components by default; client components only when state or browser APIs needed
- Forms validate against a schema (e.g. `react-hook-form` + `zod`)
- No mock data in shipped dashboards. Connect them to real APIs

## Organisation

- Group by feature, not by type
- Import order: React → third-party → local (alphabetised within groups)
- Public before private; most important functions near top

## Sources

- TypeScript strict mode: Microsoft, "TSConfig Reference: strict", https://www.typescriptlang.org/tsconfig/#strict
- Prettier: Prettier, documentation, https://prettier.io
- TanStack Query: TanStack, "Overview", https://tanstack.com/query/latest/docs/framework/react/overview
- Server components: React team, "Server Components", react.dev, https://react.dev/reference/rsc/server-components
- React Hook Form: React Hook Form, documentation, https://react-hook-form.com
- Zod: Colin McDonnell, Zod documentation, https://zod.dev
- Group by feature: Robert C. Martin, "Screaming Architecture", 2011, https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html
