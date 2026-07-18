# RAG notes

Retrieval-augmented generation grounds model answers in your own documents.
Chunk documents into sentence-aware pieces of a few hundred words with a
little overlap. Small focused chunks embed better than whole files. Always
attach source metadata to every chunk so answers can cite their evidence.
When retrieval returns nothing relevant, the prompt should tell the model
to admit it does not know.
