#!/usr/bin/env python3
"""Collect cited facts from the session's auto memory into a candidates file outside the repo.

Modes:
  --hook   Stop/PreCompact payload on stdin. Never blocks: every failure exits 0.
  --list   Print pending candidates for /promote-memory.

Memory files are opened read-only and never changed. Candidates live next to the memory dir,
never in the repo, so nothing reaches git until a human approves it through /promote-memory.
"""
import hashlib
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import memfilter  # noqa: E402

CITATION = re.compile(r"`?([A-Za-z0-9_./-]+\.[A-Za-z0-9]+):(\d+)(?:-(\d+))?`?")


def repo_root(cwd):
    try:
        out = subprocess.run(["git", "-C", cwd, "rev-parse", "--show-toplevel"],
                             capture_output=True, text=True, timeout=5)
    except (OSError, subprocess.SubprocessError):
        return None
    return out.stdout.strip() or None


def project_dir(cwd):
    base = os.environ.get("KANON_MEMORY_PROJECTS", os.path.expanduser("~/.claude/projects"))
    return os.path.join(base, re.sub(r"[^A-Za-z0-9]", "-", cwd))


def candidates_path(cwd):
    return os.path.join(project_dir(cwd), "kanon-memory-candidates.jsonl")


def citations(line, root):
    found = []
    for path, start, end in CITATION.findall(line):
        full = os.path.join(root, path)
        if os.path.isfile(full):
            found.append({"path": path, "start": int(start), "end": int(end or start)})
    return found


def memory_lines(mem_dir):
    for name in sorted(os.listdir(mem_dir)):
        if not name.endswith(".md") or name == "MEMORY.md":
            continue
        with open(os.path.join(mem_dir, name), encoding="utf-8", errors="replace") as f:
            text = f.read()
        body = re.sub(r"\A---\n.*?\n---\n", "", text, flags=re.S)
        for line in body.splitlines():
            line = line.strip().lstrip("-* ").strip()
            if line:
                yield name, line


def collect(cwd):
    root = repo_root(cwd)
    mem_dir = os.path.join(project_dir(cwd), "memory")
    if not root or not os.path.isdir(mem_dir):
        return 0
    cfg = memfilter.load_config(root)
    out = candidates_path(cwd)
    seen = set()
    if os.path.isfile(out):
        with open(out, encoding="utf-8") as f:
            seen = {json.loads(l)["id"] for l in f if l.strip()}
    added = []
    for source, line in memory_lines(mem_dir):
        cites = citations(line, root)
        if not cites:
            continue
        cid = hashlib.sha256(line.encode()).hexdigest()[:16]
        if cid in seen:
            continue
        seen.add(cid)
        masked, findings = memfilter.scan(line, cfg, [c["path"] for c in cites])
        state = memfilter.verdict(findings)
        added.append({
            "id": cid, "source": source, "status": state,
            "text": None if state == memfilter.BLOCK else masked,
            "citations": cites, "findings": sorted({r for _, r in findings}),
        })
    if added:
        with open(out, "a", encoding="utf-8") as f:
            for c in added:
                f.write(json.dumps(c) + "\n")
    return len(added)


def list_pending(cwd):
    out = candidates_path(cwd)
    if not os.path.isfile(out):
        print("No candidates.")
        return
    with open(out, encoding="utf-8") as f:
        for line in f:
            c = json.loads(line)
            flags = ", ".join(c["findings"]) or "none"
            if c["status"] == memfilter.BLOCK:
                print(f"[{c['id']}] BLOCKED ({flags}) from {c['source']}: text withheld; rotate any exposed secret")
            else:
                print(f"[{c['id']}] {c['status'].upper()} ({flags}) from {c['source']}: {c['text']}")


def main():
    if "--list" in sys.argv:
        # PWD keeps the path the session used; getcwd() resolves symlinks such as /var on macOS.
        list_pending(os.environ.get("PWD") or os.getcwd())
        return 0
    try:
        payload = json.load(sys.stdin) if not sys.stdin.isatty() else {}
        collect(payload.get("cwd") or os.getcwd())
    except Exception:  # noqa: BLE001 - a hook must never break the session
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
