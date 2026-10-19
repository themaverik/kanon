#!/usr/bin/env python3
"""Rename the 'kanon' placeholder to your real org prefix.

Replaces the token in file/directory names AND file contents, plus the
ORG_PLACEHOLDER author field. Run from anywhere; operates on the repo root
containing this script's parent.

Usage:
  python3 scripts/rename.py --prefix kanon --org "Kanon" [--dry-run]

Result: marketplace 'kanon', plugins 'kanon-core', 'kanon-java',
'kanon-ts', 'kanon-web'; all JSON/MD references updated.
"""
import argparse, sys
from pathlib import Path

TOKEN = "kanon"
ORG_TOKEN = "ORG_PLACEHOLDER"
TEXT_EXT = {".md", ".json", ".sh", ".py", ".yml", ".yaml", ".txt", ".html", ".mdc", ".toml"}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prefix", required=True, help="real plugin prefix, e.g. kanon (lowercase, hyphens)")
    ap.add_argument("--org", default=None, help="org display name for author fields (default: prefix)")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    prefix, org = a.prefix.strip(), (a.org or a.prefix).strip()
    if not prefix or " " in prefix or prefix != prefix.lower():
        sys.exit("prefix must be non-empty, lowercase, no spaces (e.g. kanon)")
    if TOKEN in prefix:
        sys.exit("prefix must not contain the placeholder token itself")

    root = Path(__file__).resolve().parent.parent
    changed_files = renamed = 0

    # 1) contents first (paths still stable)
    for p in sorted(root.rglob("*")):
        if not p.is_file() or p.suffix not in TEXT_EXT:
            continue
        rel = p.relative_to(root)
        if rel.parts and rel.parts[0] == "scripts":
            continue  # scripts define/consume the token itself
        if True:
            try:
                s = p.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            new = s.replace(TOKEN, prefix).replace(ORG_TOKEN, org)
            if new != s:
                changed_files += 1
                print(f"content: {p.relative_to(root)}")
                if not a.dry_run:
                    p.write_text(new, encoding="utf-8")

    # 2) rename paths, deepest first so parents stay valid
    paths = [p for p in root.rglob("*") if TOKEN in p.name]
    for p in sorted(paths, key=lambda q: len(q.parts), reverse=True):
        target = p.with_name(p.name.replace(TOKEN, prefix))
        renamed += 1
        print(f"rename:  {p.relative_to(root)} -> {target.name}")
        if not a.dry_run:
            p.rename(target)

    print(f"\n{'DRY RUN: ' if a.dry_run else ''}{changed_files} files updated, {renamed} paths renamed.")
    if not a.dry_run:
        leftovers = [str(q.relative_to(root)) for q in root.rglob("*")
                     if q.is_file() and q.suffix in TEXT_EXT
                     and q.relative_to(root).parts[0] != "scripts"
                     and (TOKEN in q.read_text(encoding="utf-8", errors="ignore")
                          or ORG_TOKEN in q.read_text(encoding="utf-8", errors="ignore"))]
        print("leftover placeholder files:", leftovers or "none")

if __name__ == "__main__":
    main()
