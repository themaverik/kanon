#!/usr/bin/env python3
"""Check promoted memory in .claude/rules/learned/ before it is committed or merged.

Every bullet must cite a file and line that still exist, carry a ticket key and an
unexpired date, and pass the content filter: no secrets, no unmasked personal data,
no invisible Unicode. Sensitive-path and keyword hits are reported as warnings because
a human already approved the entry.

Modes:
  --all     every learned file in the repo (CI).
  --staged  learned files staged in the git index (pre-commit).
  PATH ...  explicit paths.

Exit 0 clean, 3 on violations, 1 on a crash, so callers can tell them apart.
"""
import datetime
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import memfilter  # noqa: E402
from capture import CITATION  # noqa: E402

LEARNED = ".claude/rules/learned/"
META = re.compile(r"\[([A-Z][A-Z0-9]+-[0-9]+), expires (\d{4}-\d{2}-\d{2})\]")
PLACEHOLDER = re.compile(r"<[A-Z_]+>")


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True, check=True).stdout


def targets(argv):
    if "--all" in argv:
        return [p for p in git("ls-files", LEARNED).splitlines() if p.endswith(".md")]
    if "--staged" in argv:
        names = git("diff", "--cached", "--name-only", "--diff-filter=ACMR").splitlines()
        return [p for p in names if p.startswith(LEARNED) and p.endswith(".md")]
    return [a for a in argv if not a.startswith("--")]


def line_count(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        return sum(1 for _ in f)


def check_entry(entry, root, cfg, today):
    errors, warnings = [], []
    cites = CITATION.findall(entry)
    if not cites:
        errors.append("no file:line citation")
    for path, start, end in cites:
        full = os.path.join(root, path)
        if not os.path.isfile(full):
            errors.append(f"cited file missing: {path}")
        elif int(end or start) > line_count(full):
            errors.append(f"cited line past end of {path}")
    meta = META.search(entry)
    if not meta:
        errors.append("missing [TICKET-123, expires YYYY-MM-DD]")
    elif datetime.date.fromisoformat(meta.group(2)) < today:
        errors.append(f"expired {meta.group(2)}: renew with review or remove")
    probe = PLACEHOLDER.sub("", entry)
    _, findings = memfilter.scan(probe, cfg, [c[0] for c in cites])
    for action, rule in findings:
        if action == memfilter.BLOCK:
            errors.append(f"blocked content: {rule}")
        elif action == memfilter.MASK:
            errors.append(f"unmasked personal data: {rule}")
        else:
            warnings.append(f"sensitive, confirm review: {rule}")
    return errors, warnings


def main(argv):
    if os.environ.get("ALLOW_MEMORY_CHECK") == "1":
        return 0
    root = git("rev-parse", "--show-toplevel").strip()
    cfg = memfilter.load_config(root)
    today = datetime.date.today()
    failed = False
    for rel in targets(argv):
        path = os.path.join(root, rel)
        if not os.path.isfile(path):
            continue
        with open(path, encoding="utf-8") as f:
            lines = f.read().splitlines()
        for n, line in enumerate(lines, 1):
            if not line.lstrip().startswith("- "):
                continue
            errors, warnings = check_entry(line, root, cfg, today)
            for w in warnings:
                print(f"{rel}:{n}: warning: {w}", file=sys.stderr)
            for e in errors:
                print(f"{rel}:{n}: {e}", file=sys.stderr)
                failed = True
    return 3 if failed else 0


if __name__ == "__main__":
    try:
        sys.exit(main(sys.argv[1:]))
    except subprocess.CalledProcessError:
        sys.exit(0)  # not a git repo: nothing to check
    except Exception as exc:  # noqa: BLE001
        print(f"memory-check crashed: {exc}", file=sys.stderr)
        sys.exit(1)
