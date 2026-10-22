# Vendored Skills

All ten skills in this plugin are vendored unchanged from upstream. Full license texts are in `../LICENSES/`.

| Skills | Upstream | Commit | License |
|---|---|---|---|
| design-taste-frontend (tasteskill v2) | https://github.com/Leonxlnx/taste-skill | `6010f91` | MIT, Copyright (c) 2026 Leonxlnx |
| impeccable | https://github.com/pbakaus/impeccable (`.claude/skills/impeccable`) | `dad8dbb` | Apache 2.0, with its third-party notices in `impeccable-notice.md` |
| animate, animation-performance, animation-vocabulary, break-ui, emil-design-eng, find-animation-opportunities, improve-animations, review-animations | https://github.com/emilkowalski/skills | `2d22863` | MIT, Copyright (c) 2026 Emil Kowalski |

impeccable bundles two more MIT works, with their license texts in `../LICENSES/`:

- `impeccable/scripts/modern-screenshot.umd.js`: https://github.com/qq15725/modern-screenshot (`modern-screenshot-MIT.txt`)
- `impeccable/reference/ios.md` and `android.md`, distilled from https://github.com/ehmo/platform-design-skills (`platform-design-skills-MIT.txt`)

To update, copy the skill folders from a newer upstream commit and change the commit column. No local edits to re-apply.

The skill text names upstream skills Kanōn does not vendor, such as Emil Kowalski's `animate-expo`, `apple-design`, `ask-sonner`, `pick-ui-library` and `prototype`. Those mentions do not resolve here. Install them upstream if you need them.

Photographs, fonts and pictures the design-taste-frontend scripts fetch keep their own licences. See that skill's `README.md`.
