import { defineTool } from "eve/tools";
import { generateText } from "ai";
import { anthropic } from "eve/models/anthropic";
import { z } from "zod";

// Demote-only companion to verify_excerpt. It can move a claim to CONTRADICTED
// and nothing else. It can never grant VERIFIED — that path stays gated behind
// verify_excerpt's deterministic result. A model is permitted here precisely
// because its only power is to fail a claim, never pass one.
//
// Model idiom mirrors agent.ts: anthropic() from eve/models/anthropic, called
// through the `ai` SDK's generateText. Smallest model (Haiku) + temperature 0 —
// this is a cheap, low-variance relationship judgment, not generation.

const MODEL = "claude-haiku-4-5-20251001";

export default defineTool({
  description:
    "Check whether a source's text AFFIRMATIVELY CONTRADICTS a claim (asserts " +
    "something incompatible with it), as opposed to merely not mentioning it. " +
    "Returns CONTRADICTS or NO_CONFLICT with the exact source span relied on. " +
    "This tool can only fail a claim; it can never mark one verified.",
  inputSchema: z.object({
    source_id: z.string(),
    source_text: z.string(),
    claim: z.string().describe("The claim's exact wording."),
  }),
  outputSchema: z.object({
    source_id: z.string(),
    relation: z.enum(["CONTRADICTS", "NO_CONFLICT"]),
    evidence_span: z.string(),
    confidence: z.number(),
  }),
  async execute({ source_id, source_text, claim }) {
    const raw = await callModel({
      system:
        "You judge only the RELATIONSHIP between a source and a claim. " +
        "Return CONTRADICTS only if the source states something that cannot be " +
        "true at the same time as the claim (different place, number, date, or a " +
        "mutually exclusive fact). If the source is merely silent on the claim, " +
        "return NO_CONFLICT — silence is NOT contradiction. Quote the exact " +
        "source span you relied on for CONTRADICTS. You may not say a claim is " +
        "true or supported.",
      prompt:
        `SOURCE:\n${source_text}\n\nCLAIM:\n${claim}\n\n` +
        `Respond ONLY as JSON: {"relation":"CONTRADICTS"|"NO_CONFLICT",` +
        `"evidence_span":"<verbatim source text or empty>","confidence":0-1}`,
    });

    const r = safeParse(raw);

    // Guard 1: only two outcomes ever leave this tool.
    // Guard 2: a CONTRADICTS whose span is not verbatim in the source is discarded.
    if (r.relation === "CONTRADICTS" && r.evidence_span && source_text.includes(r.evidence_span)) {
      return {
        source_id,
        relation: "CONTRADICTS" as const,
        evidence_span: r.evidence_span,
        confidence: typeof r.confidence === "number" ? r.confidence : 0.5,
      };
    }
    return { source_id, relation: "NO_CONFLICT" as const, evidence_span: "", confidence: 0 };
  },
});

// Wired to the same Anthropic model idiom as agent.ts (anthropic() from
// eve/models/anthropic), via the `ai` SDK. temperature 0 for stability.
async function callModel(args: { system: string; prompt: string }): Promise<string> {
  const { text } = await generateText({
    model: anthropic(MODEL),
    system: args.system,
    prompt: args.prompt,
    temperature: 0,
  });
  return text;
}

function safeParse(s: string): { relation?: string; evidence_span?: string; confidence?: number } {
  try {
    const j = JSON.parse(s.slice(s.indexOf("{"), s.lastIndexOf("}") + 1));
    return j && typeof j === "object" ? j : { relation: "NO_CONFLICT" };
  } catch {
    return { relation: "NO_CONFLICT" };
  }
}
