import { defineAgent } from "eve";
import { anthropic } from "eve/models/anthropic";

export default defineAgent({
  // Claude via your own key: reads ANTHROPIC_API_KEY (or `/login` creds in `eve dev`).
  // Defaults to claude-sonnet-5; pass a model id to anthropic("…") to change it.
  model: anthropic(),
});
