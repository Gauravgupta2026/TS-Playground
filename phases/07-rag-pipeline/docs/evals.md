# Eval notes

Retrieval quality is measured with labeled query-to-document pairs.
Recall at k asks whether any correct document appears in the top k results.
Mean reciprocal rank rewards ranking the first correct document as high as
possible. Track both metrics on a fixed labeled set before and after every
change to chunking, embeddings, or k.
