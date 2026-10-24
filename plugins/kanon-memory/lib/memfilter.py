"""Content filter for shared memory: block secrets, mask personal data, hold sensitive entries.

Findings never carry the matched value, only the rule name, so reports cannot leak what they found.
"""
import json
import math
import os
import re
import unicodedata

BLOCK, MASK, HOLD = "block", "mask", "hold"

SECRET_RULES = [
    ("aws-access-key", re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b")),
    ("github-token", re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})\b")),
    ("slack-token", re.compile(r"\bxox[abposr]-[A-Za-z0-9-]{10,}\b")),
    ("stripe-key", re.compile(r"\b[sr]k_live_[A-Za-z0-9]{16,}\b")),
    ("google-api-key", re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b")),
    ("llm-api-key", re.compile(r"\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}\b")),
    ("private-key", re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----")),
    ("jwt", re.compile(r"\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}")),
    ("credential-url", re.compile(r"\b[a-z][a-z0-9+.-]*://[^\s/:@]+:[^\s/@]+@")),
    ("assigned-secret", re.compile(
        r"(?i)\b(?:password|passwd|secret|token|api[_-]?key|access[_-]?key)\b\s*[:=]\s*['\"]?(?!<|\$\{)[^\s'\"]{8,}")),
]

# GSTIN contains a PAN, so it runs first and the PAN rule sees only the placeholder.
PII_RULES = [
    ("EMAIL", re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")),
    ("GSTIN", re.compile(r"\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b")),
    ("PAN", re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b")),
    ("IFSC", re.compile(r"\b[A-Z]{4}0[A-Z0-9]{6}\b")),
    ("VOTER_ID", re.compile(r"\b[A-Z]{3}\d{7}\b")),
    ("PHONE_IN", re.compile(r"(?<![\w.])(?:\+91[\s-]?|0)?[6-9]\d{9}\b")),
    ("IP", re.compile(r"\b(?!127\.0\.0\.1\b)(?!0\.0\.0\.0\b)(?:\d{1,3}\.){3}\d{1,3}\b")),
]
AADHAAR = re.compile(r"\b[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}\b")

DEFAULT_CONFIG = {
    "sensitive_paths": ["data/", "fixtures/real/", "seeds/prod/"],
    "sensitive_keywords": ["case no", "fir no", "court order", "affidavit"],
    "expiry_days": 90,
}

# Verhoeff tables: Aadhaar's last digit is a Verhoeff checksum, so only valid numbers are masked.
_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7], [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3], [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
]
_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7], [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
]


def verhoeff_valid(digits):
    c = 0
    for i, ch in enumerate(reversed(digits)):
        c = _D[c][_P[i % 8][int(ch)]]
    return c == 0


def load_config(repo_root):
    cfg = dict(DEFAULT_CONFIG)
    path = os.path.join(repo_root, ".kanon-memory.json") if repo_root else ""
    if path and os.path.isfile(path):
        with open(path, encoding="utf-8") as f:
            cfg.update(json.load(f))
    return cfg


def _entropy(s):
    counts = {c: s.count(c) for c in set(s)}
    return -sum(n / len(s) * math.log2(n / len(s)) for n in counts.values())


def _high_entropy(text):
    # Slashes split tokens so file paths never count; a key mixes upper, lower and digits.
    for tok in re.findall(r"[A-Za-z0-9+=_-]{32,}", text):
        mixed = all(re.search(c, tok) for c in (r"[A-Z]", r"[a-z]", r"\d"))
        if mixed and _entropy(tok) > 4.2:
            return True
    return False


def scan(text, cfg=None, cited_paths=()):
    """Return (masked_text, findings). findings: list of (action, rule)."""
    cfg = cfg or DEFAULT_CONFIG
    findings = []
    if any(unicodedata.category(ch) == "Cf" for ch in text):
        findings.append((BLOCK, "invisible-unicode"))
    for rule, rx in SECRET_RULES:
        if rx.search(text):
            findings.append((BLOCK, rule))
    if not any(a == BLOCK and r != "invisible-unicode" for a, r in findings) and _high_entropy(text):
        findings.append((BLOCK, "high-entropy-string"))

    masked = text
    for m in list(AADHAAR.finditer(masked)):
        if verhoeff_valid(re.sub(r"\D", "", m.group())):
            masked = masked.replace(m.group(), "<AADHAAR>")
            findings.append((MASK, "AADHAAR"))
    for rule, rx in PII_RULES:
        masked, n = rx.subn(f"<{rule}>", masked)
        if n:
            findings.append((MASK, rule))

    lowered = text.lower()
    for kw in cfg.get("sensitive_keywords", []):
        if kw.lower() in lowered:
            findings.append((HOLD, f"keyword:{kw}"))
    for p in cited_paths:
        for prefix in cfg.get("sensitive_paths", []):
            if p.startswith(prefix) or f"/{prefix}" in f"/{p}":
                findings.append((HOLD, f"path:{prefix}"))
    return masked, findings


def verdict(findings):
    actions = {a for a, _ in findings}
    if BLOCK in actions:
        return BLOCK
    if HOLD in actions:
        return HOLD
    return MASK if MASK in actions else "clean"
