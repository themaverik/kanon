---
name: commit-craft
description: Commit message discipline. Load whenever staging or committing changes. Ticket-prefixed one-liner subject plus pointwise body derived from the staged diff. No walls of text, no generated-by footers.
---

# Commit Craft

## Before writing
1. Ticket key: extract from the branch name (`git branch --show-current`, pattern `[A-Z][A-Z0-9]+-[0-9]+`). If the branch has none, use the key from the brief; if neither exists, ask.
2. Read what is actually staged: `git diff --cached --stat`, then the patch for anything the stat alone does not explain. Summarise the staged reality, not the intended plan.

## Format
```
PROJ-123: <imperative one-liner, <=72 chars, what changed at the highest useful level>

- <point: one line, what + why, not how>
- <point>
```
Rules:
- Subject: imperative mood ("add", "fix", "extract"), no trailing period, no vague verbs ("update", "improve") without an object that says what.
- Body: 2-5 bullets, each a single line. One bullet per logical change. Omit the body entirely for trivial single-purpose diffs where the subject says it all.
- Never: paragraphs, restating the diff file-by-file, "misc fixes", emoji, or AI attribution footers ("Generated with...", "Co-Authored-By: Claude"). Attribution footers are stripped policy-wide.
- Mixed concerns in one staged diff is a smell: propose splitting into separate commits instead of writing a longer message.

## Example
```
PAY-482: extract idempotency check from webhook handler into shared guard

- dedupe logic was copy-pasted across 3 handlers; single guard removes drift
- guard keys on provider event id, not payload hash, per ADR 0014
- existing duplicate-delivery test moved to the guard's suite unchanged
```
