---
description: Review captured memory candidates with the user and promote only the approved ones into .claude/rules/learned/
---

Promote shared memory for this repo. Nothing is written to the repo until the user approves each entry, because shared memory reaches every teammate and agent.

1. Get the ticket key from the branch name or ask for it. Run `python3 "${CLAUDE_PLUGIN_ROOT}/lib/capture.py" --list` and show the user every candidate with its status and flags.
   - BLOCKED entries are never promoted. Tell the user which rule fired and to rotate any exposed secret.
   - HOLD entries touch sensitive paths or legal keywords. Promote one only if the user confirms it holds no personal, legal or council data.
   - MASKED entries already have personal data replaced by placeholders such as `<EMAIL>` or `<AADHAAR>`. Show the masked text exactly as it will be written.
2. Ask the user to approve, edit or reject each entry, and wait for the answer. Silence or a general "looks good" is not approval for HOLD entries; ask for those by id.
3. For each approved entry, read the cited lines to confirm the fact still holds, then append it to `.claude/rules/learned/<topic>.md` as one bullet:
   `- <fact> (`path/to/file.ext:LINE`) [TICKET-123, expires YYYY-MM-DD]`
   The expiry is today plus `expiry_days` from `.kanon-memory.json` (default 90). A new topic file starts with `paths:` frontmatter scoped to the cited directories.
4. Run `python3 "${CLAUDE_PLUGIN_ROOT}/lib/memory-check.py" .claude/rules/learned/<topic>.md` and fix every error with the user before staging.
5. Leave the commit and PR to the user's normal ticket flow. Do not edit or delete the auto-memory files or the candidates file.
