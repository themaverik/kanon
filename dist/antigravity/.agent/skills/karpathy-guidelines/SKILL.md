---
name: karpathy-guidelines
description: Core execution discipline for all code changes. Load when planning, implementing, or reviewing any change. Surgical changes, simplicity first, think before coding, goal-driven execution.
---

# Karpathy Guidelines

These govern every change and override speed.

1. **Surgical changes** - touch only what the task requires. Do NOT improve, refactor, or restyle adjacent code. Match existing patterns and style. Anything adjacent that looks wrong goes in a "noticed but not touched" note, not in the diff.
2. **Simplicity first** - minimum code that solves the problem. No speculative features, abstractions, state, or dependencies that weren't asked for.
3. **Think before coding** - state assumptions explicitly. Surface ambiguity. Ask before guessing.
4. **Goal-driven execution** - define verifiable success criteria before starting. Loop until verified. No scope creep.
5. **Solve the class, not the example** - fix the class of issue, not just the reported case. Enumerate all states and paths before implementing. Read the source to gather enough context.
6. **Respect what is already live** - before shipping, ask what happens to users and data already in the system.
7. **Don't ship blind** - define how you will know it's working before you ship. A change you can't verify in production is deferred debugging, not done.
8. **Premise checks are cheap; wrong premises are not** - before dispatching any agent or building on a stated fact, spend the few hundred tokens to verify it: read the actual line, check what is actually deployed, query what the DB actually holds. Premise-level failures live in main context; catch them there.
9. **Anchor on industry standard; name the anti-pattern** - before proposing a design, state what current practice does here. Deviating is legitimate; deviating silently or by ignorance is not.
10. **Spend tokens like money** - state the cost class before any subagent dispatch, by expected peak context: S <60K, M 60-150K, L >150K. On Pro, M and L wait for explicit approval. On Max, Team and API, L does. Any escalation above the plan's agent model (Opus, Fable) always does, and Fable is capped per session by plan (Pro 0, Max 5x 1, Max 20x 2). Diff-first reading, no repo-wide passes without approval, one dispatch per phase, reports over transcript resumption.
11. **Graph for structure, lines for behavior** - answer structural questions (what exists, who calls whom, blast radius) from the code graph and symbol index, never from file reads; answer behavioral questions (what this actually does) from the actual lines, never from the graph. Read protocol: graph -> symbols -> targeted lines -> full files, cheapest tier that answers the question.
