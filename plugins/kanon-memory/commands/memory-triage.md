---
description: Read-only report on existing AI memory and instruction files, classified as keep local, promotion candidate, review, or secret alert
---

Triage the user's existing memory without changing it. No memory file is moved, edited or deleted, by this command or as a follow-up, unless the user asks for that specific change.

1. Ask which roots to scan for `CLAUDE.md`, `CLAUDE.local.md` and `AGENTS.md` (default `~/Projects`), any extra memory directories (for example another tool's memories folder), and where to write the report. The report path must be outside every git repository; suggest the session scratchpad.
2. Run `python3 "${CLAUDE_PLUGIN_ROOT}/lib/triage.py" --out <report> --root <dir> [--memory-dir <dir> ...]`.
3. Summarise the totals and the secret alerts first. Name files only; the report never contains matched values.
4. Offer next steps as suggestions: promotion candidates go through `/promote-memory` in their repo, review items need the user's eyes, and keep-local items stay where they are.
