---
name: source-register-and-provenance
description: Use when a draft and its source documents have just been submitted for a Claim Check and the sources have not yet been registered. Turns raw source material into a source register with an id, type, and traceable location for each one.
---

# Source Register and Provenance

For every source you've been given, capture:

- **Source ID** — short, stable (e.g. `src_01`)
- **Title / name**
- **Source type** — client document, web page, dataset, prior published
  piece, etc.
- **Origin** — where it came from, who provided it
- **Effective date** — when it was published or last true
- **Scope and limitations** — what it does and doesn't cover (a regional
  price list isn't evidence for a global claim)
- **Full text** — the actual content, verbatim, that `evidence-matcher`
  will pass to `verify_excerpt`

Do not assign a source credibility because the name sounds authoritative.
Note what it actually supports and what it doesn't.

Output a source register — a short table, one row per source — before
moving to claim extraction.
