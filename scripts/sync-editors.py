#!/usr/bin/env python3
"""Emit Cursor / VS Code Copilot / Antigravity configs from the canonical
kanon standard into a target repo. The plugin marketplace stays the
single source of truth; run this after updating it (or in CI) to keep the
other editors in sync.

Usage:
  python3 scripts/sync-editors.py --repo /path/to/repo \
      --stacks java,ts,web,rust,tools --tools claude,cursor,vscode,antigravity [--legacy-agent-dir]

Mapping:
  rules/*.md (paths: frontmatter) -> .claude/rules/kanon/ (Claude Code loads by path; plugins can't ship rules)
                                     unscoped ones -> .claude/kanon/rules/ (read on demand by the router skills)
                                  -> .cursor/rules/*.mdc (globs)
                                  -> .github/instructions/*.instructions.md (applyTo)
                                  -> .agents/rules/*.md (trigger: glob)
  skills/  (open SKILL.md std)    -> .cursor/skills/, .github/skills/, .agents/skills/  (verbatim copy)
  agents/                         -> .github/agents/<n>.agent.md (VS Code custom agents)
                                  -> persona skills for Cursor + Antigravity
  .mcp.json (serena)              -> .cursor/mcp.json, .vscode/mcp.json, .agents/mcp_config.json
  references/                     -> .kanon/references/ (rules point here; same text for every editor)
  AGENTS.md                       -> read natively by all three (copy template if absent)
Not ported (documented in Editor-Parity.md): Claude hooks (enforcement parity
comes from git hooks + CI), opus model pinning, plugin marketplace, native memory.
"""
import argparse, json, re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PLUGDIR = ROOT / "plugins"
ANTIGRAVITY_RULE_LIMIT = 12000

def plugin_dirs(stacks):
    prefix = next(PLUGDIR.glob("*-core")).name.rsplit("-core", 1)[0]
    wanted = ["core"] + stacks
    return [(s, PLUGDIR / f"{prefix}-{s}") for s in wanted if (PLUGDIR / f"{prefix}-{s}").is_dir()]

def parse_frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not m: return {}, text
    fm, body = m.group(1), m.group(2)
    paths = re.findall(r'-\s*"([^"]+)"', fm)
    name = re.search(r"^name:\s*(.+)$", fm, re.M)
    desc = re.search(r"^description:\s*(.+)$", fm, re.M)
    return {"paths": paths, "name": name and name.group(1).strip(),
            "description": desc and desc.group(1).strip()}, body

def iter_rules(dirs):
    for stack, d in dirs:
        rd = d / "rules"
        if not rd.is_dir(): continue
        for f in sorted(rd.rglob("*.md")):
            fm, body = parse_frontmatter(f.read_text(encoding="utf-8"))
            slug = f"{stack}-{f.relative_to(rd).with_suffix('').as_posix().replace('/', '-')}"
            yield slug, fm.get("paths") or [], body.strip()

def title_of(body, slug):
    m = re.search(r"^#\s+(.+)$", body, re.M)
    return (m.group(1) if m else slug).strip()

def write(p, s):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(s, encoding="utf-8")
    print(f"  wrote {p}")

def copy_tree(src, dst):
    if dst.exists(): shutil.rmtree(dst)
    shutil.copytree(src, dst, ignore=shutil.ignore_patterns(".DS_Store"))
    print(f"  copied {dst}")

def emit_claude(repo, dirs):
    # Unscoped rules would load every session in .claude/rules, so they stay out of it.
    for d in (repo / ".claude/rules/kanon", repo / ".claude/kanon/rules"):
        if d.exists(): shutil.rmtree(d)
    for stack, d in dirs:
        rd = d / "rules"
        if not rd.is_dir(): continue
        for f in sorted(rd.rglob("*.md")):
            text = f.read_text(encoding="utf-8")
            base = ".claude/rules/kanon" if parse_frontmatter(text)[0].get("paths") else ".claude/kanon/rules"
            write(repo / base / stack / f.relative_to(rd), text)

def emit_cursor(repo, dirs):
    for slug, globs, body in iter_rules(dirs):
        fm = ["---", f"description: {title_of(body, slug)}"]
        fm += ([f"globs: {','.join(globs)}", "alwaysApply: false"] if globs else ["alwaysApply: false"])
        fm.append("---")
        write(repo / ".cursor/rules" / f"{slug}.mdc", "\n".join(fm) + "\n\n" + body + "\n")
    for stack, d in dirs:
        sd = d / "skills"
        if sd.is_dir():
            for sk in sorted(p for p in sd.iterdir() if p.is_dir()):
                copy_tree(sk, repo / ".cursor/skills" / sk.name)
    emit_persona_skills(repo / ".cursor/skills", dirs)
    emit_mcp(repo / ".cursor/mcp.json", dirs)

def emit_vscode(repo, dirs):
    gh = repo / ".github"
    for slug, globs, body in iter_rules(dirs):
        apply_to = ",".join(globs) if globs else "**"
        write(gh / "instructions" / f"{slug}.instructions.md",
              f'---\napplyTo: "{apply_to}"\n---\n\n{body}\n')
    for stack, d in dirs:
        sd = d / "skills"
        if sd.is_dir():
            for sk in sorted(p for p in sd.iterdir() if p.is_dir()):
                copy_tree(sk, gh / "skills" / sk.name)
    core = dict(dirs)["core"]
    for ag in sorted((core / "agents").glob("*.md")):
        fm, body = parse_frontmatter(ag.read_text(encoding="utf-8"))
        write(gh / "agents" / f"{ag.stem}.agent.md",
              f"---\nname: {fm.get('name') or ag.stem}\ndescription: {fm.get('description','')}\n---\n\n{body.strip()}\n")
    for stack, d in dirs:
        if stack == "core": continue
        for ag in sorted((d / "agents").glob("*.md")) if (d / "agents").is_dir() else []:
            fm, body = parse_frontmatter(ag.read_text(encoding="utf-8"))
            write(gh / "agents" / f"{ag.stem}.agent.md",
                  f"---\nname: {fm.get('name') or ag.stem}\ndescription: {fm.get('description','')}\n---\n\n{body.strip()}\n")
    if not (gh / "copilot-instructions.md").exists():
        write(gh / "copilot-instructions.md",
              "Follow AGENTS.md at the repository root. It is the canonical engineering "
              "standard for this repo; scoped rules live in .github/instructions/.\n")
    emit_mcp(repo / ".vscode/mcp.json", dirs, wrap_key="servers")

