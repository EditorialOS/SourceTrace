---
name: evidence-report-and-release-gate
description: Use last, once every claim has a recorded verification result, to assemble the final claim map and release recommendation. Produces the client-facing Claim Check output.
---

# Evidence Report and Release Gate

Assemble the final output from the recorded results — not from a fresh
read of the draft. If a claim's evidence-matcher result said `UNVERIFIED`,
it is `UNVERIFIED` in this report, full stop.

## Output shape

**Claim map** — one row per material or critical claim:
| Claim | Status | Source | Method |

**Missing-evidence queue** — every claim that came back `UNVERIFIED` or
`CONTRADICTED`, listed separately so a human can see at a glance what still
needs a real source.

**Release recommendation** — pick one, in this exact language, no numeric
score attached:

```
VERIFIED — every critical and material claim is supported
SUPPORTED WITH QUALIFICATION — verified once specific wording narrows
CLIENT CONFIRMATION REQUIRED — rests only on the client's own word
SOURCE REQUIRED — no source was supplied for a material claim
REMOVE OR REWRITE — contradicted, or verification failed outright
```

Do not soften this into a percentage or a "looks mostly fine." The
recommendation exists to tell a human exactly what still needs attention
before this goes anywhere.
