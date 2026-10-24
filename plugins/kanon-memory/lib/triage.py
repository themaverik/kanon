#!/usr/bin/env python3
"""Read-only triage of existing AI memory into a keep/review report.

Usage: triage.py --out REPORT.md [--root DIR ...] [--memory-dir DIR ...]

Defaults: auto memory under ~/.claude/projects/*/memory and CLAUDE.md, CLAUDE.local.md and
AGENTS.md files up to four levels below each --root. Every source is opened read-only; nothing
is moved, edited or deleted. The report names files and rule counts, never matched values,
and must be written outside any git repository.
"""
import argparse
import glob
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import memfilter  # noqa: E402
from capture import CITATION  # noqa: E402

INSTRUCTION_FILES = ("CLAUDE.md", "CLAUDE.local.md", "AGENTS.md")
SKIP_DIRS = {".git", "node_modules", "dist", "build", "target", ".venv", "vendor"}


def inside_git(path):
    d = os.path.dirname(os.path.abspath(path))
    r = subprocess.run(["git", "-C", d, "rev-parse", "--is-inside-work-tree"],
                       capture_output=True, text=True)
    return r.returncode == 0 and r.stdout.strip() == "true"


def instruction_files(root, depth=4):
    base = root.rstrip(os.sep).count(os.sep)
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        if dirpath.count(os.sep) - base >= depth:
            dirnames[:] = []
        for name in filenames:
            if name in INSTRUCTION_FILES:
                yield os.path.join(dirpath, name)


def classify(path):
    with open(path, encoding="utf-8", errors="replace") as f:
        lines = [l for l in f.read().splitlines() if l.strip()]
    cited = sum(1 for l in lines if CITATION.search(l))
    rules = {}
    for line in lines:
        for action, rule in memfilter.scan(line)[1]:
            rules.setdefault(action, set()).add(rule)
    if memfilter.BLOCK in rules:
        verdict = "secret-alert: rotate, then review"
    elif memfilter.HOLD in rules or memfilter.MASK in rules:
        verdict = "review: personal or sensitive data"
    elif cited:
        verdict = "promotion candidate"
    else:
        verdict = "keep local"
    flags = "; ".join(f"{a}: {', '.join(sorted(r))}" for a, r in sorted(rules.items())) or "none"
    return len(lines), cited, verdict, flags


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--root", action="append", default=[])
    ap.add_argument("--memory-dir", action="append", default=[])
    args = ap.parse_args()
    if inside_git(args.out):
        print("triage: --out must be outside every git repository", file=sys.stderr)
        return 2
    sources = list(args.memory_dir)
    base = os.environ.get("KANON_MEMORY_PROJECTS", os.path.expanduser("~/.claude/projects"))
    sources += glob.glob(os.path.join(base, "*", "memory"))
    files = []
    for d in sources:
        files += sorted(glob.glob(os.path.join(d, "*.md")))
    for root in args.root:
        files += sorted(instruction_files(os.path.expanduser(root)))

    rows, totals = [], {}
    for path in dict.fromkeys(os.path.realpath(f) for f in files):
        n, cited, verdict, flags = classify(path)
        totals[verdict] = totals.get(verdict, 0) + 1
        rows.append(f"- `{path}`: {verdict}. {n} lines, {cited} cited. Flags: {flags}")

    with open(args.out, "w", encoding="utf-8") as f:
        f.write("# Memory Triage Report\n\nRead-only. No source file was changed.\n\n## Totals\n\n")
        for verdict, count in sorted(totals.items()):
            f.write(f"- {verdict}: {count}\n")
        f.write("\n## Files\n\n" + "\n".join(rows) + "\n")
    print(f"triage: {len(files)} files, report at {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
