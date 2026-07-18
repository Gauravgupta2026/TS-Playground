# RAG engineering notes

Retrieval-augmented generation grounds a model's answers in your own
documents instead of its training data. The ingest side chunks documents
into sentence-aware pieces with slight overlap, embeds each chunk into a
vector, and stores vectors with source metadata. The query side embeds the
question, retrieves the top matching chunks by cosine similarity, and
builds a prompt that orders the model to answer only from those chunks.

Honesty comes from two mechanisms. Citations let every claim be traced back
to a source chunk, and the prompt's escape hatch instructs the model to say
it does not know when the sources are silent. An answer without citations
should be treated as ungrounded and rejected.
