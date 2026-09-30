import { none } from "eve/channels/auth";
import { mcpChannel } from "eve/channels/mcp";

// Publishes this agent as an MCP server at /eve/v1/mcp, exposing the tools
// agent_start / agent_get / agent_update / agent_cancel to MCP clients (Claude).
//
// auth: none() — PUBLIC. Anyone with the URL can invoke the agent, and every
// caller shares the anonymous principal, so an invocation ID acts as a bearer
// capability until workflow retention expires. Chosen intentionally for an open
// endpoint; swap for oauthResource()/jwtHmac()/httpBasic() and redeploy to lock it down.
export default mcpChannel({
  auth: none(),
});
