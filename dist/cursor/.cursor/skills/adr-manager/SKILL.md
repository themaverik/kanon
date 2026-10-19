---
name: adr-manager
description: Capture and query Architecture Decision Records. Use on design sign-off, "log this as ADR", "record this decision", "why did we choose X", tech choices, and accepted trade-offs. ADRs are the only committed decision artifact.
---

# ADR Manager

ADRs live at `docs/adr/NNNN-short-slug.md`, sequentially numbered, committed with the change they justify. They describe the system, never the session.

## When to capture
- A technology, pattern, or contract choice with alternatives that were rejected.
- An accepted trade-off or deliberate deviation from industry standard.
- A reversal or supersession of a prior ADR.
Do not capture routine implementation detail, session state, or progress notes.

## Format (MADR-lite)
```markdown
# NNNN. <Decision title>

- Status: proposed | accepted | superseded by NNNN | deprecated
- Date: YYYY-MM-DD
- Ticket: <PROJ-123>
- Deciders: <roles/handles>

## Context
What forces this decision. One or two paragraphs.

## Decision
What was chosen, stated as a full sentence.

## Alternatives considered
- <Option>: why rejected.

## Consequences
Positive, negative, and follow-ups. Name the industry pattern adopted and any
anti-pattern deliberately accepted or avoided.
```

## Behaviour
- Next number: `ls docs/adr | sort | tail -1`.
- On capture, keep it under a page; link the driving ticket; never edit an accepted ADR's decision text, supersede it instead.
- On query ("why did we choose X"): grep titles and Decision lines in `docs/adr/`, cite the ADR number; flag when a proposed change conflicts with an accepted ADR.
