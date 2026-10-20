---
applyTo: "**/*.tsx,**/*.ts,**/*.css"
---

> This file extends [common/patterns.md](../common/patterns.md) with web-specific patterns.

# Web Patterns

## Component Composition

### Compound Components

Use compound components when related UI shares state and interaction semantics:

```tsx
<Tabs defaultValue="overview">
  <Tabs.List>
    <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
    <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="overview">...</Tabs.Content>
  <Tabs.Content value="settings">...</Tabs.Content>
</Tabs>
```

- Parent owns state
- Children consume via context
- Prefer this over prop drilling for complex widgets

### Render Props / Slots

- Use render props or slot patterns when behavior is shared but markup must vary
- Keep keyboard handling, ARIA, and focus logic in the headless layer

### Container / Presentational Split

- Container components own data loading and side effects
- Presentational components receive props and render UI
- Presentational components should stay pure

## State Management

Treat these separately:

| Concern | Tooling |
|---------|---------|
| Server state | TanStack Query, SWR, tRPC |
| Client state | Zustand, Jotai, signals |
| URL state | search params, route segments |
| Form state | React Hook Form or equivalent |

- Do not duplicate server state into client stores
- Derive values instead of storing redundant computed state

## URL As State

Persist shareable state in the URL:
- filters
- sort order
- pagination
- active tab
- search query

## Data Fetching

### Stale-While-Revalidate

- Return cached data immediately
- Revalidate in the background
- Prefer existing libraries instead of rolling this by hand

### Optimistic Updates

- Snapshot current state
- Apply optimistic update
- Roll back on failure
- Emit visible error feedback when rolling back

### Parallel Loading

- Fetch independent data in parallel
- Avoid parent-child request waterfalls
- Prefetch likely next routes or states when justified

## Sources

- Compound components: Kent C. Dodds, "Compound Components with React Hooks", 2019, https://kentcdodds.com/blog/compound-components-with-react-hooks
- Prop drilling: Kent C. Dodds, "Prop Drilling", 2018, https://kentcdodds.com/blog/prop-drilling
- Render props: React team, "Render Props", legacy React documentation, https://legacy.reactjs.org/docs/render-props.html
- Slots: WHATWG, HTML Living Standard, "The slot element", https://html.spec.whatwg.org/multipage/scripting.html#the-slot-element
- Accessible keyboard and ARIA behavior: W3C, WAI-ARIA Authoring Practices Guide, https://www.w3.org/WAI/ARIA/apg/
- Container / presentational split: Dan Abramov, "Presentational and Container Components", Medium, 2015, https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0
- Server state: TanStack, "Overview", TanStack Query documentation, https://tanstack.com/query/latest/docs/framework/react/overview
- Stale-while-revalidate: IETF, RFC 5861, 2010, https://www.rfc-editor.org/rfc/rfc5861
- Optimistic updates: TanStack, "Optimistic Updates", TanStack Query documentation, https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
- Request waterfalls: TanStack, "Request Waterfalls", TanStack Query documentation, https://tanstack.com/query/latest/docs/framework/react/guides/request-waterfalls