def emit_antigravity(repo, dirs, legacy=False):
    base = repo / (".agent" if legacy else ".agents")
    for slug, globs, body in iter_rules(dirs):
        fm = ["---"]
        fm += ([f"trigger: glob", f"globs: {','.join(globs)}"] if globs
               else ["trigger: model_decision", f"description: {title_of(body, slug)}"])
        fm.append("---")
        content = "\n".join(fm) + "\n\n" + body + "\n"
        if len(content) > ANTIGRAVITY_RULE_LIMIT:
            print(f"  WARN {slug}: {len(content)} chars exceeds Antigravity's {ANTIGRAVITY_RULE_LIMIT}-char rule limit; split it", file=sys.stderr)
        write(base / "rules" / f"{slug}.md", content)
    for stack, d in dirs:
        sd = d / "skills"
        if sd.is_dir():
            for sk in sorted(p for p in sd.iterdir() if p.is_dir()):
                copy_tree(sk, base / "skills" / sk.name)
    emit_persona_skills(base / "skills", dirs)
    emit_mcp(base / "mcp_config.json", dirs)

def emit_persona_skills(skills_root, dirs):
    """Agents -> persona skills for tools whose subagent schema differs.
    The charter travels; model pinning and tool restriction stay prompt-level."""
    for stack, d in dirs:
        ad = d / "agents"
        if not ad.is_dir(): continue
        for ag in sorted(ad.glob("*.md")):
            fm, body = parse_frontmatter(ag.read_text(encoding="utf-8"))
            name = fm.get("name") or ag.stem
            write(skills_root / f"persona-{name}" / "SKILL.md",
                  f"---\nname: persona-{name}\ndescription: Adopt the {name} charter. "
                  f"{fm.get('description','')}\n---\n\n"
                  f"Act strictly under this charter for the current task:\n\n{body.strip()}\n")

def emit_mcp(dest, dirs, wrap_key="mcpServers"):
    core = dict(dirs)["core"]
    src = json.loads((core / ".mcp.json").read_text())
    servers = src.get("mcpServers", {})
    write(dest, json.dumps({wrap_key: servers}, indent=2) + "\n")

def emit_codex(repo, dirs):
    """Codex CLI: AGENTS.md native; skills via the open SKILL.md standard.
    Project skills dir: .codex/skills (verify against your Codex version;
    global fallback ~/.codex/skills)."""
    for stack, d in dirs:
        sd = d / "skills"
        if sd.is_dir():
            for sk in sorted(p for p in sd.iterdir() if p.is_dir()):
                copy_tree(sk, repo / ".codex/skills" / sk.name)
    emit_persona_skills(repo / ".codex/skills", dirs)

def emit_references(repo, dirs):
    dst = repo / ".kanon/references"
    if dst.exists(): shutil.rmtree(dst)
    for stack, d in dirs:
        if (d / "references").is_dir():
            shutil.copytree(d / "references", dst, dirs_exist_ok=True,
                            ignore=shutil.ignore_patterns(".DS_Store"))
    print(f"  copied {dst}")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--stacks", default="", help="comma list: java,java-airails,ts,web,rust,tools")
    ap.add_argument("--tools", default="cursor,vscode,antigravity,codex")
    ap.add_argument("--legacy-agent-dir", action="store_true",
                    help="Antigravity: also emit legacy .agent/ (singular) for pre-rename installs")
    a = ap.parse_args()
    repo = Path(a.repo).resolve()
    if not repo.is_dir(): sys.exit(f"not a directory: {repo}")
    stacks = [s for s in a.stacks.split(",") if s]
    dirs = plugin_dirs(stacks)
    tools = set(a.tools.split(","))
    if "claude" in tools:     print("== Claude Code"); emit_claude(repo, dirs)
    if "codex" in tools:      print("== Codex");       emit_codex(repo, dirs)
    if "cursor" in tools:      print("== Cursor");      emit_cursor(repo, dirs)
    if "vscode" in tools:      print("== VS Code");     emit_vscode(repo, dirs)
    if "antigravity" in tools:
        print("== Antigravity (.agents/)"); emit_antigravity(repo, dirs, legacy=False)
        if a.legacy_agent_dir:
            print("== Antigravity legacy (.agent/)"); emit_antigravity(repo, dirs, legacy=True)
    emit_references(repo, dirs)
    core = dict(dirs)["core"]
    tpl = core / "templates" / "AGENTS.md"
    if tpl.exists() and not (repo / "AGENTS.md").exists():
        shutil.copy(tpl, repo / "AGENTS.md"); print(f"  wrote {repo/'AGENTS.md'} (fill placeholders)")
    print("\nDone. Enforcement backbone (all editors): scripts/install-githooks.sh "
          "+ CI verifiers. See Editor-Parity.md for what does not port.")

if __name__ == "__main__":
    main()
