# Agent patterns

An agent is a loop around a model with tools, a role prompt, and private
memory. Multi-agent systems compose focused agents instead of one
overloaded prompt: a planner decomposes the question, a researcher gathers
evidence, a writer drafts, and a critic reviews the draft against the
evidence. Agents exchange structured, schema-validated messages, never raw
prose, so drift in one stage cannot silently corrupt the next.

Guardrails make autonomy affordable: every run carries a shared token
budget, every loop has a maximum number of rounds, and exhausting either
returns an explicit failure instead of shipping an unreviewed draft.
