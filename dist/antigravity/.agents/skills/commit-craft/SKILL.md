---
name: commit-craft
description: Commit message discipline. Load whenever staging or committing changes. Ticket-prefixed one-liner subject plus pointwise body derived from the staged diff. No walls of text, no generated-by footers.
---

# Commit Craft

## Before writing
1. Ticket key: extract from the branch name (`git branch --show-current`, pattern `[A-Z][A-Z0-9]+-[0-9]+`). If the branch has none, use the key from the brief; if neither exists, ask.
2. Read what is actually staged: `git diff --cached --stat`, then the patch for anything the stat alone does not explain. Summarise the staged reality, not the intended plan.

## Format

Message length follows the size of the change, and nothing else.

**Small change** - subject plus one or two sentences. No bullets.
```
PROJ-123: <imperative one-liner, <=72 chars>

<One or two sentences: what changed and why. Nothing more.>
```

**Large change** - subject, one or two sentences of summary, then one-line points.
```
PROJ-123: <imperative one-liner, <=72 chars>

<One or two sentences summarising the change as a whole.>

- <one line per change: what + why, not how>
- <one line>
```

Rules:
- Subject: imperative mood ("add", "fix", "extract"), no trailing period, no vague verbs ("update", "improve") without an object that says what.
- Body: 2-5 points maximum, each a single line, one per logical change. Omit the body entirely for a trivial single-purpose diff where the subject says it all.
- Never: paragraphs, restating the diff file-by-file, "misc fixes", emoji, or AI attribution footers ("Generated with...", "Co-Authored-By: Claude"). Attribution footers are stripped policy-wide.
- **A message that wants to be long is the signal that the commit should have been several commits.** Propose the split instead of writing more prose.

## Examples

Small:
```
PAY-482: key the idempotency guard on provider event id

The payload hash collided across retries with reordered JSON fields.
```

Large:
```
PAY-482: extract idempotency check from webhook handler into shared guard

Dedupe logic had been copy-pasted across three handlers and had already drifted.

- single guard replaces the three copies, removing the drift
- guard keys on provider event id, not payload hash, per ADR 0014
- existing duplicate-delivery test moved to the guard's suite unchanged
```
