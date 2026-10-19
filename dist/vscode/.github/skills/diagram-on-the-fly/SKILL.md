---
name: diagram-on-the-fly
description: Generate and render component and sequence diagrams from code during analysis. Use when asked to visualise architecture, flows, or interactions, or when a diagram would anchor a design discussion.
---

# Diagram On The Fly

Default: **Mermaid**. Escalate to Structurizr DSL only when C4 model consistency across context/container/component levels is required.

## Component diagrams
1. Build the structural picture from cheap sources first: graphify's GRAPH_REPORT.md / graph.json if present, else Serena symbol queries, else `depcruise src --output-type mermaid` for TS repos.
2. Emit Mermaid `flowchart` (or `C4Component` where the audience expects C4 syntax), grouping by module/package with dependency edges only for real imports/calls you verified.

## Sequence diagrams
1. Trace the actual call chain with Serena (find-references from the entrypoint) or by reading the code path. Never draw a call you did not verify exists.
2. Emit Mermaid `sequenceDiagram` including the failure paths (timeouts, retries, compensation), not just the happy path.

## Rendering and hygiene
- Save sources versioned in-repo under `docs/diagrams/*.mmd` (or `.dsl` for Structurizr).
- Render to view: `npx --no-install @mermaid-js/mermaid-cli -i in.mmd -o out.svg` when available; otherwise output the fenced ```mermaid block (renders in GitHub/most viewers).
- Validate before committing: mermaid-cli exit status is the check; broken diagrams never merge.
- Regenerate, don't patch: diagrams are derived artifacts; when code changes, re-derive from code.
