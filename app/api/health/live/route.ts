import { noStoreJson } from "../../../lib/security";

export function GET() {
  return noStoreJson({ status: "ok", service: "malabar-coast", time: new Date().toISOString() });
}
