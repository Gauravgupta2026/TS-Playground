# Evaluation notes

Evals grade model outputs across labeled cases and report pass rates, which
makes prompt and model changes safe to ship. Retrieval gets its own
metrics: recall at k asks whether a correct document appears in the top k
results, and mean reciprocal rank rewards ranking the first correct
document highest. Faithfulness checks confirm that each claim in a
generated answer carries a citation resolving to a retrieved chunk.
Compare scorecards before and after every change; a regression can hide
inside an unchanged average when a previously passing case starts failing.
