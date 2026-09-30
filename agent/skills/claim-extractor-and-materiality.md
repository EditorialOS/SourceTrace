---
name: claim-extractor-and-materiality
description: Use after sources are registered, to pull every material factual claim out of the draft before evidence matching begins. Splits compound claims apart and ranks them by how much weight they carry.
---

# Claim Extractor and Materiality

Read the draft and pull out every statement that asserts a fact — not
opinion, not framing, not a rhetorical flourish.

For each one, preserve:

- **Exact wording**, copied verbatim from the draft
- **Location** in the draft (which section or paragraph)
- **Materiality**, using this scale:

| Level | Meaning | Default treatment |
|---|---|---|
| Critical | Central to safety, legality, price, availability, or public trust | Must be verified or escalated |
| Material | Meaningfully shapes the reader's understanding | Must be verified, qualified, or removed |
| Supporting | Useful detail, not central to the piece's core claim | Check if a source exists; flag if not |
| Opinion / framing | Subjective, not a checkable fact | Mark `NOT_APPLICABLE`, skip verification |

Split compound claims into atomic ones. "Our Starter plan is $49/month and
includes 5 seats" is two separate, separately-checkable claims — a price
and a seat count — not one.

Hand the full claim list, in this shape, to `evidence-matcher`.
