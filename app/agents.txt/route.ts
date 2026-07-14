import { agentsText } from "../lib/agent-content";

export function GET() {
  return new Response(agentsText(), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}

