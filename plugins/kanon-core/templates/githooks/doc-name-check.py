#!/usr/bin/env python3
"""Enforce the doc naming convention on Markdown file names.

A name passes if it is kebab-case, hyphenated Title-Case, a MADR ADR name, or a
standard repo or tool file (README.md, NOTICE.md, SKILL.md ...). Dots are allowed
inside segments for version numbers (m4.12, v0.1).

Modes:
  --hook      Claude Code PreToolUse payload on stdin. Exit 2 blocks the tool call.
  --staged    names added or renamed in the git index (pre-commit).
  --all       every tracked .md file (CI).
  PATH ...    the given paths.

Paths matching a glob in <repo root>/.docnames-exempt (one per line, # comments)
are skipped; use it for vendored trees that keep their upstream names.
Override once with ALLOW_DOC_NAME=1.
"""
import fnmatch
import json
import os
import re
import shlex
import subprocess
import sys

STANDARD = {
    # GitHub and open-source community files
    "README.md", "CHANGELOG.md", "CONTRIBUTING.md", "LICENSE.md", "COPYING.md", "NOTICE.md",
    "CODE_OF_CONDUCT.md", "SECURITY.md", "SUPPORT.md", "GOVERNANCE.md", "FUNDING.md",
    "AUTHORS.md", "CONTRIBUTORS.md", "MAINTAINERS.md", "CODEOWNERS.md", "ROADMAP.md",
    "PULL_REQUEST_TEMPLATE.md", "pull_request_template.md", "ISSUE_TEMPLATE.md",
    # Names a tool looks up
    "CLAUDE.md", "AGENTS.md", "GEMINI.md", "SKILL.md", "DESIGN.md", "PRODUCT.md", "index.md",
}
KEBAB = re.compile(r"^[a-z0-9][a-z0-9.]*(-[a-z0-9][a-z0-9.]*)*\.md$")
TITLE = re.compile(r"^[A-Z][A-Za-z0-9.]*(-([A-Z0-9][A-Za-z0-9.]*|v[0-9][0-9.]*))*\.md$")
ADR = re.compile(r"^ADR-[0-9]{3}-[a-z0-9]+(-[a-z0-9]+)*\.md$")
REDIRECTS = (">", ">>", ">|")
WRITERS = {"cp", "mv", "install", "ln"}


def name_ok(base):
    if base in STANDARD or ADR.match(base) or KEBAB.match(base):
        return True
    stem = base[:-3]
    # Title-Case, not ALL-CAPS: WEB-DESIGN-NOTICE.md is not a standard name.
    return bool(TITLE.match(base)) and stem != stem.upper()


def repo_root(path):
    d = os.path.dirname(path)
    while d and not os.path.isdir(d):
        d = os.path.dirname(d)
    r = subprocess.run(["git", "-C", d or ".", "rev-parse", "--show-toplevel"],
                       capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else None


def exempt(path):
    path = os.path.abspath(path)
    root = repo_root(path)
    if not root:
        return False
    rel = os.path.relpath(path, root)
    if rel.startswith(".github" + os.sep + "ISSUE_TEMPLATE"):
        return True
    try:
        with open(os.path.join(root, ".docnames-exempt"), encoding="utf-8") as f:
            globs = [g.strip() for g in f if g.strip() and not g.startswith("#")]
    except OSError:
        return False
    return any(fnmatch.fnmatch(rel, g) for g in globs)


def violations(paths):
    return [p for p in paths
            if p.endswith(".md") and not name_ok(os.path.basename(p)) and not exempt(p)]


def simple_commands(cmd):
    try:
        lex = shlex.shlex(cmd, posix=True, punctuation_chars=";&|<>")
        lex.whitespace_split = True
        tokens = list(lex)
    except ValueError:
        tokens = cmd.split()
    cur = []
    for t in tokens:
        if t and set(t) <= set(";&|"):
            if cur:
                yield cur
            cur = []
        else:
            cur.append(t)
    if cur:
        yield cur


def bash_targets(cmd, cwd):
    """Markdown paths a shell command would create or rename into."""
    out = []
    for words in simple_commands(cmd):
        out += [words[i + 1] for i, w in enumerate(words[:-1]) if w in REDIRECTS]
        args = [w for w in words if not set(w) <= set("<>|")]
        if not args:
            continue
        prog, rest = os.path.basename(args[0]), args[1:]
        if prog == "git" and rest[:1] == ["mv"]:
            prog, rest = "mv", rest[1:]
        plain = [a for a in rest if not a.startswith("-")]
        if prog in ("touch", "tee"):
            out += plain
        elif prog in WRITERS and len(plain) >= 2:
            if os.path.isdir(os.path.join(cwd, plain[-1])):
                out += [os.path.join(plain[-1], os.path.basename(s.rstrip("/"))) for s in plain[:-1]]
            else:
                out.append(plain[-1])
    return [p if os.path.isabs(p) else os.path.join(cwd, p) for p in out if p.endswith(".md")]


def hook():
    try:
        payload = json.load(sys.stdin)
    except ValueError:
        return 0
    ti = payload.get("tool_input") or {}
    cwd = payload.get("cwd") or os.getcwd()
    if ti.get("command"):
        targets = bash_targets(ti["command"], cwd)
    elif ti.get("file_path"):
        # Editing a file that already exists is not naming it.
        targets = [] if os.path.exists(ti["file_path"]) else [ti["file_path"]]
    else:
        return 0
    bad = violations(targets)
    if not bad:
        return 0
    print("Blocked by doc-name-guard: " + ", ".join(os.path.basename(b) for b in bad) +
          " breaks the doc naming convention. Use hyphenated Title-Case for docs "
          "(Editor-Parity.md) or kebab-case for config and reference files (git-conventions.md). "
          "Standard files (README.md, NOTICE.md, SKILL.md ...) and ADR-NNN-slug.md are exempt; "
          "vendored trees go in .docnames-exempt. Override once with ALLOW_DOC_NAME=1.",
          file=sys.stderr)
    return 2


def git_list(*args):
    r = subprocess.run(["git", *args], capture_output=True, text=True)
    return [line for line in r.stdout.splitlines() if line]


def main(argv):
    if os.environ.get("ALLOW_DOC_NAME") == "1":
        return 0
    if argv[:1] == ["--hook"]:
        return hook()
    if argv[:1] == ["--staged"]:
        paths = git_list("diff", "--cached", "--name-only", "--diff-filter=AR")
    elif argv[:1] == ["--all"]:
        paths = git_list("ls-files", "*.md")
    else:
        paths = argv
    bad = violations(paths)
    for b in bad:
        print(f"doc-name-check: {b} breaks the doc naming convention", file=sys.stderr)
    if bad:
        print("Rename to hyphenated Title-Case or kebab-case, or add a glob to .docnames-exempt. "
              "Bypass once with ALLOW_DOC_NAME=1.", file=sys.stderr)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
