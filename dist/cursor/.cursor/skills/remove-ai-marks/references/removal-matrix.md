# Removal matrix

| Target | Method | Script / action | Side effects | Verifiable today? |
| --- | --- | --- | --- | --- |
| Invisible Unicode / exotic spaces / bidi / tags | Strip / normalize | `inspect_text.py`, `clean_text.py`, `clean_file.py` | Minimal | Yes (codepoint report) |
| Stylometric AI cadence / burstiness / n-grams (zero-LLM) | Statistical variance & cadence scoring | `score_stylometry.py`, `inspect_text.py --stylometry`, `audit_dir.py --check-stylometry` | None (detection only) | Yes (calibrated score + phrase spans) |
| Statistical text watermark (SynthID-class / Kirchenbauer) | Multi-pass paraphrase / humanize / back-translate / structural | Agent Layer B + optional `rewrite_text.py` | Meaning/style drift | No without vendor key/detector; **MarkLLM harness** (`detect_text_watermark.py`) verifies a specific scheme config before/after |
| C2PA on PNG/JPEG/WebP/AVIF/HEIC | Drop APP11 / PNG `caBX` / RIFF `C2PA` / ISOBMFF `jumb` & `uuid` / exiftool | `clean_image.py` | Loses provenance metadata | Yes |
| GIF comment/XMP extensions | Drop 0xFE / XMP application extensions (keep `NETSCAPE2.0`) | `clean_image.py` | Loses GIF comments/XMP | Yes (re-inspect) |
| TIFF XMP/EXIF/GPS/IPTC/MakerNote (classic + BigTIFF) | Drop IFD tags, zero payloads, keep strip offsets | `clean_image.py` | Loses TIFF metadata | Yes (re-inspect) |
| BMP trailing metadata | Truncate non-image trailing bytes, fix file-size field | `clean_image.py` | Removes appended metadata | Yes (re-inspect) |
| EPUB OPF metadata / XHTML meta / embedded media | Scrub OPF, strip XHTML meta/JSON-LD, clean embedded media, Layer A (skip encrypted parts) | `clean_file.py` | Loses book metadata; rewrites archive | Yes (re-inspect) |
| SVG metadata / XMP / embedded data URIs | Drop `<metadata>`, xmpmeta; clean embedded data URIs | `clean_file.py` | Loses SVG metadata; cleans embedded rasters | Yes (re-inspect) |
| PDF XMP / info | exiftool `-all=` preferred | `clean_file.py` | Loses PDF metadata; degraded without exiftool | Partial |
| DOCX / XLSX / PPTX props / customXml / embedded media | Rewrite OOXML zip, scrub text runs, clean media/ | `clean_file.py` | Loses doc properties; cleans embedded rasters | Yes |
| ODT meta:generator | Scrub `meta.xml` | `clean_file.py` | Loses generator tag | Yes |
| HTML generator / JSON-LD / embedded data URIs | Strip tags; clean embedded data URIs | `clean_file.py` | Loses meta; cleans embedded rasters | Yes |
| Markdown AI frontmatter keys / embedded data URIs | Drop keys; clean embedded data URIs | `clean_file.py` | Loses YAML keys; cleans embedded rasters | Yes |
| Pixel image watermark (SynthID-media / StegaStamp / Tree-Ring / StableSignature) | CtrlRegen regeneration (external backend) | `clean_ctrlregen.py` / `clean_image.py --remove-pixel ctrlregen` | Regenerates pixels; heavy compute; detail drift at higher strength | No without official detector; reverse-SynthID score is a local surrogate; **MarkDiffusion same-scheme harness** (`markdiffusion_harness.py detect`) verifies a Tree-Ring-class scheme config before/after |
| Pixel image watermark (Tree-Ring-class) | DiffusionPurification regeneration (external MarkDiffusion backend) | `clean_image.py --remove-pixel diffusion` | Blind regeneration; more drift than CtrlRegen; heavy compute | Same-scheme only via the MarkDiffusion harness (not a vendor-detector oracle) |
| Audio / video watermarks (SynthID-media) | — | Out of scope | — | — |
| C2PA soft binding (in-content link to manifest) | — | Out of scope (survives our metadata strip) | — | Vendor detector only |
| Data-driven model backdoors | — | Out of scope | — | — |

## Default pipeline

