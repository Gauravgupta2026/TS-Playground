# Capstone reference implementation

These files are drop-in replacements for `capstone/src/`. They keep the
same relative imports, so to run them against the tests:

```bash
# back up your work first!
cp capstone/src/rag.ts capstone/src/rag.mine.ts   # etc.
cp solutions/capstone/src/*.ts capstone/src/
npm test capstone/tests/crew.test.ts
```

Then restore your own files and keep going. (The usual rule: read, close,
rewrite from memory.)
