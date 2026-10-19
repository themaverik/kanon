export const DEFAULT_TEMPLATE_NAME = 'discipline'
export const DEFAULT_TEMPLATE = 'Use the discipline staff-engineer + {{reviewer}} + karpathy skills + "{{task}}"'

export const AREA_LABELS = ['backend', 'frontend', 'fullstack'] as const
export type Area = (typeof AREA_LABELS)[number]

const REVIEWERS: Record<Area, string> = {
  backend: 'backend-architect',
  frontend: 'frontend-developer',
  fullstack: 'backend-architect + frontend-developer',
}
const UNKNOWN_REVIEWER = 'backend-architect/frontend-developer'

export const REWRITE_SYSTEM = [
  'You rewrite a draft prompt that a developer will send to a coding agent.',
  'Make it sharper: one clear goal, the scope, constraints and the success check, but only where the draft states or plainly implies them.',
  'Keep every fact, file path, identifier and number exactly. Never invent requirements.',
  'A fixed prefix already names the agents, skills and process, so remove every such mention from the draft:',
  'agent or reviewer names, "the discipline", "karpathy", "skills", and phrases like "using the X approach".',
  'Keep only what to do and to what.',
  'Reply with the rewritten prompt only: no preamble, no quotes, no markdown heading.',
].join('\n')

const PROCESS_TERM = String.raw`(?:the\s+)?(?:discipline|karpathy(?:\s+skills?)?|[\w-]+[\s-](?:engineer|developer|architect)s?|staff-engineer|backend-architect|frontend-developer)`
const PROCESS_PHRASE = new RegExp(
  String.raw`\s*,?\s*\b(?:using|with|via|following|per|applying)\s+${PROCESS_TERM}(?:\s*(?:\+|and|,)\s*${PROCESS_TERM})*(?:\s+(?:approach|skills?|process|workflow))?\b`,
  'gi',
)

/** Backstop for the rewrite: the template already names agents and process, so a repeat in the task is noise. */
export function stripProcessWording(task: string): string {
  return task.replace(PROCESS_PHRASE, '').replace(/\s+([.,;:!?])/g, '$1').trim()
}

export function reviewerFor(area: string | undefined): string {
  return area !== undefined && area in REVIEWERS ? REVIEWERS[area as Area] : UNKNOWN_REVIEWER
}

/** Text before the first placeholder; a draft opening with it was already enhanced. */
export function templatePrefix(template: string): string {
  return (template.split('{{')[0] ?? '').trim()
}

export function isEnhanced(draft: string, template: string): boolean {
  const prefix = templatePrefix(template)
  return prefix.length > 0 && draft.trimStart().startsWith(prefix)
}

export function applyTemplate(template: string, reviewer: string, task: string): string {
  const withReviewer = template.split('{{reviewer}}').join(reviewer)
  return withReviewer.includes('{{task}}')
    ? withReviewer.split('{{task}}').join(task)
    : `${withReviewer.trimEnd()} ${task}`
}

/** Template names are file stems; anything else could escape the templates folder. */
export function templateName(args: string): string | null {
  const name = args.trim() || DEFAULT_TEMPLATE_NAME
  return /^[\w-]+$/.test(name) ? name : null
}
