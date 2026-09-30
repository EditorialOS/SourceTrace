# check_contradiction — calibration fixture (manual check)

The repo has no runnable test harness (no `test` script in `package.json`), so
these are documented manual checks. Run them through the deployed MCP endpoint,
or by calling `check_contradiction` / `verify_excerpt` directly.

The point of the fix: a claim the source **affirmatively contradicts** must land
on `CONTRADICTED`, distinct from `UNVERIFIED` (source merely silent) and from
`VERIFIED` (source supports it). Three distinct verdicts where two used to collide.

```
source: "The Eiffel Tower is a lattice tower on the Champ de Mars in Paris, France."
  "…lattice tower on the Champ de Mars in Paris, France"  -> VERIFIED     (verify_excerpt exact)
  "The Eiffel Tower is located in Berlin, Germany."       -> CONTRADICTED (span includes "Paris, France")
  "The Eiffel Tower is in the capital of France."         -> UNVERIFIED   (source silent; NOT contradicted)

source: "The tower is 324 metres tall."
  "The tower is 330 metres tall."   -> CONTRADICTED or UNVERIFIED via figure guard (must NOT be VERIFIED)

silence guard:
  source: "The museum opened in 2019."
  "Admission is free."              -> UNVERIFIED (NO_CONFLICT — silence is not contradiction)
```

## Guarantees under test

- `verify_excerpt` is unchanged: it is the ONLY path to `VERIFIED`.
- `check_contradiction` is **demote-only**: outputs are limited to `CONTRADICTS`
  / `NO_CONFLICT`, and a `CONTRADICTS` whose `evidence_span` is not verbatim in
  the source is discarded (falls back to `NO_CONFLICT`).
- The **silence guard** (last row) is the one to re-run several times — the
  contradiction check is a model call, so watch that a source silent on the
  claim never drifts to `CONTRADICTED` across repeated runs. `temperature: 0`
  keeps this stable.
