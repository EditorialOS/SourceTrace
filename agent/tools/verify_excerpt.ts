import { defineTool } from "eve/tools";
import { z } from "zod";

// SourceTrace's code-level check: does a claimed excerpt actually rest on the
// source text? The Conductor proposes a status; this tool is the only thing
// allowed to confirm VERIFIED or PARTIALLY_SUPPORTED. A result of `unverifiable`
// means the status MUST be recorded as UNVERIFIED — the model cannot overrule it.

// Normalize for text comparison: lowercase, drop punctuation (so "regions." and
// "regions" match, and a trailing "%" or "," never splits a token off), then
// collapse whitespace. Digits survive; "." inside a number becomes a space, but
// that is symmetric across source and claim so it does not affect matching.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(s: string): Set<string> {
  return new Set(normalize(s).split(" ").filter((w) => w.length > 2));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : intersection / union;
}

// Best token overlap of the claim against any contiguous window of the source
// the claim's length. This lets a short factual excerpt match when it is
// embedded in a long source, without rewarding a global bag-of-words coincidence
// spread across an unrelated document.
function bestWindowSimilarity(claim: string, source: string): number {
  const claimSet = tokenSet(claim);
  if (claimSet.size === 0) return 0;
  const srcTokens = normalize(source)
    .split(" ")
    .filter((w) => w.length > 2);
  const w = claimSet.size;
  if (srcTokens.length <= w) return jaccardSimilarity(claimSet, new Set(srcTokens));
  let best = 0;
  for (let i = 0; i + w <= srcTokens.length; i++) {
    best = Math.max(best, jaccardSimilarity(claimSet, new Set(srcTokens.slice(i, i + w))));
  }
  return best;
}

// Every distinct figure in the claim (price, percentage, count, year) must also
// appear in the source. A swapped number ($39 for $49) then fails outright, even
// though the surrounding sentence is otherwise word-for-word identical — the
// case pure text similarity is worst at, because only one token changed.
function figures(s: string): string[] {
  return s.match(/\d+(?:\.\d+)?/g) ?? [];
}

const FUZZY_THRESHOLD = 0.6;

export default defineTool({
  description:
    "Check whether a claimed excerpt actually appears in a source's text. " +
    "Returns exact_match, fuzzy_match, or unverifiable. Any numeric figure in " +
    "the excerpt (a price, percentage, count, or year) that is absent from the " +
    "source forces unverifiable, so a swapped number cannot pass on wording " +
    "alone. This is the only way a claim may be marked VERIFIED or " +
    "PARTIALLY_SUPPORTED — unverifiable means the claim must be recorded as " +
    "UNVERIFIED, regardless of how plausible the excerpt looks.",
  inputSchema: z.object({
    source_id: z.string().describe("The registered source's id, for the evidence record."),
    source_text: z.string().describe("The full text of the registered source."),
    claimed_excerpt: z.string().describe("The exact excerpt the draft cites as coming from this source."),
  }),
  outputSchema: z.object({
    source_id: z.string(),
    verified: z.boolean(),
    verification_method: z.enum(["exact_match", "fuzzy_match", "unverifiable"]),
    similarity: z.number(),
    reason: z.string().optional(),
  }),
  async execute({ source_id, source_text, claimed_excerpt }) {
    const src = normalize(source_text);
    const claim = normalize(claimed_excerpt);

    // Figure guard first: a mismatched number is a hard, unfakeable failure.
    const srcFigures = new Set(figures(source_text));
    const missing = [...new Set(figures(claimed_excerpt))].filter((n) => !srcFigures.has(n));
    if (missing.length > 0) {
      const score = Math.max(
        jaccardSimilarity(tokenSet(claimed_excerpt), tokenSet(source_text)),
        bestWindowSimilarity(claimed_excerpt, source_text),
      );
      return {
        source_id,
        verified: false,
        verification_method: "unverifiable" as const,
        similarity: Number(score.toFixed(2)),
        reason: `figure(s) not found in source: ${missing.join(", ")}`,
      };
    }

    if (src.includes(claim)) {
      return { source_id, verified: true, verification_method: "exact_match" as const, similarity: 1 };
    }

    const score = Math.max(
      jaccardSimilarity(tokenSet(claimed_excerpt), tokenSet(source_text)),
      bestWindowSimilarity(claimed_excerpt, source_text),
    );

    if (score >= FUZZY_THRESHOLD) {
      return {
        source_id,
        verified: true,
        verification_method: "fuzzy_match" as const,
        similarity: Number(score.toFixed(2)),
      };
    }

    return {
      source_id,
      verified: false,
      verification_method: "unverifiable" as const,
      similarity: Number(score.toFixed(2)),
    };
  },
});
