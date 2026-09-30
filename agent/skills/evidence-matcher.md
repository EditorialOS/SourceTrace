---
name: evidence-matcher
description: Use once claims are extracted and sources are registered, to link each claim to its source and run the code-level verification check. This is the step that actually confirms or rejects a claim — do not skip calling the tool.
---

# Evidence Matcher

For every claim marked Critical, Material, or Supporting:

1. Identify which registered source it's supposed to rest on. If no source
   was supplied for this claim, record it `UNVERIFIED` immediately — do not
   call the tool with an empty or invented source.
2. Call `verify_excerpt` with:
   - `source_id`: the source's id from the register
   - `source_text`: that source's full registered text
   - `claimed_excerpt`: the exact verbatim span that carries the checkable
     fact — the figure and what it describes — and nothing more. Do not fold a
     time window, date range, or scope qualifier ("over the past year", "since
     launch") into the span you verify: check the factual core against the
     source, and record any qualifier the source does not actually support as
     its own separate `UNVERIFIED` claim. `verify_excerpt` hard-fails any
     excerpt whose numbers are absent from the source, so keep every figure exact.
3. Record the tool's `verified`, `verification_method`, and `similarity`
   fields exactly as returned. Do not round up an `unverifiable` result
   because the claim "seems right." Do not downgrade a `verified: true`
   result either — the tool's answer is the answer.

## Conflicts

If two registered sources give materially different answers for the same
claim (a price, a date, a figure), mark it `CONTRADICTED` and note both
sources. Do not average them or pick the more convenient one.

## Handling Source-vs-Claim Contradiction

When `verify_excerpt` returns `unverifiable` for a claim, call
`check_contradiction` with the same `source_id`, `source_text`, and the claim's
exact wording.

- `CONTRADICTS` (with a quoted span) -> record the claim as `CONTRADICTED` and
  attach the span. This is distinct from, and outranks, `UNVERIFIED`.
- `NO_CONFLICT` -> the claim stays `UNVERIFIED`.

`check_contradiction` can only fail a claim. Never use its result to upgrade a
claim's status. A claim reaches VERIFIED only through `verify_excerpt`.

## What this skill does not do

It does not decide whether the draft should publish, and it does not
resolve a contradiction by choosing a side — that's a human call. It
produces one verification result per claim and passes the full set to
`evidence-report-and-release-gate`.