1. **Inspect** (`inspect_file.py` or specific inspect_*).
2. **Deterministic clean** — Layer A text and/or container/image metadata; for images, optionally add pixel removal (`--remove-pixel ctrlregen`) after the metadata strip.
3. **Always offer Layer B** rewrite for prose (paraphrase → optional strong pass: `humanize` / back-translate / structural).
4. Prefer a **non-origin, open-weight** rewrite model when available (avoid re-stamping).
5. Layer A again after rewrite.
6. Report: Layer B is best-effort; residual risk remains.
7. **Optional verification:** `rewrite_text.py --markllm-scheme kgw|synthid` runs a MarkLLM before/after detection (external `detect_text_watermark.py` harness) to show a specific scheme config clears. Same-config-only; not a vendor-detector oracle.

## Code vs prose

- **Prose / Markdown / HTML body:** full A + B.
- **Code:** Layer A + formatter; statistical marks are weak; offer `code` rewrite (comments/docstrings/string-literal wording + local identifier renames) with user OK.

## Layer B strengths

| Strength | When |
| --- | --- |
| `paraphrase` | Default; explicit word-choice + syntax churn |
| `humanize` | Zero-shot "write like a human" token reshuffle |
| `backtranslate` | Stronger token reshuffle via pivot language |
| `structural` | Strongest; most drift (outline → human prose) |
| `code` | Comments/docstrings/string-literal wording + local identifier renames |

Frontier production watermarks are currently **token-by-token** (streaming
constraint); paragraph-level robust methods (SemStamp / PostMark) are not yet
deployed, so paraphrase-class attacks remain effective today.

## Sources

- Bidi controls: Unicode Consortium, UAX #9 "Unicode Bidirectional Algorithm", https://www.unicode.org/reports/tr9/
- Green-list watermark (Kirchenbauer / KGW): John Kirchenbauer et al., "A Watermark for Large Language Models", 2023, https://arxiv.org/abs/2301.10226
- C2PA / Content Credentials: Coalition for Content Provenance and Authenticity, C2PA Technical Specification, https://c2pa.org/specifications/
- ISOBMFF: ISO/IEC 14496-12, "ISO base media file format"
- JUMBF: ISO/IEC 19566-5, "JPEG universal metadata box format"
- Exif: CIPA, DC-008 "Exchangeable image file format for digital still cameras", Exif Version 3.0, 2023, https://www.cipa.jp/e/std/std-sec.html
- XMP: ISO 16684-1, "Extensible Metadata Platform (XMP)"
- IPTC: IPTC, Photo Metadata Standard, https://iptc.org/standards/photo-metadata/
- EPUB OPF: W3C, "EPUB 3.3", 2023, https://www.w3.org/TR/epub-33/
- JSON-LD: W3C, "JSON-LD 1.1", 2020, https://www.w3.org/TR/json-ld11/
- OOXML: Ecma International, ECMA-376 "Office Open XML File Formats", https://ecma-international.org/publications-and-standards/standards/ecma-376/
- Tree-Ring watermark: Yuxin Wen et al., "Tree-Ring Watermarks: Fingerprints for Diffusion Images that are Invisible and Robust", 2023, https://arxiv.org/abs/2305.20030
- StegaStamp: Matthew Tancik et al., "StegaStamp: Invisible Hyperlinks in Physical Photographs", 2019, https://arxiv.org/abs/1904.05343
- Stable Signature: Pierre Fernandez et al., "The Stable Signature: Rooting Watermarks in Latent Diffusion Models", 2023, https://arxiv.org/abs/2303.15435
- CtrlRegen: Yepeng Liu et al., "Image Watermarks are Removable Using Controllable Regeneration from Clean Noise", 2024, https://arxiv.org/abs/2410.05470
- SynthID: Google DeepMind, SynthID, https://deepmind.google/technologies/synthid/
- MarkDiffusion: Leyi Pan et al., "MarkDiffusion: An Open-Source Toolkit for Generative Watermarking of Latent Diffusion Models", 2025, https://arxiv.org/abs/2509.10569
- MarkLLM: Leyi Pan et al., "MarkLLM: An Open-Source Toolkit for LLM Watermarking", 2024, https://arxiv.org/abs/2405.10051
- SemStamp: Abe Bohan Hou et al., "SemStamp: A Semantic Watermark with Paraphrastic Robustness for Text Generation", 2023, https://arxiv.org/abs/2310.03991
- PostMark: Yapei Chang et al., "PostMark: A Robust Blackbox Watermark for Large Language Models", 2024, https://arxiv.org/abs/2406.14517
- Paraphrase attack on watermarks: Kalpesh Krishna et al., "Paraphrasing evades detectors of AI-generated text, but retrieval is an effective defense", 2023, https://arxiv.org/abs/2303.13408
